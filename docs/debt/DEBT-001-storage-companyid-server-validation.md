# DEBT-001 — Storage rules: validación de companyId más estricta

| Field        | Value                                |
|--------------|--------------------------------------|
| Captured     | 2026-04-27                           |
| Severity     | Medium                               |
| Status       | Open                                 |
| File(s)      | storage.rules:21-30                  |
| Blocker?     | Production                           |
| Effort       | M                                    |

## Problem
Las reglas actuales para `/ots/{otId}/**` permiten lectura/escritura a cualquier
usuario autenticado porque el companyId no está en el path. Un cliente A podría
acceder a documentos en `ots/<otIdDeEmpresaB>/` si conoce el ID. Las reglas
para `/signed-powers`, `/cedulas`, `/signatures` y `/documents` sí filtran
correctamente porque el companyId está en el path.

## Proposed solution
Opción 1: cambiar la convención de paths en frontend para incluir companyId,
ej: `ots/{companyId}/{otId}/...` — implica migrar archivos existentes.

Opción 2: mantener el path pero validar via cross-product Firestore lookup
en storage.rules: leer ots/{otId}.companyId y comparar con userCompanyId().
Más lento pero retro-compatible.

Recomendación: Opción 2 antes de producción real; mantener Opción 1 como
mejora a largo plazo.
