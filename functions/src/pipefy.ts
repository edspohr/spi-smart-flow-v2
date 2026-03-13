import { onRequest } from "firebase-functions/v2/https";
import { Firestore } from "firebase-admin/firestore";

type OTStage = 'solicitud' | 'pago_adelanto' | 'gestion' | 'pago_cierre' | 'finalizado';

// Maps Pipefy phase names (lowercase substrings) to OT stages
const PHASE_TO_STAGE: Array<{ keywords: string[]; stage: OTStage }> = [
  { keywords: ['solicitud', 'recepción', 'recepcion', 'inicio', 'nueva'], stage: 'solicitud' },
  { keywords: ['pago adelanto', 'cobro inicial', 'adelanto'], stage: 'pago_adelanto' },
  { keywords: ['gestión', 'gestion', 'proceso', 'tramite', 'trámite'], stage: 'gestion' },
  { keywords: ['pago cierre', 'cobro final', 'cierre'], stage: 'pago_cierre' },
  { keywords: ['finalizado', 'completado', 'terminado', 'entregado'], stage: 'finalizado' },
];

function mapPhaseToStage(phaseName: string): OTStage | null {
  const lower = phaseName.toLowerCase();
  for (const { keywords, stage } of PHASE_TO_STAGE) {
    if (keywords.some((kw) => lower.includes(kw))) return stage;
  }
  return null;
}

function getFieldValue(fields: any[], fieldName: string): string | null {
  const field = fields.find((f: any) => f.name.toLowerCase().includes(fieldName.toLowerCase()));
  return field ? field.value : null;
}

export const registerPipefyHandlers = (db: Firestore) => {

  const createOTFromPipefy = onRequest(async (req, res) => {
    try {
      const payload = req.body;
      console.log("Received Pipefy Webhook:", JSON.stringify(payload, null, 2));

      if (!payload.data || !payload.data.card) {
        res.status(400).send("Invalid Payload: missing data.card");
        return;
      }

      const { card } = payload.data;
      const eventType: string = payload.action || 'card.create';

      // ── Card Move: sync stage ──────────────────────────────────────────────
      if (eventType === 'card.move') {
        const phaseName: string = card.current_phase?.name || '';
        const newStage = mapPhaseToStage(phaseName);

        if (!newStage) {
          console.log(`No stage mapping found for phase: "${phaseName}". Skipping.`);
          res.status(200).send({ skipped: true, reason: 'unmapped_phase', phaseName });
          return;
        }

        // Find the OT by pipefyCardId
        const otSnapshot = await db.collection('ots')
          .where('pipefyCardId', '==', String(card.id))
          .limit(1)
          .get();

        if (otSnapshot.empty) {
          console.warn(`No OT found for Pipefy card ${card.id}`);
          res.status(404).send({ error: 'OT not found', cardId: card.id });
          return;
        }

        const otDoc = otSnapshot.docs[0];
        await otDoc.ref.update({
          stage: newStage,
          updatedAt: new Date().toISOString(),
        });

        await db.collection('logs').add({
          otId: otDoc.id,
          userId: 'pipefy',
          action: `Etapa actualizada vía Pipefy: "${phaseName}" → ${newStage}`,
          type: 'system',
          timestamp: new Date().toISOString(),
          metadata: { phaseName, newStage, cardId: card.id },
        });

        console.log(`OT ${otDoc.id} stage updated to ${newStage} via Pipefy move`);
        res.status(200).send({ success: true, otId: otDoc.id, newStage });
        return;
      }

      // ── Card Field Update: sync payment/service data ───────────────────────
      if (eventType === 'card.field.update') {
        const otSnapshot = await db.collection('ots')
          .where('pipefyCardId', '==', String(card.id))
          .limit(1)
          .get();

        if (otSnapshot.empty) {
          res.status(404).send({ error: 'OT not found', cardId: card.id });
          return;
        }

        const fields: any[] = card.fields || [];
        const updates: Record<string, any> = { updatedAt: new Date().toISOString() };

        const rawAmount = getFieldValue(fields, 'monto');
        if (rawAmount !== null) updates.amount = parseFloat(rawAmount) || 0;

        const rawFees = getFieldValue(fields, 'honorarios');
        if (rawFees !== null) updates.fees = parseFloat(rawFees) || 0;

        const rawPaymentTerms = getFieldValue(fields, 'condiciones de pago');
        if (rawPaymentTerms !== null) updates.paymentTerms = rawPaymentTerms;

        const rawDeadline = getFieldValue(fields, 'fecha límite');
        if (rawDeadline !== null) updates.deadline = new Date(rawDeadline).toISOString();

        const otDoc = otSnapshot.docs[0];
        await otDoc.ref.update(updates);

        await db.collection('logs').add({
          otId: otDoc.id,
          userId: 'pipefy',
          action: `Datos actualizados vía Pipefy: ${Object.keys(updates).filter(k => k !== 'updatedAt').join(', ')}`,
          type: 'system',
          timestamp: new Date().toISOString(),
          metadata: { cardId: card.id, updates },
        });

        console.log(`OT ${otDoc.id} fields updated via Pipefy:`, updates);
        res.status(200).send({ success: true, otId: otDoc.id, updates });
        return;
      }

      // ── Card Create: create new OT ─────────────────────────────────────────
      const fields: any[] = card.fields || [];
      const clientEmail = getFieldValue(fields, 'email') || 'cliente@example.com';
      const serviceType = getFieldValue(fields, 'tipo de servicio') || 'General';
      const amount = parseFloat(getFieldValue(fields, 'monto') || '0');
      const deadlineStr = getFieldValue(fields, 'fecha límite');
      const fees = parseFloat(getFieldValue(fields, 'honorarios') || '0');
      const paymentTerms = getFieldValue(fields, 'condiciones de pago') || 'Contado';

      let clientId = 'pipefy-guest';
      let companyId = 'default-company';

      const userSnapshot = await db.collection('users').where('email', '==', clientEmail).limit(1).get();
      if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];
        clientId = userDoc.id;
        companyId = (userDoc.data() as any).companyId || 'default-company';
      }

      const otData = {
        pipefyCardId: String(card.id),
        title: card.title,
        serviceType,
        amount,
        fees,
        paymentTerms,
        stage: 'solicitud' as OTStage,
        status: 'pending',
        createdAt: new Date().toISOString(),
        deadline: deadlineStr
          ? new Date(deadlineStr).toISOString()
          : new Date(Date.now() + 86400000 * 7).toISOString(),
        companyId,
        clientId,
        source: 'pipefy',
      };

      const docRef = await db.collection('ots').add(otData);
      console.log(`OT Created from Pipefy: ${docRef.id}`);

      const defaultDocs = [
        { name: 'Poder Simple', type: 'sign', isVaultEligible: true },
        { name: 'Logo de la Marca', type: 'upload', isVaultEligible: true },
        { name: 'Descripción de la Actividad', type: 'text', isVaultEligible: false },
      ];

      if (serviceType.toLowerCase().includes('sanitaria')) {
        defaultDocs.push({ name: 'Resolución Sanitaria Anterior', type: 'upload', isVaultEligible: true });
      }

      const batch = db.batch();
      defaultDocs.forEach((docDef) => {
        const newDocRef = db.collection('documents').doc();
        batch.set(newDocRef, {
          otId: docRef.id,
          clientId,
          companyId,
          name: docDef.name,
          type: docDef.type,
          status: 'pending',
          isVaultEligible: docDef.isVaultEligible,
          createdAt: new Date().toISOString(),
        });
      });
      await batch.commit();
      console.log(`Created ${defaultDocs.length} default documents for OT ${docRef.id}`);

      await db.collection('logs').add({
        otId: docRef.id,
        userId: 'system',
        action: `Solicitud creada vía Pipefy (Card: ${card.id})`,
        type: 'system',
        timestamp: new Date().toISOString(),
      });

      res.status(200).send({ success: true, otId: docRef.id });

    } catch (error) {
      console.error('Error processing Pipefy webhook:', error);
      res.status(500).send('Internal Server Error');
    }
  });

  return { createOTFromPipefy };
};
