"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerDeadlinesCheck = exports.checkDocumentDeadlines = exports.createOTFromPipefy = exports.analyzeDocument = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const generative_ai_1 = require("@google/generative-ai");
const params_1 = require("firebase-functions/params");
const pipefy_1 = require("./pipefy");
const reminders_1 = require("./reminders");
admin.initializeApp();
const db = admin.firestore();
const geminiApiKey = (0, params_1.defineSecret)("GEMINI_API_KEY");
const AUTO_APPROVE_CONFIDENCE_THRESHOLD = 0.85;
exports.analyzeDocument = (0, https_1.onCall)({ secrets: [geminiApiKey] }, async (request) => {
    // 1. Security Check
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const { fileBase64, mimeType, docId, otId } = request.data;
    if (!fileBase64 || !mimeType) {
        throw new https_1.HttpsError("invalid-argument", "The function must be called with 'fileBase64' and 'mimeType'.");
    }
    try {
        // 2. Initialize Gemini
        const key = geminiApiKey.value();
        const genAI = new generative_ai_1.GoogleGenerativeAI(key);
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
        const canAutoApprove = docId &&
            parsedData.confidence > AUTO_APPROVE_CONFIDENCE_THRESHOLD &&
            parsedData.requiresManualReview === false;
        let autoApproved = false;
        if (canAutoApprove) {
            const docRef = db.collection("documents").doc(docId);
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
        return Object.assign(Object.assign({}, parsedData), { autoApproved });
    }
    catch (error) {
        console.error("Error analyzing document:", error);
        throw new https_1.HttpsError("internal", "An error occurred while analyzing the document.");
    }
});
// Pipefy Webhook
const { createOTFromPipefy } = (0, pipefy_1.registerPipefyHandlers)(db);
exports.createOTFromPipefy = createOTFromPipefy;
// Reminders & Automation
const { checkDocumentDeadlines, triggerDeadlinesCheck } = (0, reminders_1.registerReminderHandlers)(db);
exports.checkDocumentDeadlines = checkDocumentDeadlines;
exports.triggerDeadlinesCheck = triggerDeadlinesCheck;
//# sourceMappingURL=index.js.map