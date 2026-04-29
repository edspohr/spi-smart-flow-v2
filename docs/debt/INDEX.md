# SPI Smart Flow — Registro de Deuda Técnica

Última actualización: 2026-04-29

## Resumen
- Críticos abiertos: 0
- Altos abiertos: 4
- Medios abiertos: 9
- Bajos abiertos: 6
- Resueltos: 1

## Cómo usar este registro
1. Cada item tiene su propio archivo `DEBT-NNN-slug.md`
2. Severidad — Critical bloquea producción, High bloquea piloto,
   Medium genera fricción de UX, Low es cosmético o nice-to-have
3. Antes de hacer cambios estructurales en el repo, revisar este
   registro para evitar duplicar esfuerzo
4. Cuando se resuelve un item: marcar Status como Resolved en su
   archivo individual y actualizar la tabla de abajo

## Tabla maestra

| ID | Título | Severidad | Status | Blocker? | Esfuerzo |
|---|---|---|---|---|---|
| [DEBT-001](./DEBT-001-storage-companyid-server-validation.md) | Storage rules — validación companyId más estricta | Medium | Open | Production | M |
| [DEBT-002](./DEBT-002-pipefy-password-rotation.md) | Password hardcoded SPI2026! en pipefy.ts | High | Open | Post-pilot | S |
| [DEBT-003](./DEBT-003-pipefy-pago-cierre-mapping.md) | Falta mapeo de fase Pago Final / Pago Cierre | High | Open | Post-pilot | S |
| [DEBT-004](./DEBT-004-orphan-sin-titular-companies.md) | OTs sin Titular crean empresas duplicadas Sin Titular | Medium | Open | Post-pilot | S |
| [DEBT-005](./DEBT-005-client-stat-cards.md) | ClientOTsPage no tiene 3 stat cards (Activas/Pendientes/Finalizadas) | Medium | Open | Post-pilot | M |
| [DEBT-006](./DEBT-006-picompletion-inline-analyze.md) | Logo y cédula inline no llaman analyzeDocument | Medium | Open | Post-pilot | S |
| [DEBT-007](./DEBT-007-sidebar-feature-flags.md) | Sidebar muestra 7 items admin sin feature flag | Medium | Open | Post-pilot | S |
| [DEBT-008](./DEBT-008-userspage-dead-code.md) | UsersPage.tsx sin uso (335 líneas dead code) | Low | Open | Post-pilot | S |
| [DEBT-009](./DEBT-009-otstatusbadge-spec-mismatch.md) | OTStatusBadge usa -50/-700 en vez de -100/-800 | Low | Open | Post-pilot | S |
| [DEBT-010](./DEBT-010-spivault-type-filter.md) | SPIVault no filtra por tipos vault | Low | Open | Post-pilot | S |
| [DEBT-011](./DEBT-011-readme-claudemd-drift.md) | README y CLAUDE.md desactualizados | Medium | Resolved | Post-pilot | M |
| [DEBT-012](./DEBT-012-google-domain-server-side.md) | Whitelist de dominios solo en cliente | High | Open | Production | M |
| [DEBT-013](./DEBT-013-guest-promotion-notification.md) | No hay notificación cuando entra guest nuevo | Medium | Open | Post-pilot | S |
| [DEBT-014](./DEBT-014-role-promotion-ui.md) | No hay UI para promover guest a client/spi-admin | Medium | Open | Post-pilot | M |
| [DEBT-015](./DEBT-015-discount-email-reminders.md) | Recordatorios por email del descuento no implementados | Medium | Open | Post-pilot | M |
| [DEBT-016](./DEBT-016-currency-hardcoded-cop.md) | Currency hardcoded a COP en discountCountdown | Low | Open | Post-pilot | S |
| [DEBT-017](./DEBT-017-discount-clientside-clock.md) | Reloj del countdown corre client-side (manipulable) | Low | Open | Post-pilot | M |
| [DEBT-018](./DEBT-018-expired-ots-monitoring.md) | Sin monitoreo de OTs expiradas (>30d sin finalizar) | Medium | Open | Post-pilot | M |
| [DEBT-019](./DEBT-019-sow-placeholder-text.md) | SOW usa texto genérico placeholder | High | Open | Production | S |
| [DEBT-020](./DEBT-020-ar-module-content.md) | Asuntos Regulatorios sin contenido funcional propio | Medium | Open | Post-pilot | L |
| [DEBT-021](./DEBT-021-soft-delete-reactivation-ux.md) | Reactivación de usuarios soft-deleted no tiene UI propia | Low | Open | Post-pilot | M |
