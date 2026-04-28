# DEBT-008 — UsersPage.tsx dead code

| Field        | Value                          |
|--------------|--------------------------------|
| Captured     | 2026-04-27                     |
| Severity     | Low                            |
| Status       | Open                           |
| File(s)      | src/pages/UsersPage.tsx        |
| Blocker?     | Post-pilot                     |
| Effort       | S                              |

## Problem
El archivo src/pages/UsersPage.tsx (335 líneas) ya no se importa
desde ningún lado (`grep -rn UsersPage src/` retorna 0 hits). Se
mantiene como código muerto que puede ser re-importado por error
o causar confusión durante mantenimiento.

## Proposed solution
Eliminar el archivo. La gestión de usuarios ahora vive dentro de
CompaniesPage.
