# DEBT-004 — OTs sin Titular crean empresas duplicadas 'Sin Titular'

| Field        | Value                                          |
|--------------|------------------------------------------------|
| Captured     | 2026-04-27                                     |
| Severity     | Medium                                         |
| Status       | Open                                           |
| File(s)      | functions/src/pipefy.ts:60-79, 138-149         |
| Blocker?     | Post-pilot                                     |
| Effort       | S                                              |

## Problem
Cuando parseTitular no encuentra el campo Titular o el campo viene
vacío, devuelve companyName: 'Sin Titular'. findOrCreateCompany
busca por nombre exacto; si no lo encuentra, crea una nueva empresa
con ese nombre. Después de varias OTs sin Titular pueden acumularse
varias empresas "Sin Titular" duplicadas en el listado.

## Proposed solution
1. Si parseTitular devuelve companyName vacío o "Sin Titular":
   - NO crear empresa
   - NO crear cliente
   - Crear OT con companyId: 'pipefy-orphan' (constante reservada)
   - Marcar OT con flag orphaned: true
2. Añadir filtro en CompaniesPage para mostrar OTs huérfanas a
   spi-admin con CTA "Asignar empresa"
3. Cuando admin asigna empresa, actualizar OT y eliminar flag
