# DEBT-002 — Password hardcoded 'SPI2026!' en pipefy.ts

| Field        | Value                          |
|--------------|--------------------------------|
| Captured     | 2026-04-27                     |
| Severity     | High                           |
| Status       | Open                           |
| File(s)      | functions/src/pipefy.ts:206    |
| Blocker?     | Post-pilot                     |
| Effort       | S                              |

## Problem
Cuando el webhook de Pipefy auto-crea un usuario spi-staff porque el
encargado no existe en Firestore, el password se setea hardcoded a
'SPI2026!'. Cualquier persona con acceso al repositorio puede
autenticarse como ese usuario hasta que cambie el password. El valor
está committeado en git history.

## Proposed solution
1. Reemplazar password fija por `crypto.randomUUID()` para forzar
   un valor aleatorio único por usuario
2. Inmediatamente generar password reset link via
   `auth.generatePasswordResetLink(email)`
3. Enviar el link al email del encargado (puede ir vía SendGrid,
   Mailgun, o el email transaccional que SPI ya use)
4. Documentar el flujo para que SPI sepa que cuando llega un encargado
   nuevo desde Pipefy, recibirá un email de bienvenida con link de
   primera contraseña

Para pruebas internas con Google Sign-In este item no es bloqueante
porque los testers usan auth federado.
