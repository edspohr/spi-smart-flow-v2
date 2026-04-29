# DEBT-021 — Reactivación de usuarios soft-deleted no tiene UI propia

| Field        | Value                          |
|--------------|--------------------------------|
| Captured     | 2026-04-29                     |
| Severity     | Low                            |
| Status       | Open                           |
| File(s)      | functions/src/index.ts:186-260 |
| Blocker?     | Post-pilot                     |
| Effort       | M                              |

## Problem
createUser ahora reactiva usuarios soft-deleted automáticamente
cuando un admin intenta crearlos de nuevo. Esto resuelve el
bloqueo operativo pero el flujo es implícito — el admin no sabe
si está creando o reactivando hasta que recibe el toast.

## Proposed solution
1. UI explícita en CompaniesPage: cuando se intente crear un
   usuario que ya existe disabled, mostrar un confirm dialog
   "Este usuario fue archivado el {date}. ¿Reactivarlo?"
2. Sección "Usuarios archivados" en CompaniesPage para audit
   trail y reactivación intencional
