import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

// Ensure app is initialized (it might be in index.ts, but good practice to check/init if needed, 
// though usually admin.initializeApp() is top level in index.ts)
// We'll assume admin is initialized in index.ts or here.
if (admin.apps.length === 0) {
    admin.initializeApp();
}

const db = admin.firestore();

// Scheduled function to check deadlines daily
export const checkDocumentDeadlines = onSchedule("every 24 hours", async (event) => {
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

        // Calculate days remaining
        const diffTime = deadline.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        logger.info(`Checking OT ${otId}: ${diffDays} days left.`);

        // 2. Logic: If approaching deadline (e.g., 2 days left)
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

        // 3. Escalation Logic: If last activity > 30 days or deadline passed
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
});

// HTTP trigger for testing
export const triggerDeadlinesCheck = onRequest(async (req, res) => {
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
    
    res.send(`Check complete.\n\n${logBuffer}`);
});
