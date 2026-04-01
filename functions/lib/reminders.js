"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerReminderHandlers = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const https_1 = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const registerReminderHandlers = (db) => {
    const checkDocumentDeadlines = (0, scheduler_1.onSchedule)("every 24 hours", async (event) => {
        logger.info("Checking document deadlines...", { structuredData: true });
        const activeOTsSnapshot = await db.collection("ots")
            .where("stage", "!=", "finalizado")
            .get();
        const now = new Date();
        const remindersSent = [];
        const escalationsSent = [];
        for (const doc of activeOTsSnapshot.docs) {
            const ot = doc.data();
            const otId = doc.id;
            const deadline = new Date(ot.deadline);
            const diffTime = deadline.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            logger.info(`Checking OT ${otId}: ${diffDays} days left.`);
            if (diffDays <= 2 && diffDays >= 0) {
                const message = `Recordatorio Automático: La OT ${ot.title} vence en ${diffDays} días. Por favor subir documentación pendiente.`;
                await db.collection("logs").add({
                    otId: otId,
                    userId: 'system',
                    action: message,
                    type: 'system',
                    timestamp: new Date().toISOString(),
                    metadata: { type: 'reminder', daysLeft: diffDays }
                });
                remindersSent.push(otId);
            }
            const lastActive = ot.updatedAt ? new Date(ot.updatedAt) : new Date(ot.createdAt);
            const daysInactive = Math.ceil((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays < 0 || daysInactive > 30) {
                const reason = diffDays < 0 ? `Vencida por ${Math.abs(diffDays)} días` : `Inactiva por ${daysInactive} días`;
                const escalationMessage = `ALERTA DE ESCALAMIENTO: OT ${ot.title} - ${reason}. Contactando contacto alternativo.`;
                await db.collection("logs").add({
                    otId: otId,
                    userId: 'system',
                    action: escalationMessage,
                    type: 'system',
                    timestamp: new Date().toISOString(),
                    metadata: { escalated: true }
                });
                escalationsSent.push(otId);
            }
        }
        logger.info(`Processed ${activeOTsSnapshot.size} OTs. Reminders: ${remindersSent.length}, Escalations: ${escalationsSent.length}`);
        // Auto-recover documents stuck in validating_ai for more than 15 minutes
        const stuckThresholdDate = new Date(Date.now() - 15 * 60 * 1000);
        const stuckThreshold = stuckThresholdDate.toISOString();
        const stuckDocsSnap = await db.collection('documents')
            .where('status', '==', 'validating_ai')
            .get();
        let recoveredCount = 0;
        for (const stuckDoc of stuckDocsSnap.docs) {
            const uploadedAt = stuckDoc.data().uploadedAt;
            if (uploadedAt && uploadedAt < stuckThreshold) {
                await stuckDoc.ref.update({
                    status: 'ocr_processed',
                    recoveredAt: new Date().toISOString(),
                    recoveryReason: 'Auto-recovered from validating_ai after 15 minutes — requires manual review',
                });
                recoveredCount++;
                logger.info(`Auto-recovered stuck document: ${stuckDoc.id}`);
            }
        }
        logger.info(`Auto-recovery complete. Recovered ${recoveredCount} stuck documents.`);
    });
    const triggerDeadlinesCheck = (0, https_1.onRequest)(async (req, res) => {
        const activeOTsSnapshot = await db.collection("ots")
            .where("stage", "!=", "finalizado")
            .get();
        const now = new Date();
        let logBuffer = "";
        for (const doc of activeOTsSnapshot.docs) {
            const ot = doc.data();
            const otId = doc.id;
            const deadline = new Date(ot.deadline);
            const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            logBuffer += `OT ${otId} (${ot.title}): ${diffDays} days left.\n`;
            if (diffDays <= 2) {
                const message = diffDays < 0
                    ? `ALERTA DE ESCALAMIENTO: Vencida hace ${Math.abs(diffDays)} días.`
                    : `Recordatorio: Vence en ${diffDays} días.`;
                await db.collection("logs").add({
                    otId: otId,
                    userId: 'system',
                    action: message,
                    type: 'system',
                    timestamp: new Date().toISOString()
                });
                logBuffer += ` -> Logged: ${message}\n`;
            }
        }
        // Same recovery logic for manual trigger
        const stuckThresholdDate2 = new Date(Date.now() - 15 * 60 * 1000);
        const stuckThreshold2 = stuckThresholdDate2.toISOString();
        const stuckDocsSnap2 = await db.collection('documents')
            .where('status', '==', 'validating_ai')
            .get();
        let recoveredCount2 = 0;
        for (const stuckDoc of stuckDocsSnap2.docs) {
            const uploadedAt = stuckDoc.data().uploadedAt;
            if (uploadedAt && uploadedAt < stuckThreshold2) {
                await stuckDoc.ref.update({
                    status: 'ocr_processed',
                    recoveredAt: new Date().toISOString(),
                    recoveryReason: 'Auto-recovered from validating_ai after 15 minutes — requires manual review',
                });
                recoveredCount2++;
                logBuffer += `-> Auto-recovered stuck document: ${stuckDoc.id}\n`;
            }
        }
        logBuffer += `\nAuto-recovery: ${recoveredCount2} documento(s) recuperado(s).\n`;
        res.send(`Check complete.\n\n${logBuffer}`);
    });
    return { checkDocumentDeadlines, triggerDeadlinesCheck };
};
exports.registerReminderHandlers = registerReminderHandlers;
//# sourceMappingURL=reminders.js.map