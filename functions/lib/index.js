"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeDocument = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const generative_ai_1 = require("@google/generative-ai");
const params_1 = require("firebase-functions/params");
admin.initializeApp();
const geminiApiKey = (0, params_1.defineSecret)("GEMINI_API_KEY");
exports.analyzeDocument = (0, https_1.onCall)({ secrets: [geminiApiKey] }, async (request) => {
    // 1. Security Check: Ensure user is authenticated
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const { fileBase64, mimeType } = request.data;
    if (!fileBase64 || !mimeType) {
        throw new https_1.HttpsError("invalid-argument", "The function must be called with 'fileBase64' and 'mimeType'.");
    }
    try {
        // 2. Initialize Gemini
        const key = geminiApiKey.value();
        const genAI = new generative_ai_1.GoogleGenerativeAI(key);
        // Use a model that supports vision/multimodal, e.g., gemini-1.5-flash
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
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
    }
    catch (error) {
        console.error("Error analyzing document:", error);
        throw new https_1.HttpsError("internal", "An error occurred while analyzing the document.");
    }
});
//# sourceMappingURL=index.js.map