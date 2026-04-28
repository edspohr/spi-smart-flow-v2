# DEBT-003 — Falta mapeo de fase 'Pago Final' / 'Pago Cierre'

| Field        | Value                          |
|--------------|--------------------------------|
| Captured     | 2026-04-27                     |
| Severity     | High                           |
| Status       | Open                           |
| File(s)      | functions/src/pipefy.ts:12-18  |
| Blocker?     | Post-pilot                     |
| Effort       | S                              |

## Problem
El array PHASE_TO_STAGE actual no contiene ningún keyword que mapee al
stage 'pago_cierre'. Si Pipefy mueve una tarjeta a una fase llamada
"Pago Final" o "Pago Cierre", mapPhaseToStage devuelve null y el
webhook ignora silenciosamente la transición. La OT en Smart Flow
queda atascada en 'gestion'.

## Proposed solution
Añadir línea al array:
  { keywords: ['pago final', 'pago cierre', 'cobro final'], stage: 'pago_cierre' }

Verificar en Pipefy cuál es el nombre exacto de esa fase. Si difiere
del pipe actual (Asignando/En Proceso/En Espera/Hecho/Cancelado), añadir
los keywords correspondientes.
