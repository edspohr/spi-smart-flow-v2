import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// ── Body text constants ───────────────────────────────────────────────────────

const POA_BODY_SPANISH = `Registros de marcas, lemas comerciales, dibujos y diseños industriales, patentes de invención y de modelos de utilidad; depósitos de nombres y enseñas comerciales; depósitos de derechos de autor; nombres de dominio; y en general cualquier tipo derecho de propiedad industrial y propiedad intelectual relacionado con nuestros productos, marcas y/o intereses.

Así como para que presenten oposiciones, recursos de apelación, revocaciones, renovaciones, acciones de cancelación, acciones de nulidad, acciones de competencia desleal y cualquier otro asunto relacionado con nuestros derechos de propiedad industrial e intelectual. También podrán solicitar inscripciones de transferencia, firmar las inscripciones de transferencia, solicitar cambio de domicilio, de nombre, y de cualquier otro dato dentro de nuestros registros.

Actuar como nuestro apoderado cuando seamos demandantes o demandados en cualquier instancia o recurso ante cualquier Juez, corporación, funcionario público o autoridad en acciones judiciales, administrativas, Tribunal y/o acciones policivas.

Este poder abarca las siguientes facultades: ratificar, confirmar, desistir de nuestros derechos, resolver, conciliar y comprometerse, sustituir este poder total o parcialmente y revocar las sustituciones, para recibir notificaciones y nombrar apoderados judiciales o extrajudiciales, iniciar ante las autoridades judiciales y/o administrativas y/o policivas todas las acciones necesarias para proteger todos nuestros derechos.`;

const POA_BODY_ENGLISH = `Trademarks, slogans, industrial draws and designs, patents, utility models; commercial names and signs; copyrights filing; domain names; and in general any type of Industrial Property and Intellectual Property Rights related with our products, trademarks and/or interest.

As well as to submit oppositions (objections), appeals, renewals, cancellation actions, nullity actions, actions of unfair competition and all matters relating to any right of industrial and intellectual property. Also be able to request transfers, sign transfer filings, change of address and name, and any other change to an application or registration to obtain.

Act as our attorney as Plaintiffs or Defendants in any instance or appeals before any Judge, Corporation, Public official or Authority in Judicial, Administrative and/or Police actions.

This Power of Attorney includes the following faculties; to ratify, to confirm, to desist to our rights, settle and compromise; to substitute this Power of Attorney in whole or in part, and to revoke substitutions; to receive notifications, to designate judicial or extrajudicial attorneys, to initiate before the respective Judicial and/or Administrative and/or Police Authorities all of the actions needed in order to protect all our rights.`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDateDMY(d: Date): string {
  const day   = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year  = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatDateEnglish(d: Date): string {
  const months = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/** Wrap text into lines that fit within `maxWidth` at the given font size. */
function wrapText(text: string, font: any, size: number, maxWidth: number): string[] {
  const paragraphs = text.split('\n');
  const lines: string[] = [];

  for (const para of paragraphs) {
    if (!para.trim()) {
      lines.push('');
      continue;
    }
    const words = para.split(' ');
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      const w = font.widthOfTextAtSize(candidate, size);
      if (w > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

// ── Params ────────────────────────────────────────────────────────────────────

export interface GeneratePOAParams {
  signerName: string;
  companyName: string;
  domicile: string;
  city: string;
  country: string;
  signatureDataUrl: string; // base64 PNG
  documentRef: string;
  signedAt: Date;
  expiresAt: Date;
  attorneyName?: string;
}

// ── Main generator ────────────────────────────────────────────────────────────

export async function generatePOAPdf(params: GeneratePOAParams): Promise<Uint8Array> {
  const {
    signerName, companyName, domicile, city, country,
    signatureDataUrl, documentRef, signedAt, expiresAt,
  } = params;

  const attorney = params.attorneyName || 'SERVICIOS DE PROPIEDAD INDUSTRIAL S.A.S SPI S.A.S.';

  const pdfDoc   = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontReg  = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Embed signature image
  const sigBase64 = signatureDataUrl.replace(/^data:image\/png;base64,/, '');
  const sigBytes  = Uint8Array.from(atob(sigBase64), (c) => c.charCodeAt(0));
  const sigImage  = await pdfDoc.embedPng(sigBytes);

  // Page dimensions & margins
  const W = 595, H = 842, M = 60;
  const contentWidth = W - M * 2;

  // Footer text
  const footerText = `Documento generado digitalmente por SPI Smart Flow  |  Ref: ${documentRef}  |  ${signedAt.toISOString()} UTC`;

  // ── Helper: draw a full page ────────────────────────────────────────────────

  const drawPage = (
    titleText: string,
    introLines: string,
    bodyText: string,
    dateLabel: string,
    validityLabel: string,
    signedAtFormatted: string,
    expiresAtFormatted: string,
    signerTitle: string,
  ) => {
    const page = pdfDoc.addPage([W, H]);
    let y = H - M;

    // ── Title ──
    const titleW = fontBold.widthOfTextAtSize(titleText, 16);
    page.drawText(titleText, {
      x: (W - titleW) / 2, y,
      size: 16, font: fontBold, color: rgb(0, 0, 0),
    });
    y -= 28;

    // ── Thin separator ──
    page.drawLine({
      start: { x: M, y },
      end:   { x: W - M, y },
      thickness: 0.5, color: rgb(0.7, 0.7, 0.7),
    });
    y -= 18;

    // ── Intro paragraph ──
    const introWrapped = wrapText(introLines, fontReg, 10, contentWidth);
    for (const line of introWrapped) {
      if (y < M + 60) { y = H - M; }
      page.drawText(line, { x: M, y, size: 10, font: fontReg, color: rgb(0, 0, 0) });
      y -= 14;
    }
    y -= 6;

    // ── Body text ──
    const bodyLines = wrapText(bodyText, fontReg, 10, contentWidth);
    for (const line of bodyLines) {
      if (y < M + 80) {
        // Would overflow — stop (in practice body fits on one page)
        break;
      }
      page.drawText(line, { x: M, y, size: 10, font: fontReg, color: rgb(0.15, 0.15, 0.15) });
      y -= 14;
    }
    y -= 10;

    // ── Location / date / validity ──
    const meta = [
      `${dateLabel} ${city}, ${country}`,
      `${validityLabel} ${signedAtFormatted} — ${expiresAtFormatted}`,
    ];
    for (const line of meta) {
      page.drawText(line, { x: M, y, size: 10, font: fontReg, color: rgb(0, 0, 0) });
      y -= 16;
    }
    y -= 20;

    // ── Signature image (centered, 200×80) ──
    const sigW = 200, sigH = 80;
    const sigX = (W - sigW) / 2;
    const sigY = y - sigH;
    page.drawImage(sigImage, { x: sigX, y: sigY, width: sigW, height: sigH });
    y = sigY - 12;

    // ── Signature line + name ──
    const lineW = 240;
    const lineX = (W - lineW) / 2;
    page.drawLine({
      start: { x: lineX, y },
      end:   { x: lineX + lineW, y },
      thickness: 0.8, color: rgb(0, 0, 0),
    });
    y -= 14;

    const nameW  = fontBold.widthOfTextAtSize(signerName, 10);
    page.drawText(signerName, {
      x: (W - nameW) / 2, y,
      size: 10, font: fontBold, color: rgb(0, 0, 0),
    });
    y -= 14;

    const subtitleText = `${signerTitle} — ${companyName}`;
    const subtitleW    = fontReg.widthOfTextAtSize(subtitleText, 9);
    page.drawText(subtitleText, {
      x: (W - subtitleW) / 2, y,
      size: 9, font: fontReg, color: rgb(0.3, 0.3, 0.3),
    });

    // ── Footer ──
    const footerW = fontReg.widthOfTextAtSize(footerText, 7);
    page.drawLine({
      start: { x: M, y: M + 18 },
      end:   { x: W - M, y: M + 18 },
      thickness: 0.4, color: rgb(0.75, 0.75, 0.75),
    });
    page.drawText(footerText, {
      x: (W - footerW) / 2, y: M + 6,
      size: 7, font: fontReg, color: rgb(0.55, 0.55, 0.55),
    });
  };

  // ── Page 1 — Spanish ────────────────────────────────────────────────────────

  const introES =
    `${signerName}, domiciliado en ${domicile} actuando en mi calidad de ` +
    `Representante Legal de ${companyName}, sociedad con domicilio en ${domicile}, ` +
    `por el presente otorgo poder a ${attorney}, ` +
    `y/o Eduardo Dorado Sánchez, y/o Luisa Fernanda Parra de ` +
    `Bogotá, Colombia, con el fin de solicitar y obtener de las Autoridades ` +
    `Administrativas de Colombia y países de América Latina:`;

  drawPage(
    'P O D E R',
    introES,
    POA_BODY_SPANISH,
    `Otorgado y firmado en`,
    `Vigencia:`,
    formatDateDMY(signedAt),
    formatDateDMY(expiresAt),
    'Representante Legal',
  );

  // ── Page 2 — English ────────────────────────────────────────────────────────

  const introEN =
    `${signerName}, domiciled in ${domicile} acting in my capacity of Legal ` +
    `Representative of ${companyName}, a corporation with domicile in ${domicile} ` +
    `hereby grant Power of Attorney to ${attorney} ` +
    `and/or Eduardo Dorado Sánchez, and/or Luisa Fernanda Parra from ` +
    `Bogotá, Colombia, in order to apply and obtain from the Administrative ` +
    `Authorities of Colombia and countries around Latin-American:`;

  drawPage(
    'P O W E R  O F  A T T O R N E Y',
    introEN,
    POA_BODY_ENGLISH,
    `Granted and Signed in`,
    `Validity:`,
    formatDateEnglish(signedAt),
    formatDateEnglish(expiresAt),
    'Legal Representative',
  );

  return pdfDoc.save();
}
