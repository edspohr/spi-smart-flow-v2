import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { defineSecret } from "firebase-functions/params";
import * as Sentry from "@sentry/node";

import { registerPipefyHandlers } from './pipefy';
import { registerReminderHandlers } from './reminders';

admin.initializeApp();

// Sentry: only initializes when SENTRY_DSN env var is set in the Functions environment.
// Set it via: firebase functions:config:set sentry.dsn="https://..."
// or as a plain environment variable in the Cloud Functions console.
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.FUNCTIONS_EMULATOR ? 'development' : 'production',
    tracesSampleRate: 0.1,
  });
}
const db = admin.firestore();

const geminiApiKey = defineSecret("GEMINI_API_KEY");

const AUTO_APPROVE_CONFIDENCE_THRESHOLD = 0.85;

interface AnalyzeDocumentData {
  fileBase64: string;
  mimeType: string;
  docId?: string;  // Firestore document ID to auto-update on approval
  otId?: string;   // OT ID for audit log linkage
}

export const analyzeDocument = onCall(
  { secrets: [geminiApiKey], timeoutSeconds: 60, memory: '512MiB' },
  async (request) => {
  // 1. Security Check
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
  }

  const { fileBase64, mimeType, docId, otId } = request.data as AnalyzeDocumentData;

  if (!fileBase64 || !mimeType) {
    throw new HttpsError("invalid-argument", "The function must be called with 'fileBase64' and 'mimeType'.");
  }

  try {
    // 2. Initialize Gemini
    const key = geminiApiKey.value();
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 3. Prompt — includes requiresManualReview for auto-approval gating
    const prompt = `
      You are an expert legal document analyzer for a Chilean LegalTech company.
      Analyze the provided image/document.
      Return a JSON object with the following fields:
      - documentType: "poder_legal" | "cedula" | "logo" | "unknown"
      - name: The full name of the person or entity found.
      - rut: The RUT or ID number found (null if not present).
      - validUntil: ISO 8601 date string if a validity/expiry date is found, else null.
      - confidence: A number between 0 and 1 representing your confidence in the extraction.
      - requiresManualReview: true if the document is unclear, damaged, partially visible, or contains anomalies; false otherwise.

      Only return the JSON. Do not include markdown formatting.
    `;

    // 4. Call Gemini
    const imagePart = { inlineData: { data: fileBase64, mimeType } };
    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();
    console.log("Gemini Response:", responseText);

    // 5. Parse response
    const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsedData = JSON.parse(cleanedText);

    // 6. Auto-approval logic
    const canAutoApprove =
      docId &&
      parsedData.confidence > AUTO_APPROVE_CONFIDENCE_THRESHOLD &&
      parsedData.requiresManualReview === false;

    let autoApproved = false;

    if (canAutoApprove) {
      const docRef = db.collection("documents").doc(docId!);
      await docRef.update({
        status: "validated",
        isVaultEligible: true,
        validationMetadata: parsedData,
        validUntil: parsedData.validUntil || null,
        autoApprovedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      autoApproved = true;
      console.log(`Auto-approved document ${docId} (confidence: ${parsedData.confidence})`);
    }

    // 7. Audit log
    await db.collection("logs").add({
      otId: otId || "temp-analysis",
      userId: request.auth.uid,
      action: autoApproved
        ? `Documento Auto-Aprobado por IA: ${parsedData.documentType} (confianza: ${(parsedData.confidence * 100).toFixed(0)}%)`
        : `Análisis IA: ${parsedData.documentType} (confianza: ${(parsedData.confidence * 100).toFixed(0)}%, revisión manual: ${parsedData.requiresManualReview})`,
      type: "system",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      metadata: { confidence: parsedData.confidence, docId: docId || null, autoApproved },
    });

    return { ...parsedData, autoApproved };

  } catch (error) {
    console.error("Error analyzing document:", error);
    Sentry.captureException(error, { extra: { docId, otId, mimeType } });
    throw new HttpsError("internal", "An error occurred while analyzing the document.");
  }
});

// Create User (Admin SDK — spi-admin only)
interface CreateUserData {
  email: string;
  password: string;
  displayName: string;
  role: 'spi-admin' | 'client' | 'guest';
  companyId?: string;
}

export const createUser = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated.');
  }

  // Verify caller is spi-admin
  const callerDoc = await db.collection('users').doc(request.auth.uid).get();
  if (!callerDoc.exists || (callerDoc.data() as any)?.role !== 'spi-admin') {
    throw new HttpsError('permission-denied', 'Only SPI admins can create users.');
  }

  const { email, password, displayName, role, companyId } = request.data as CreateUserData;
  if (!email || !password || !role) {
    throw new HttpsError('invalid-argument', 'email, password and role are required.');
  }

  try {
    const userRecord = await admin.auth().createUser({ email, password, displayName });
    await db.collection('users').doc(userRecord.uid).set({
      email,
      displayName: displayName || '',
      role,
      companyId: companyId || '',
      disabled: false,
      createdAt: new Date().toISOString(),
    });
    await db.collection('logs').add({
      otId: 'system',
      userId: request.auth.uid,
      action: `Usuario creado: ${email} (${role})`,
      type: 'system',
      timestamp: new Date().toISOString(),
    });
    return { uid: userRecord.uid };
  } catch (error) {
    console.error('Error creating user:', error);
    Sentry.captureException(error, { extra: { email, role } });
    throw new HttpsError('internal', (error as any).message || 'Error creating user.');
  }
});

// Pipefy Webhook
const { createOTFromPipefy } = registerPipefyHandlers(db);
export { createOTFromPipefy };

// Reminders & Automation
const { checkDocumentDeadlines, triggerDeadlinesCheck } = registerReminderHandlers(db);
export { checkDocumentDeadlines, triggerDeadlinesCheck };
