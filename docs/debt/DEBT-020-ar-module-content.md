# DEBT-020 — Asuntos Regulatorios sin contenido funcional propio

| Field        | Value                                |
|--------------|--------------------------------------|
| Captured     | 2026-04-29                           |
| Severity     | Medium                               |
| Status       | Open                                 |
| File(s)      | múltiples — alcance amplio           |
| Blocker?     | Post-pilot                           |
| Effort       | L                                    |

## Problem
El módulo "Asuntos Regulatorios" hoy es una variante visual de
Propiedad Industrial. Comparte el mismo modelo de OT, las mismas
etapas (solicitud → pago_adelanto → gestion → pago_cierre →
finalizado) y los mismos documentos requeridos (SOW, Poder, Cédula).
Esto es suficiente para que Isa vea el área representada en la
plataforma, pero NO es un módulo funcional completo.

Falta:
- Tipos de actuación específicos de AR (registros sanitarios,
  INVIMA, ANLA, ANVISA, etc.)
- Documentos específicos del área regulatoria
- Plantillas de SOW diferenciadas por área
- Workflow propio si las etapas difieren de PI

## Proposed solution
Sesión de discovery con Isa para mapear el flujo real de un
trámite regulatorio y modelarlo en el sistema. Probable necesidad
de extender Document.type con valores AR-específicos y de
permitir actuationType.area como filtro.

## Notes
Este item no bloquea el piloto inicial pero debe abordarse antes
de que Isa empiece a usar la plataforma productivamente.
