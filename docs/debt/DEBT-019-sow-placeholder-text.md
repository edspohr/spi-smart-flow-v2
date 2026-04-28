# DEBT-019 — SOW usa texto genérico placeholder

| Field        | Value                                |
|--------------|--------------------------------------|
| Captured     | 2026-04-27                           |
| Severity     | High                                 |
| Status       | Open                                 |
| File(s)      | src/pages/PICompletionPage.tsx       |
| Blocker?     | Production                           |
| Effort       | S                                    |

## Problem
El texto del SOW que firma el cliente es genérico/temporal. Debe
ser reemplazado por el texto formal del SOW de SPI Americas una
vez el equipo legal lo provea. Firmar un SOW genérico no tiene
validez contractual real para la operación de SPI.

## Proposed solution
1. Equipo legal de SPI provee el texto formal del SOW
2. Reemplazar el bloque de texto en PICompletionPage Section 0
3. Confirmar con legal que el flujo de firma digital cumple con
   requisitos legales (Ley 527 Colombia para firma electrónica)

## Notes
Mientras el SOW sea placeholder, NO usar este sistema con clientes
reales en producción. Solo apto para pruebas internas.
