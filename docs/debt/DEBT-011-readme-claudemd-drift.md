# DEBT-011 — README y CLAUDE.md desactualizados

| Field        | Value                          |
|--------------|--------------------------------|
| Captured     | 2026-04-27                     |
| Severity     | Medium                         |
| Status       | In progress                    |
| File(s)      | README.md, CLAUDE.md           |
| Blocker?     | Post-pilot                     |
| Effort       | M                              |

## Problem
Documentación principal no refleja el estado real del código:
1. README dice magic-link auth — en realidad email+password + Google Sign-In
2. README/CLAUDE referencian NewRequestPage y ClientDashboard.tsx
   que ya no existen
3. CLAUDE dice "Gemini 1.5 Flash" en una sección y "Gemini 2.5 Flash"
   en otra (inconsistencia interna)
4. Lista de roles no incluye spi-staff
5. CLAUDE tiene typo card.field.update (real: card.field_update)
6. PHASE_TO_STAGE en CLAUDE tiene keywords genéricos en vez de los
   reales del pipe (Asignando, En Proceso, En Espera, Hecho, Cancelado)
7. CompaniesPage descrita con tab Usuarios que ya no existe

## Proposed solution
Reescribir las secciones afectadas. Pasar a "Resolved" cuando se
complete la actualización (ver entregable separado en el plan
pre-pilot).
