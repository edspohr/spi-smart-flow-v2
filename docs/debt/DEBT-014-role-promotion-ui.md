# DEBT-014 — No hay UI para promover guest a client/spi-admin

| Field        | Value                          |
|--------------|--------------------------------|
| Captured     | 2026-04-27                     |
| Severity     | Medium                         |
| Status       | Open                           |
| File(s)      | src/pages/CompaniesPage.tsx    |
| Blocker?     | Post-pilot                     |
| Effort       | M                              |

## Problem
Actualmente la única forma de cambiar el rol de un usuario (guest →
client / spi-admin) es editar el documento Firestore directamente
via Console. Esto fricciona el flujo de onboarding interno y hace
imposible delegar la administración a alguien sin acceso a Firebase.

## Proposed solution
Añadir botón "Promover" en cada user row dentro del expandable de
CompaniesPage:
  - Modal/Popover con select de role: client | spi-admin
  - Si se promueve a client, requerir companyId asignada
  - Llamar a Cloud Function setUserRole(uid, role, companyId) con
    auth check (solo spi-admin)
  - Cloud Function actualiza /users/{uid} y opcionalmente
    setCustomUserClaims para que el role esté en el token

## Notes
2026-04-29: createUser ahora reactiva usuarios soft-deleted en
lugar de fallar con auth/email-already-exists, lo que reduce un
modo de bloqueo histórico. La promoción de roles (guest → client /
spi-admin) sigue siendo manual.
