# DEBT-013 — No hay notificación cuando entra guest nuevo

| Field        | Value                                     |
|--------------|-------------------------------------------|
| Captured     | 2026-04-27                                |
| Severity     | Medium                                    |
| Status       | Open                                      |
| File(s)      | src/store/useAuthStore.ts auto-heal logic |
| Blocker?     | Post-pilot                                |
| Effort       | S                                         |

## Problem
Cuando un usuario nuevo entra con Google Sign-In y su email no tiene
documento en Firestore, el auto-heal le crea uno con role: 'guest'.
Ningún spi-admin se entera de la nueva entrada hasta que revisa la
lista de usuarios manualmente. Si el guest abandona el portal sin
ser asignado, su acceso queda en limbo.

## Proposed solution
1. En el auto-heal, después de crear el doc, escribir un log con
   action: 'guest_signed_in', userId: uid, email
2. Añadir listener en SPIAdminDashboard que muestre notificación
   en tiempo real cuando llegue un guest nuevo
3. Opcional: enviar email a una lista de admins (DEBT-013 conecta
   con DEBT-014 si se construyen juntos)

## Notes
2026-04-29: el auto-heal ahora rechaza casos huérfanos (UID
mismatch o perfil archivado) antes de crear un guest, por lo que
los guests nuevos solo aparecen cuando son entradas legítimas.
Aún así, falta la notificación al admin descrita arriba.
