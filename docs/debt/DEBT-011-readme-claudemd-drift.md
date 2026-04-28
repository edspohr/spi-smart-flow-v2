# DEBT-011 — README y CLAUDE.md desactualizados

| Field        | Value                          |
|--------------|--------------------------------|
| Captured     | 2026-04-27                     |
| Severity     | Medium                         |
| Status       | Resolved                       |
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

## Resolución
2026-04-27 — README.md y CLAUDE.md actualizados quirúrgicamente:
1. Sección de autenticación reescrita (Google Sign-In + email/password,
   sin magic link)
2. Rol `spi-staff` añadido a la lista de roles en ambos archivos
3. Referencias a `NewRequestPage` y `ClientDashboard.tsx` reemplazadas
   por `ManualOTPage`, `ClientInboxPage`, `ClientOTsPage`
4. "Gemini 1.5 Flash" → "Gemini 2.5 Flash" en CLAUDE.md (README ya
   estaba correcto)
5. Typo `card.field.update` corregido a `card.field_update` en ambos
6. Tabla PHASE_TO_STAGE reemplazada con keywords reales del pipe
   (asignando, en proceso, en espera, hecho, cancelado) + nota sobre
   DEBT-003 (mapeo `pago_cierre` pendiente)
7. Descripción de CompaniesPage actualizada (sin tab Usuarios)
8. Nuevas secciones añadidas en ambos: Manual OT entry y Discount
   countdown

Verificado con `grep -in "magic|NewRequestPage|ClientDashboard|Gemini 1.5|card.field.update"` → 0 hits.
