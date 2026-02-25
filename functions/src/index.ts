import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { defineSecret } from "firebase-functions/params";

admin.initializeApp();

const geminiApiKey = defineSecret("GEMINI_API_KEY");

interface AnalyzeDocumentData {
  fileBase64: string;
  mimeType: string;
}

export const analyzeDocument = onCall({ secrets: [geminiApiKey] }, async (request) => {
  // 1. Security Check: Ensure user is authenticated
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const { fileBase64, mimeType } = request.data as AnalyzeDocumentData;

  if (!fileBase64 || !mimeType) {
    throw new HttpsError(
      "invalid-argument",
      "The function must be called with 'fileBase64' and 'mimeType'."
    );
  }

  try {
    // 2. Initialize Gemini
    const key = geminiApiKey.value();
    const genAI = new GoogleGenerativeAI(key);
    // Use a model that supports vision/multimodal, e.g., gemini-1.5-flash
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 3. Prepare the prompt
    const prompt = `
      You are an expert legal document analyzer for a Chilean LegalTech company.
      Analyze the provided image/document.
      Return a JSON object with the following fields:
      - documentType: "poder_legal" | "cedula" | "unknown"
      - name: The full name of the person or entity found.
      - rut: The RUT or ID number found.
      - validUntil: ISO 8601 date string if a validity date is found, else null.
      - confidence: A number between 0 and 1 representing your confidence.
      
      Only return the JSON. Do not include markdown formatting.
    `;

    // 4. Call Gemini
    const imagePart = {
      inlineData: {
        data: fileBase64,
        mimeType: mimeType,
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();

    console.log("Gemini Response:", responseText);

    // 5. Parse and Return JSON
    // Clean up potential markdown code blocks
    const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsedData = JSON.parse(cleanedText);

    // 6. Log to Firestore (Bitácora)
    await admin.firestore().collection("logs").add({
      otId: "temp-analysis", // Linked when confirmed?
      userId: request.auth.uid,
      action: `Document Analysis: ${parsedData.documentType}`,
      type: "system",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      confidence: parsedData.confidence
    });

    return parsedData;

  } catch (error) {
    console.error("Error analyzing document:", error);
    throw new HttpsError(
      "internal",
      "An error occurred while analyzing the document."
    );
  }

});

// Pipefy Webhook
export { createOTFromPipefy } from './pipefy';

// Reminders & Automation
export { checkDocumentDeadlines, triggerDeadlinesCheck } from './reminders';
