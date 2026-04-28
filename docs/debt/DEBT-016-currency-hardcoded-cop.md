# DEBT-016 — Currency hardcoded a COP en discountCountdown

| Field        | Value                                |
|--------------|--------------------------------------|
| Captured     | 2026-04-27                           |
| Severity     | Low                                  |
| Status       | Open                                 |
| File(s)      | src/lib/discountCountdown.ts         |
| Blocker?     | Post-pilot                           |
| Effort       | S                                    |

## Problem
formatCurrency en discountCountdown.ts usa Intl.NumberFormat con
locale 'es-CO' y currency 'COP'. SPI atiende clientes en múltiples
países (Chile, Colombia, Perú, Ecuador, México) con monedas locales
distintas. Si una OT debería mostrarse en CLP o MXN, se mostrará
incorrectamente formateada en COP.

## Proposed solution
1. Añadir campo currency a la OT (default 'COP')
2. Pasar currency como parámetro a computeCountdown
3. formatCurrency lee currency dinámicamente
Considerar también añadir country a Company para inferir currency
default.
