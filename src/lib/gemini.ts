// GoogleGenerativeAI import removed (unused)

// Initialize Gemini SDK
// In production, this should NOT be used directly in frontend if using an API key.
// But for development/prototyping with a client-side key, or better, the mock below:
// const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export interface ExtractedData {
  documentType: string;
  name: string;
  rut: string; // or ID number
  validUntil: string | null; // ISO Date
  confidence: number;
}

/**
 * Calls the Firebase Cloud Function "analyzeDocument".
 * It accepts a file, converts it to base64, and returns structured JSON.
 */
import { functions } from "./firebase";
import { httpsCallable } from "firebase/functions";

export async function analyzeDocument(file: File): Promise<ExtractedData> {
    console.log("Gemini: Analyzing document via Cloud Function...", file.name);

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64String = (reader.result as string).split(',')[1];
            
            try {
                const analyzeDocument = httpsCallable< { fileBase64: string, mimeType: string }, ExtractedData >(functions, 'analyzeDocument');
                const result = await analyzeDocument({
                    fileBase64: base64String,
                    mimeType: file.type
                });
                
                console.log("Cloud Function Result:", result.data);
                resolve(result.data);
            } catch (error) {
                console.error("Error calling Cloud Function:", error);
                // Fallback to mock for demo if function fails (e.g., no billing)
                console.warn("Falling back to local mock due to error.");
                setTimeout(() => {
                    resolve({
                        documentType: "unknown",
                        name: "Fallback Mock",
                        rut: "11.111.111-1",
                        validUntil: null,
                        confidence: 0.1
                    });
                }, 1000);
            }
        };
        reader.onerror = (error) => reject(error);
    });
}

