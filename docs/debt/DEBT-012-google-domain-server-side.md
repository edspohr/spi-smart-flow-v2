# DEBT-012 — Whitelist de dominios solo en cliente

| Field        | Value                          |
|--------------|--------------------------------|
| Captured     | 2026-04-27                     |
| Severity     | High                           |
| Status       | Open                           |
| File(s)      | src/store/useAuthStore.ts      |
| Blocker?     | Production                     |
| Effort       | M                              |

## Problem
La whitelist VITE_ALLOWED_AUTH_DOMAINS se valida solo en el cliente.
Un usuario malintencionado puede modificar el bundle JavaScript o
saltarse el check via DevTools. Para pruebas internas con Google
Sign-In es aceptable, pero para producción real necesita validación
server-side.

## Proposed solution
Mover la validación a una Cloud Function blocking trigger
(beforeSignIn hook de Identity Platform o Cloud Functions Auth
trigger). Se verifica el dominio del email ANTES de que Firebase
emita el token. Documentar que la env var del frontend queda solo
como UX defense-in-depth.
