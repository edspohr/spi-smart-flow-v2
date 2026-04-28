# DEBT-015 — Recordatorios por email del descuento no implementados

| Field        | Value                                    |
|--------------|------------------------------------------|
| Captured     | 2026-04-27                               |
| Severity     | Medium                                   |
| Status       | Open                                     |
| File(s)      | functions/src/reminders.ts (extender)    |
| Blocker?     | Post-pilot                               |
| Effort       | M                                        |

## Problem
El countdown de descuento solo es visible en el portal. Si el cliente
no entra, no se entera de que el descuento está por vencer. Puede
perder el 10% sin haber sido alertado.

## Proposed solution
Extender la Cloud Function checkDocumentDeadlines para que también:
1. A los 7 días restantes: enviar email "Tu descuento vence en una semana"
2. A las 24h: enviar email "¡Última oportunidad para conservar el 10%!"
3. Marcar OTs con `discountReminderSentAt` para no duplicar

Necesita un servicio de email transaccional (SendGrid, Mailgun) que
SPI ya use o que se configure.
