// NOTE: This is a duplicate of the canonical OTStage order from src/store/types.ts.
// The frontend codebase does not expose a shared stages module, so this array is
// intentionally duplicated here and must be kept in sync whenever the frontend
// OTStage union changes. See Phase 2 observations for context.

export type OTStage =
  | 'solicitud'
  | 'pago_adelanto'
  | 'gestion'
  | 'pago_cierre'
  | 'finalizado';

export const STAGES: OTStage[] = [
  'solicitud',
  'pago_adelanto',
  'gestion',
  'pago_cierre',
  'finalizado',
];
