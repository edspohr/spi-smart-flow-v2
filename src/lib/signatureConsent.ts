// NOTE: The full legal text (CONSENT_DECLARATION_ES) is also defined in
// functions/src/signatureEvents.ts — keep both strings in sync if the legal
// wording ever changes. The backend version is the one embedded into the signed
// PDF's evidence page and stored in the signatureEvents ledger. This frontend
// mirror exists so the signing modal can render the short acknowledgment.

export const CONSENT_DECLARATION_ES = `El firmante manifiesta su consentimiento electrónico expreso al contenido de este Poder, conforme al Artículo 7 de la Ley 527 de 1999 de la República de Colombia y normas equivalentes de Chile (Ley 19.799 sobre Documentos Electrónicos), Perú (Ley 27.269 de Firmas y Certificados Digitales), Ecuador (Ley de Comercio Electrónico, Firmas y Mensajes de Datos — Ley 67), y México (Título Segundo del Libro Segundo del Código de Comercio).

La presente firma electrónica tiene los mismos efectos jurídicos que una firma manuscrita. El firmante declara conocer y aceptar que la evidencia técnica de la firma — dirección IP, identificador del dispositivo, fecha y hora UTC, y huella criptográfica SHA-256 del documento — queda registrada de forma inmutable en un ledger auditable, y constituye prueba suficiente de la autenticidad e integridad de la firma.`;

// Short form shown as the checkbox label in PowerOfAttorneySigningModal.
export const CONSENT_DECLARATION_ES_SHORT =
  'Acepto firmar electrónicamente este Poder conforme a la Ley 527 de 1999 de Colombia y normas equivalentes LATAM. Entiendo que la evidencia técnica de mi firma quedará registrada.';
