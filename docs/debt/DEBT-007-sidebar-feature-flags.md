# DEBT-007 — Sidebar muestra 7 items admin sin feature flag

| Field        | Value                          |
|--------------|--------------------------------|
| Captured     | 2026-04-27                     |
| Severity     | Medium                         |
| Status       | Open                           |
| File(s)      | src/layouts/Sidebar.tsx:34-43  |
| Blocker?     | Post-pilot                     |
| Effort       | S                              |

## Problem
El sidebar admin actual muestra 7 items: Torre de Control, Pipeline,
Usuarios, Empresas, Bóveda Global, Tipos de Actuación, Tasas de Cambio.
Las páginas Pipeline, Usuarios, Tipos de Actuación y Tasas de Cambio
están en desarrollo o son experimentales. Los testers internos pueden
explorarlas y reportar bugs de funcionalidades que aún no son alcance.

## Proposed solution
Opción 1: gate cada item con feature flag via env var
  VITE_ENABLE_PIPELINE=true|false
Opción 2: mover items experimentales a una sección "Experimental"
visualmente diferenciada (separator + label "Beta")
Recomendación: Opción 1 para pruebas piloto, Opción 2 para post-pilot.
