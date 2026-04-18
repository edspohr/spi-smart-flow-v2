"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onComprobanteApproved = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const firebase_functions_1 = require("firebase-functions");
const admin = require("firebase-admin");
const Sentry = require("@sentry/node");
const stages_1 = require("./stages");
const FieldValue = admin.firestore.FieldValue;
exports.onComprobanteApproved = (0, firestore_1.onDocumentUpdated)('documents/{docId}', async (event) => {
    var _a, _b, _c;
    const before = (_a = event.data) === null || _a === void 0 ? void 0 : _a.before.data();
    const after = (_b = event.data) === null || _b === void 0 ? void 0 : _b.after.data();
    if (!before || !after)
        return;
    // Only fire on transitions to 'approved'
    if (before.status === 'approved' || after.status !== 'approved')
        return;
    if (after.type !== 'comprobante_pago')
        return;
    const otId = after.otId;
    const paymentType = after.paymentType;
    if (!otId || !paymentType) {
        firebase_functions_1.logger.warn('Comprobante approved without otId or paymentType', { otId, paymentType });
        return;
    }
    const db = admin.firestore();
    const otRef = db.doc(`ots/${otId}`);
    const otSnap = await otRef.get();
    if (!otSnap.exists) {
        firebase_functions_1.logger.warn(`OT ${otId} not found for approved comprobante`);
        return;
    }
    const ot = otSnap.data();
    const currentIdx = stages_1.STAGES.indexOf(ot.stage);
    if (currentIdx === -1) {
        firebase_functions_1.logger.error(`Unknown stage: ${ot.stage} on OT ${otId}`);
        return;
    }
    let nextStage = null;
    if (paymentType === 'adelanto' && ot.stage === 'pago_adelanto') {
        nextStage = (_c = stages_1.STAGES[currentIdx + 1]) !== null && _c !== void 0 ? _c : null;
    }
    else if (paymentType === 'cierre' && ot.stage === 'pago_cierre') {
        nextStage = 'finalizado';
    }
    if (!nextStage) {
        firebase_functions_1.logger.info(`No stage advancement for OT ${otId}: stage=${ot.stage}, paymentType=${paymentType}`);
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
        firebase_functions_1.logger.info(`OT ${otId} advanced: ${ot.stage} → ${nextStage} (${paymentType})`);
    }
    catch (err) {
        firebase_functions_1.logger.error('Failed to auto-advance OT stage', err);
        Sentry.captureException(err, { extra: { otId, paymentType, fromStage: ot.stage } });
    }
});
//# sourceMappingURL=paymentAdvance.js.map