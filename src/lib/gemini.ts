import { functions } from "./firebase";
import { httpsCallable } from "firebase/functions";

export interface ExtractedData {
  documentType: string;
  name: string;
  rut: string | null;
  validUntil: string | null;
  confidence: number;
  requiresManualReview: boolean;
  autoApproved: boolean;
}

/**
 * Calls the Firebase Cloud Function "analyzeDocument".
 * Converts the file to base64, sends it to Gemini 1.5 Flash, and returns
 * structured metadata. If confidence > 0.85 and requiresManualReview is false,
 * the Cloud Function auto-updates the document status to "validated" server-side.
 *
 * @param file       The file to analyze.
 * @param docId      Optional Firestore document ID — enables server-side auto-approval.
 * @param otId       Optional OT ID — used for audit log linkage.
 */
export async function analyzeDocument(
  file: File,
  docId?: string,
  otId?: string
): Promise<ExtractedData> {
  console.log("Gemini: Analyzing document via Cloud Function...", file.name);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64String = (reader.result as string).split(',')[1];

      try {
        const callFn = httpsCallable<
          { fileBase64: string; mimeType: string; docId?: string; otId?: string },
          ExtractedData
        >(functions, 'analyzeDocument');

        const result = await callFn({
          fileBase64: base64String,
          mimeType: file.type,
          ...(docId && { docId }),
          ...(otId && { otId }),
        });

        console.log("Cloud Function Result:", result.data);
        resolve(result.data);
      } catch (error) {
        console.error("Error calling Cloud Function:", error);
        // Fallback mock for dev/demo when function is unavailable
        console.warn("Falling back to local mock.");
        setTimeout(() => {
          resolve({
            documentType: "unknown",
            name: "Fallback Mock",
            rut: "11.111.111-1",
            validUntil: null,
            confidence: 0.1,
            requiresManualReview: true,
            autoApproved: false,
          });
        }, 1000);
      }
    };

    reader.onerror = (error) => reject(error);
  });
}
