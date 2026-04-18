import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as Sentry from '@sentry/node';
import { STAGES, type OTStage } from './stages';

const FieldValue = admin.firestore.FieldValue;

export const onComprobanteApproved = onDocumentUpdated(
  'documents/{docId}',
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;

    // Only fire on transitions to 'approved'
    if (before.status === 'approved' || after.status !== 'approved') return;
    if (after.type !== 'comprobante_pago') return;

    const otId = after.otId as string | undefined;
    const paymentType = after.paymentType as 'adelanto' | 'cierre' | undefined;
    if (!otId || !paymentType) {
      logger.warn('Comprobante approved without otId or paymentType', { otId, paymentType });
      return;
    }

    const db = admin.firestore();
    const otRef = db.doc(`ots/${otId}`);
    const otSnap = await otRef.get();
    if (!otSnap.exists) {
      logger.warn(`OT ${otId} not found for approved comprobante`);
      return;
    }
    const ot = otSnap.data() as { stage: OTStage };

    const currentIdx = STAGES.indexOf(ot.stage);
    if (currentIdx === -1) {
      logger.error(`Unknown stage: ${ot.stage} on OT ${otId}`);
      return;
    }

    let nextStage: OTStage | null = null;

    if (paymentType === 'adelanto' && ot.stage === 'pago_adelanto') {
      nextStage = STAGES[currentIdx + 1] ?? null;
    } else if (paymentType === 'cierre' && ot.stage === 'pago_cierre') {
      nextStage = 'finalizado';
    }

    if (!nextStage) {
      logger.info(
        `No stage advancement for OT ${otId}: stage=${ot.stage}, paymentType=${paymentType}`,
      );
      return;
    }

    try {
      await otRef.update({
        stage: nextStage,
        stageHistory: FieldValue.arrayUnion({
          fromStage: ot.stage,
          toStage: nextStage,
          changedAt: new Date().toISOString(),
          changedBy: 'system:payment-auto-advance',
          reason: `Comprobante de pago aprobado (${paymentType})`,
        }),
        updatedAt: FieldValue.serverTimestamp(),
      });

      await db.collection('logs').add({
        action: 'OT auto-avanzada por pago aprobado',
        otId,
        fromStage: ot.stage,
        toStage: nextStage,
        paymentType,
        type: 'system',
        timestamp: FieldValue.serverTimestamp(),
        userId: 'system',
        userName: 'Sistema',
      });

      logger.info(`OT ${otId} advanced: ${ot.stage} → ${nextStage} (${paymentType})`);
    } catch (err) {
      logger.error('Failed to auto-advance OT stage', err);
      Sentry.captureException(err, { extra: { otId, paymentType, fromStage: ot.stage } });
    }
  },
);
