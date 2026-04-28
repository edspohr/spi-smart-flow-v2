# DEBT-005 — ClientOTsPage no tiene 3 stat cards

| Field        | Value                          |
|--------------|--------------------------------|
| Captured     | 2026-04-27                     |
| Severity     | Medium                         |
| Status       | Open                           |
| File(s)      | src/pages/ClientOTsPage.tsx    |
| Blocker?     | Post-pilot                     |
| Effort       | M                              |

## Problem
El spec del Phase 3 pedía 3 stat cards arriba del listado de OTs:
"Activas", "Pendientes" (rojo si > 0), "Finalizadas". El refactor
real reemplazó eso con ClientProgressSummary que tiene otro layout.
El badge rojo "Pendientes" era una affordance importante para llamar
la atención del cliente.

## Proposed solution
Añadir un Stack horizontal con 3 stat cards arriba de ClientProgressSummary
o reemplazarlo:
  - Activas: ots.filter(o => o.stage !== 'finalizado').length
  - Pendientes: documents.filter(d =>
      d.status === 'pending' || d.status === 'rejected').length
    Card background bg-red-50 border-red-100 cuando > 0
  - Finalizadas: ots.filter(o => o.stage === 'finalizado').length
