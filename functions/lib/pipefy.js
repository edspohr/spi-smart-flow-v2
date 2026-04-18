"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPipefyHandlers = void 0;
const https_1 = require("firebase-functions/v2/https");
const firebase_functions_1 = require("firebase-functions");
const auth_1 = require("firebase-admin/auth");
const Sentry = require("@sentry/node");
// ── Phase → Stage mapping (real Pipefy pipe phase names) ──────────────────────
const PHASE_TO_STAGE = [
    { keywords: ['asignando'], stage: 'solicitud' },
    { keywords: ['en proceso'], stage: 'pago_adelanto' },
    { keywords: ['en espera'], stage: 'gestion' },
    { keywords: ['hecho'], stage: 'finalizado' },
    { keywords: ['cancelado'], stage: 'finalizado' },
];
function mapPhaseToStage(phaseName) {
    const lower = phaseName.toLowerCase();
    for (const { keywords, stage } of PHASE_TO_STAGE) {
        if (keywords.some((kw) => lower.includes(kw)))
            return stage;
    }
    return null;
}
function getFieldValue(fields, fieldName) {
    const field = fields.find((f) => f.name.toLowerCase().includes(fieldName.toLowerCase()));
    return field ? field.value : null;
}
/**
 * Parses a date string safely. Returns a valid ISO string or the fallback.
 * Prevents crashes from `new Date('invalid').toISOString()`.
 */
function safeISODate(raw, fallbackMs = Date.now() + 86400000 * 7) {
    if (!raw)
        return new Date(fallbackMs).toISOString();
    const d = new Date(raw);
    if (isNaN(d.getTime())) {
        console.warn(`[pipefy] Invalid date string: "${raw}", using fallback.`);
        return new Date(fallbackMs).toISOString();
    }
    return d.toISOString();
}
// ── Helper 1: Parse Titular connection field ───────────────────────────────────
function parseTitular(fields) {
    const field = fields.find((f) => { var _a; return (_a = f.name) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes('titular'); });
    if (!field)
        return {
            companyName: 'Sin Titular', clientEmail: '',
            clientName: '', clientPhone: '', pipefyTitularId: '',
        };
    let data = null;
    try {
        if (Array.isArray(field.array_value) && field.array_value.length > 0) {
            data = field.array_value[0];
        }
        else if (typeof field.value === 'object' && field.value !== null) {
            data = field.value;
        }
        else if (typeof field.value === 'string' && field.value.trim().startsWith('{')) {
            data = JSON.parse(field.value);
        }
    }
    catch (e) {
        console.warn('[pipefy] Could not parse Titular field:', e);
    }
    if (!data)
        return {
            companyName: String(field.value || 'Sin Titular'),
            clientEmail: '', clientName: '', clientPhone: '', pipefyTitularId: '',
        };
    const getVal = (keywords) => {
        const key = Object.keys(data).find((k) => keywords.some((kw) => k.toLowerCase().includes(kw.toLowerCase())));
        return key ? String(data[key] || '') : '';
    };
    return {
        companyName: getVal(['razón social', 'razon social']),
        clientEmail: getVal(['e-mail contacto propiedad int', 'email contacto propiedad int']),
        clientName: getVal(['nombre y apellido contacto propiedad int']),
        clientPhone: getVal(['celular contacto propiedad']),
        pipefyTitularId: getVal(['id pipefy']),
    };
}
// ── Helper 2: Find or create Company in Firestore ─────────────────────────────
async function findOrCreateCompany(db, companyName, pipefyTitularId) {
    if (pipefyTitularId) {
        const snap = await db.collection('companies')
            .where('pipefyTitularId', '==', pipefyTitularId)
            .limit(1).get();
        if (!snap.empty)
            return snap.docs[0].id;
    }
    const snapName = await db.collection('companies')
        .where('name', '==', companyName)
        .limit(1).get();
    if (!snapName.empty)
        return snapName.docs[0].id;
    const ref = await db.collection('companies').add({
        name: companyName,
        pipefyTitularId: pipefyTitularId || '',
        createdAt: new Date().toISOString(),
        createdBy: 'pipefy',
        status: 'active',
    });
    console.log(`[pipefy] Company created: ${ref.id} (${companyName})`);
    return ref.id;
}
// ── Helper 3: Find or create Client user in Firestore (no Firebase Auth) ──────
async function findOrCreateClientUser(db, clientEmail, clientName, clientPhone, companyId) {
    if (!clientEmail) {
        const titularContext = { clientName, clientPhone, companyId };
        firebase_functions_1.logger.error('[pipefy] No client email in Titular — OT will be created as orphaned', titularContext);
        Sentry.captureMessage('Pipefy card received without Titular email — OT orphaned', { level: 'error', extra: titularContext });
        return null;
    }
    const snap = await db.collection('users')
        .where('email', '==', clientEmail)
        .limit(1).get();
    if (!snap.empty)
        return snap.docs[0].id;
    const ref = await db.collection('users').add({
        email: clientEmail,
        displayName: clientName || clientEmail,
        phone: clientPhone || '',
        companyId,
        role: 'client',
        createdAt: new Date().toISOString(),
        createdBy: 'pipefy',
        authLinked: false,
    });
    console.log(`[pipefy] Client user created: ${ref.id} (${clientEmail})`);
    return ref.id;
}
// ── Helper 4: Find or create SPI staff user (Auth + Firestore) ───────────────
async function findOrCreateSPIUser(db, email, displayName) {
    // Empty email — cannot resolve, return null gracefully
    if (!email || !email.trim()) {
        console.warn('[pipefy] Encargado email is empty — assignedToId will be null');
        return null;
    }
    const normalizedEmail = email.toLowerCase().trim();
    // Step 1 — Check Firestore first (fastest, covers most cases)
    const snap = await db.collection('users')
        .where('email', '==', normalizedEmail)
        .limit(1).get();
    if (!snap.empty) {
        console.log(`[pipefy] SPI user found in Firestore: ${snap.docs[0].id}`);
        return snap.docs[0].id;
    }
    // Step 2 — Not in Firestore — create Firebase Auth user
    const auth = (0, auth_1.getAuth)();
    let authUid;
    let authLinked = true;
    try {
        const authUser = await auth.createUser({
            email: normalizedEmail,
            displayName: displayName || normalizedEmail,
            password: 'SPI2026!',
            emailVerified: false,
        });
        authUid = authUser.uid;
        console.log(`[pipefy] Firebase Auth user created: ${authUid} (${normalizedEmail})` +
            ` — temp password: SPI2026!`);
        // Set custom claim so the frontend can read the role from the token
        await auth.setCustomUserClaims(authUid, { role: 'spi-staff' });
    }
    catch (authError) {
        if (authError.code === 'auth/email-already-exists') {
            // Auth exists but Firestore doesn't — recover by fetching the uid
            console.warn(`[pipefy] Auth user already exists for ${normalizedEmail} — ` +
                `linking to new Firestore doc`);
            const existing = await auth.getUserByEmail(normalizedEmail);
            authUid = existing.uid;
            authLinked = true;
        }
        else {
            // Unexpected error — create Firestore-only doc as fallback
            console.error(`[pipefy] Auth creation failed for ${normalizedEmail}:`, authError);
            const fallbackRef = await db.collection('users').add({
                email: normalizedEmail,
                displayName: displayName || normalizedEmail,
                phone: '',
                companyId: null,
                role: 'spi-staff',
                createdAt: new Date().toISOString(),
                createdBy: 'pipefy',
                authLinked: false,
            });
            console.log(`[pipefy] SPI user created (Firestore only, authLinked: false): ` +
                `${fallbackRef.id}`);
            return fallbackRef.id;
        }
    }
    // Step 3 — Create Firestore document using the Auth uid as the doc id
    // This ensures Auth uid === Firestore doc id (standard Firebase pattern)
    await db.collection('users').doc(authUid).set({
        email: normalizedEmail,
        displayName: displayName || normalizedEmail,
        phone: '',
        companyId: null,
        role: 'spi-staff',
        createdAt: new Date().toISOString(),
        createdBy: 'pipefy',
        authLinked,
    });
    console.log(`[pipefy] SPI staff user fully created: ${authUid} ` +
        `(${normalizedEmail}), authLinked: ${authLinked}`);
    return authUid;
}
// ── Webhook handler ───────────────────────────────────────────────────────────
const registerPipefyHandlers = (db) => {
    const createOTFromPipefy = (0, https_1.onRequest)({ timeoutSeconds: 30 }, async (req, res) => {
        var _a;
        if (process.env.PIPEFY_DISABLED === 'true') {
            firebase_functions_1.logger.info('Pipefy integration disabled (PIPEFY_DISABLED=true)');
            res.status(200).json({ status: 'ignored', reason: 'integration_disabled' });
            return;
        }
        try {
            const payload = req.body;
            console.log("Received Pipefy Webhook:", JSON.stringify(payload, null, 2));
            if (!payload.data || !payload.data.card) {
                res.status(400).send("Invalid Payload: missing data.card");
                return;
            }
            const { card } = payload.data;
            const eventType = payload.action || 'card.create';
            // ── Card Move: sync stage ────────────────────────────────────────────────
            if (eventType === 'card.move') {
                const phaseName = ((_a = card.current_phase) === null || _a === void 0 ? void 0 : _a.name) || '';
                const newStage = mapPhaseToStage(phaseName);
                if (!newStage) {
                    console.log(`No stage mapping found for phase: "${phaseName}". Skipping.`);
                    res.status(200).send({ skipped: true, reason: 'unmapped_phase', phaseName });
                    return;
                }
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
            // ── Card Field Update: sync payment/service data ─────────────────────────
            if (eventType === 'card.field_update') {
                const otSnapshot = await db.collection('ots')
                    .where('pipefyCardId', '==', String(card.id))
                    .limit(1)
                    .get();
                if (otSnapshot.empty) {
                    res.status(404).send({ error: 'OT not found', cardId: card.id });
                    return;
                }
                const fields = card.fields || [];
                const updates = { updatedAt: new Date().toISOString() };
                const rawAmount = getFieldValue(fields, 'monto');
                if (rawAmount !== null)
                    updates.amount = parseFloat(rawAmount) || 0;
                const rawFees = getFieldValue(fields, 'honorarios');
                if (rawFees !== null)
                    updates.fees = parseFloat(rawFees) || 0;
                const rawPaymentTerms = getFieldValue(fields, 'condiciones de pago');
                if (rawPaymentTerms !== null)
                    updates.paymentTerms = rawPaymentTerms;
                const rawDeadline = getFieldValue(fields, 'fecha límite');
                if (rawDeadline !== null)
                    updates.deadline = safeISODate(rawDeadline);
                const otDoc = otSnapshot.docs[0];
                await otDoc.ref.update(updates);
                await db.collection('logs').add({
                    otId: otDoc.id,
                    userId: 'pipefy',
                    action: `Datos actualizados vía Pipefy: ${Object.keys(updates).filter((k) => k !== 'updatedAt').join(', ')}`,
                    type: 'system',
                    timestamp: new Date().toISOString(),
                    metadata: { cardId: card.id, updates },
                });
                console.log(`OT ${otDoc.id} fields updated via Pipefy:`, updates);
                res.status(200).send({ success: true, otId: otDoc.id, updates });
                return;
            }
            // ── Card Create: resolve Titular → Company → Client → SPI assignee ───────
            const fields = card.fields || [];
            const titular = parseTitular(fields);
            const actividadAsignada = getFieldValue(fields, 'actividad asignada') || card.title;
            const marcaAsunto = getFieldValue(fields, 'marca o asunto') || '';
            const encargadoEmail = getFieldValue(fields, 'encargado de actividad') || '';
            const encargadoDisplayName = getFieldValue(fields, 'encargado nome') ||
                getFieldValue(fields, 'nombre encargado') ||
                getFieldValue(fields, 'encargado nombre') ||
                encargadoEmail.split('@')[0].replace(/[._]/g, ' ');
            const assignedByNombre = getFieldValue(fields, 'quién asigna') || '';
            const amount = parseFloat(getFieldValue(fields, 'monto') || '0');
            const fees = parseFloat(getFieldValue(fields, 'honorarios') || '0');
            const paymentTerms = getFieldValue(fields, 'condiciones de pago') || 'Contado';
            const deadlineStr = getFieldValue(fields, 'fecha límite');
            const companyId = await findOrCreateCompany(db, titular.companyName, titular.pipefyTitularId);
            const [clientId, assignedToId] = await Promise.all([
                findOrCreateClientUser(db, titular.clientEmail, titular.clientName, titular.clientPhone, companyId),
                findOrCreateSPIUser(db, encargadoEmail, encargadoDisplayName),
            ]);
            const otData = {
                pipefyCardId: String(card.id),
                title: actividadAsignada,
                brandName: marcaAsunto,
                serviceType: actividadAsignada,
                titularName: titular.companyName,
                encargadoEmail,
                assignedToId: assignedToId || null,
                assignedByNombre,
                amount,
                fees,
                paymentTerms,
                stage: 'solicitud',
                status: 'pending',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                deadline: safeISODate(deadlineStr),
                companyId,
                clientId,
                authLinked: clientId !== null,
                orphaned: clientId === null,
                source: 'pipefy',
            };
            const docRef = await db.collection('ots').add(otData);
            console.log(`OT Created from Pipefy: ${docRef.id}`);
            const defaultDocs = [
                { name: 'Poder Simple', type: 'poder_legal', isVaultEligible: true },
                { name: 'Logo de la Marca', type: 'logo', isVaultEligible: false },
            ];
            const batch = db.batch();
            defaultDocs.forEach((d) => {
                const ref = db.collection('documents').doc();
                batch.set(ref, {
                    otId: docRef.id,
                    clientId,
                    companyId,
                    name: d.name,
                    type: d.type,
                    status: 'pending',
                    isVaultEligible: d.isVaultEligible,
                    createdAt: new Date().toISOString(),
                });
            });
            await batch.commit();
            await db.collection('logs').add({
                otId: docRef.id,
                userId: 'system',
                action: clientId === null
                    ? `OT huérfana creada via Pipefy (Titular sin email). Titular: ${titular.companyName}. Encargado: ${encargadoEmail}`
                    : `OT created via Pipefy. Titular: ${titular.companyName}. Encargado: ${encargadoEmail}`,
                type: 'system',
                timestamp: new Date().toISOString(),
                metadata: {
                    cardId: card.id,
                    companyId,
                    clientId,
                    assignedToId: assignedToId || null,
                    encargadoEmail,
                    titularEmail: titular.clientEmail,
                    orphaned: clientId === null,
                },
            });
            res.status(200).send({
                success: true,
                otId: docRef.id,
                companyId,
                clientId,
                assignedToId: assignedToId || null,
            });
            return;
        }
        catch (error) {
            console.error('Error processing Pipefy webhook:', error);
            Sentry.captureException(error, { extra: { payload: req.body } });
            res.status(500).send('Internal Server Error');
        }
    });
    return { createOTFromPipefy };
};
exports.registerPipefyHandlers = registerPipefyHandlers;
//# sourceMappingURL=pipefy.js.map