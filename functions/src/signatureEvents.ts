import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as Sentry from '@sentry/node';
import { createHash } from 'crypto';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// NOTE: The FULL consent text is duplicated in src/lib/signatureConsent.ts for
// the frontend. Keep both in sync if the legal wording ever changes.
export const CONSENT_DECLARATION_ES = `El firmante manifiesta su consentimiento electrónico expreso al contenido de este Poder, conforme al Artículo 7 de la Ley 527 de 1999 de la República de Colombia y normas equivalentes de Chile (Ley 19.799 sobre Documentos Electrónicos), Perú (Ley 27.269 de Firmas y Certificados Digitales), Ecuador (Ley de Comercio Electrónico, Firmas y Mensajes de Datos — Ley 67), y México (Título Segundo del Libro Segundo del Código de Comercio).

La presente firma electrónica tiene los mismos efectos jurídicos que una firma manuscrita. El firmante declara conocer y aceptar que la evidencia técnica de la firma — dirección IP, identificador del dispositivo, fecha y hora UTC, y huella criptográfica SHA-256 del documento — queda registrada de forma inmutable en un ledger auditable, y constituye prueba suficiente de la autenticidad e integridad de la firma.`;

const LEGAL_FRAMEWORK = 'Ley 527 de 1999 (Colombia) + normas equivalentes LATAM';

interface RegisterSignatureEventData {
  otId: string;
  requirementId: string;
  documentId: string;
  pdfStoragePath: string;
}

interface EvidenceFields {
  userName: string;
  userEmail: string;
  companyName: string;
  ip: string;
  userAgent: string;
  timestampISO: string;
  signatureEventId: string;
  pdfOriginalHash: string;
}

function extractIp(rawRequest: any): string {
  const xff = rawRequest?.headers?.['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length > 0) {
    return xff.split(',')[0].trim();
  }
  if (Array.isArray(xff) && xff.length > 0) {
    const first = xff[0];
    if (typeof first === 'string') return first.split(',')[0].trim();
  }
  return rawRequest?.ip || rawRequest?.connection?.remoteAddress || 'unknown';
}

function extractUserAgent(rawRequest: any): string {
  const ua = rawRequest?.headers?.['user-agent'];
  if (typeof ua === 'string') return ua;
  return 'unknown';
}

function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

async function buildEvidencePage(
  pdfBytes: Uint8Array,
  fields: EvidenceFields,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(pdfBytes);
  const page = pdf.addPage([595, 842]); // A4
  const margin = 40;
  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const helvBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const courier = await pdf.embedFont(StandardFonts.Courier);

  const slate900 = rgb(0.05, 0.08, 0.13);
  const slate600 = rgb(0.32, 0.38, 0.45);
  const slate300 = rgb(0.8, 0.82, 0.87);

  let y = 842 - margin;

  // Header
  page.drawText('EVIDENCIA TÉCNICA DE FIRMA ELECTRÓNICA', {
    x: margin,
    y,
    size: 12,
    font: helvBold,
    color: slate900,
  });
  y -= 16;
  page.drawText('LEY 527 DE 1999 + NORMAS EQUIVALENTES LATAM', {
    x: margin,
    y,
    size: 9,
    font: helv,
    color: slate600,
  });
  y -= 10;
  page.drawLine({
    start: { x: margin, y },
    end: { x: 595 - margin, y },
    thickness: 0.8,
    color: slate300,
  });
  y -= 22;

  // Evidence rows (Courier)
  const rows: Array<[string, string]> = [
    ['Firmante', `${fields.userName} (${fields.userEmail})`],
    ['Empresa', fields.companyName],
    ['Dirección IP', fields.ip],
    ['Dispositivo (UA)', fields.userAgent],
    ['Fecha y hora UTC', fields.timestampISO],
    ['ID de evento', fields.signatureEventId],
    ['Huella SHA-256', fields.pdfOriginalHash],
  ];

  const labelWidth = 130;
  const valueMaxWidth = 595 - margin - labelWidth - 8;

  function wrapText(text: string, font: any, size: number, maxWidth: number): string[] {
    const words = text.split(/(\s+|(?<=.{40}))/);
    const lines: string[] = [];
    let current = '';
    for (const w of words) {
      const candidate = current + w;
      const width = font.widthOfTextAtSize(candidate, size);
      if (width > maxWidth && current) {
        lines.push(current);
        current = w.trimStart();
      } else {
        current = candidate;
      }
    }
    if (current) lines.push(current);
    return lines;
  }

  for (const [label, value] of rows) {
    page.drawText(`${label}:`, {
      x: margin,
      y,
      size: 9,
      font: helvBold,
      color: slate900,
    });
    const lines = wrapText(value, courier, 8.5, valueMaxWidth);
    for (const line of lines) {
      page.drawText(line, {
        x: margin + labelWidth,
        y,
        size: 8.5,
        font: courier,
        color: slate900,
      });
      y -= 12;
    }
    y -= 3;
  }

  y -= 8;
  page.drawLine({
    start: { x: margin, y },
    end: { x: 595 - margin, y },
    thickness: 0.8,
    color: slate300,
  });
  y -= 22;

  // Consent declaration
  page.drawText('Declaración de consentimiento', {
    x: margin,
    y,
    size: 10,
    font: helvBold,
    color: slate900,
  });
  y -= 18;

  const proseMaxWidth = 595 - margin * 2;
  const paragraphs = CONSENT_DECLARATION_ES.split(/\n\n+/);
  for (const para of paragraphs) {
    const lines = wrapText(para.trim(), helv, 9, proseMaxWidth);
    for (const line of lines) {
      page.drawText(line, {
        x: margin,
        y,
        size: 9,
        font: helv,
        color: slate900,
      });
      y -= 12;
    }
    y -= 6;
  }

  // Footer
  page.drawText(
    'Este documento incluye una página de evidencia técnica generada automáticamente.',
    { x: margin, y: margin + 14, size: 7.5, font: helv, color: slate600 },
  );
  page.drawText(
    'Cualquier modificación posterior invalida la firma.',
    { x: margin, y: margin + 4, size: 7.5, font: helv, color: slate600 },
  );

  return pdf.save();
}

export const registerSignatureEvent = onCall(
  { memory: '512MiB', timeoutSeconds: 60 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Auth required.');
    }

    const { otId, requirementId, documentId, pdfStoragePath } =
      request.data as RegisterSignatureEventData;

    if (!otId || !requirementId || !documentId || !pdfStoragePath) {
      throw new HttpsError(
        'invalid-argument',
        'otId, requirementId, documentId, pdfStoragePath are required.',
      );
    }

    const db = admin.firestore();
    const storage = admin.storage();
    const uid = request.auth.uid;

    try {
      // 1. Resolve user + role
      const userSnap = await db.collection('users').doc(uid).get();
      if (!userSnap.exists) {
        throw new HttpsError('permission-denied', 'User profile not found.');
      }
      const userData = userSnap.data() as any;
      const role = userData.role;
      if (role !== 'client' && role !== 'spi-admin') {
        throw new HttpsError('permission-denied', 'Role not allowed.');
      }

      // 2. Resolve OT + company ownership check
      const otSnap = await db.collection('ots').doc(otId).get();
      if (!otSnap.exists) {
        throw new HttpsError('not-found', 'OT not found.');
      }
      const otData = otSnap.data() as any;
      if (role !== 'spi-admin' && otData.companyId !== userData.companyId) {
        throw new HttpsError('permission-denied', 'OT not in user company.');
      }

      const companySnap = await db.collection('companies').doc(otData.companyId).get();
      const companyName = companySnap.exists
        ? (companySnap.data() as any).name || otData.companyId
        : otData.companyId;

      // 3. Capture evidence
      const ip = extractIp(request.rawRequest);
      const userAgent = extractUserAgent(request.rawRequest);
      const now = new Date();
      const timestampISO = now.toISOString();
      const userName =
        userData.name || userData.displayName || request.auth.token.email || 'desconocido';
      const userEmail = userData.email || request.auth.token.email || '';

      // 4. Download original PDF
      const bucket = storage.bucket();
      const file = bucket.file(pdfStoragePath);
      const [exists] = await file.exists();
      if (!exists) {
        throw new HttpsError('not-found', 'PDF not found in storage.');
      }
      const [pdfBytes] = await file.download();
      const originalHash = sha256(pdfBytes);

      // 5. Pre-reserve event doc id (used in evidence page body + log ref)
      const eventRef = db.collection('signatureEvents').doc();
      const signatureEventId = eventRef.id;

      // 6. Build evidence-appended PDF
      let finalPdfBytes: Uint8Array;
      try {
        finalPdfBytes = await buildEvidencePage(pdfBytes, {
          userName,
          userEmail,
          companyName,
          ip,
          userAgent,
          timestampISO,
          signatureEventId,
          pdfOriginalHash: originalHash,
        });
      } catch (e) {
        throw new HttpsError('invalid-argument', 'PDF_INVALID');
      }
      const finalHash = sha256(finalPdfBytes);

      // 7. Upload final PDF (keep original untouched as archive)
      const finalPath = `ots/${otId}/poderes/${documentId}_final.pdf`;
      const finalFile = bucket.file(finalPath);
      await finalFile.save(Buffer.from(finalPdfBytes), {
        contentType: 'application/pdf',
        metadata: { metadata: { signatureEventId, originalHash, finalHash } },
      });
      // Generate a long-lived signed URL (works whether the bucket is public or not).
      const [finalUrl] = await finalFile.getSignedUrl({
        action: 'read',
        expires: Date.now() + 1000 * 60 * 60 * 24 * 365 * 5, // 5 years
      });

      // 8. Write immutable signatureEvent
      await eventRef.set({
        otId,
        requirementId,
        documentId,
        userId: uid,
        userEmail,
        userName,
        companyId: otData.companyId,
        companyName,
        ip,
        userAgent,
        timestampUTC: admin.firestore.FieldValue.serverTimestamp(),
        timestampISO,
        pdfOriginalHash: originalHash,
        pdfFinalHash: finalHash,
        pdfOriginalPath: pdfStoragePath,
        pdfFinalPath: finalPath,
        consentDeclaration: CONSENT_DECLARATION_ES,
        legalFramework: LEGAL_FRAMEWORK,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 9. Update Document record
      await db.collection('documents').doc(documentId).update({
        url: finalUrl,
        fileUrl: finalUrl,
        signatureEventId,
        reinforcedSignature: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 10. Write parallel log entry (bell picks it up via Phase 3 whitelist)
      await db.collection('logs').add({
        action: 'Poder firmado',
        otId,
        requirementId,
        documentId,
        userId: uid,
        userName,
        actor: uid,
        type: 'system',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        metadata: { signatureEventId, documentId, requirementId },
      });

      logger.info(
        `Signature event ${signatureEventId} registered for OT ${otId} by ${uid}`,
      );

      return {
        signatureEventId,
        finalPdfUrl: finalUrl,
        finalPdfHash: finalHash,
      };
    } catch (err: any) {
      if (err instanceof HttpsError) throw err;
      logger.error('registerSignatureEvent failed:', err);
      Sentry.captureException(err, {
        extra: { otId, requirementId, documentId, uid },
      });
      throw new HttpsError('internal', 'Failed to register signature event.');
    }
  },
);
