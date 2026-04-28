# DEBT-018 — Sin monitoreo de OTs expiradas

| Field        | Value                                |
|--------------|--------------------------------------|
| Captured     | 2026-04-27                           |
| Severity     | Medium                               |
| Status       | Open                                 |
| File(s)      | functions/src/reminders.ts           |
| Blocker?     | Post-pilot                           |
| Effort       | M                                    |

## Problem
No existe job programado que detecte OTs que pasaron los 30 días
sin llegar a 'finalizado'. El equipo SPI no recibe alerta para
gestionar proactivamente esos casos. La OT queda visualmente como
"Descuento perdido" en el portal del cliente, pero internamente
nadie lo trackea.

## Proposed solution
Extender checkDocumentDeadlines para incluir:
1. Query OTs con stage !== 'finalizado' y createdAt > 30 días
2. Para cada una, escribir log con tipo 'discount_window_expired'
3. Generar resumen semanal al equipo SPI con todas las OTs en
   este estado para gestión activa
