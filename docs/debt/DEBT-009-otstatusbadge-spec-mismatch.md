# DEBT-009 — OTStatusBadge usa -50/-700 en vez de -100/-800

| Field        | Value                                |
|--------------|--------------------------------------|
| Captured     | 2026-04-27                           |
| Severity     | Low                                  |
| Status       | Open                                 |
| File(s)      | src/components/OTStatusBadge.tsx:5-11|
| Blocker?     | Post-pilot                           |
| Effort       | S                                    |

## Problem
El spec del refactor de UI mandaba combinaciones de bg-{color}-100
con text-{color}-800 para máxima diferenciación visual. La
implementación actual usa bg-{color}-50 con text-{color}-700. El
contraste sigue cumpliendo WCAG AA pero la jerarquía visual es
menos prominente.

## Proposed solution
Cambiar el mapping en OTStatusBadge.tsx a:
  solicitud:     bg-amber-100 text-amber-800 border-amber-200
  pago_adelanto: bg-sky-100 text-sky-800 border-sky-200
  gestion:       bg-indigo-100 text-indigo-800 border-indigo-200
  pago_cierre:   bg-purple-100 text-purple-800 border-purple-200
  finalizado:    bg-emerald-100 text-emerald-800 border-emerald-200
