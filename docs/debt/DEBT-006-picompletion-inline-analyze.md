# DEBT-006 — Logo y cédula inline no llaman analyzeDocument

| Field        | Value                                                 |
|--------------|-------------------------------------------------------|
| Captured     | 2026-04-27                                            |
| Severity     | Medium                                                |
| Status       | Open                                                  |
| File(s)      | src/pages/PICompletionPage.tsx (logo + cédula upload) |
| Blocker?     | Post-pilot                                            |
| Effort       | S                                                     |

## Problem
Los handlers de subida de logo y cédula en PICompletionPage crean el
documento con status 'validating_ai' pero no llaman a analyzeDocument
después. El documento queda esperando revisión manual permanente. La
auto-aprobación con Gemini (confidence > 0.85) solo se activa para
uploads que pasan por el componente DocumentUpload (POA con firma sí
la usa).

## Proposed solution
Después del addDoc que crea el documento, llamar:
  await analyzeDocument(file, docRef.id, otId)

Manejar errores con try/catch para que un fallo de Gemini no rompa
el flujo de subida del cliente. analyzeDocument está en src/lib/gemini.ts.
