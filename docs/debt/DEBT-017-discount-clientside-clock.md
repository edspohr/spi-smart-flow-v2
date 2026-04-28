# DEBT-017 — Reloj del countdown corre client-side

| Field        | Value                                |
|--------------|--------------------------------------|
| Captured     | 2026-04-27                           |
| Severity     | Low                                  |
| Status       | Open                                 |
| File(s)      | src/components/DiscountCountdown.tsx |
| Blocker?     | Post-pilot                           |
| Effort       | M                                    |

## Problem
computeCountdown usa Date.now() del navegador. Un cliente puede
manipular el reloj de su sistema o el JavaScript ejecutado para que
el countdown muestre tiempo "extra". El descuento real se resuelve
server-side en updateOTStage cuando el stage llega a 'finalizado',
así que la manipulación es solo cosmética — pero genera expectativas
falsas en el cliente.

## Proposed solution
1. Sincronizar el "now" con Firebase server timestamp al cargar la
   página: leer admin.firestore.FieldValue.serverTimestamp() y
   calcular offset
2. Aplicar offset a Date.now() en computeCountdown
3. Considerar mostrar warning si offset > 5 minutos
Mejora menor — el descuento real ya es server-validated.
