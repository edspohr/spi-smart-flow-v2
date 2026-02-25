"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOTFromPipefy = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const db = admin.firestore();
exports.createOTFromPipefy = functions.https.onRequest(async (req, res) => {
    try {
        const payload = req.body;
        console.log("Received Pipefy Webhook:", JSON.stringify(payload, null, 2));
        if (!payload.data || !payload.data.card) {
            res.status(400).send("Invalid Payload");
            return;
        }
        const { card } = payload.data;
        // Map Pipefy Fields to OT Schema
        // This requires knowing the specific field names in Pipefy
        const getFieldValue = (fieldName) => {
            const field = card.fields.find(f => f.name.toLowerCase().includes(fieldName.toLowerCase()));
            return field ? field.value : null;
        };
        const clientEmail = getFieldValue("email") || "cliente@example.com"; // Fallback or assume client identification
        const serviceType = getFieldValue("tipo de servicio") || "General";
        const amount = parseFloat(getFieldValue("monto") || "0");
        const deadlineStr = getFieldValue("fecha límite");
        const fees = parseFloat(getFieldValue("honorarios") || "0");
        const paymentTerms = getFieldValue("condiciones de pago") || "Contado";
        // Try to find client by email
        let clientId = "pipefy-guest";
        let companyId = "default-company";
        // ... (existing client lookup)
        const userSnapshot = await db.collection("users").where("email", "==", clientEmail).limit(1).get();
        if (!userSnapshot.empty) {
            const userDoc = userSnapshot.docs[0];
            clientId = userDoc.id;
            companyId = userDoc.data().companyId || "default-company";
        }
        const otData = {
            pipefyCardId: card.id,
            title: card.title,
            serviceType: serviceType,
            amount: amount,
            fees: fees,
            paymentTerms: paymentTerms,
            stage: 'solicitud', // Initial stage
            status: 'pending',
            createdAt: new Date().toISOString(),
            deadline: deadlineStr ? new Date(deadlineStr).toISOString() : new Date(Date.now() + 86400000 * 7).toISOString(),
            companyId: companyId,
            clientId: clientId,
            source: 'pipefy'
        };
        // Create OT in Firestore
        const docRef = await db.collection("ots").add(otData);
        console.log(`OT Created from Pipefy: ${docRef.id}`);
        // Create Default Documents based on Service Type
        // This logic should ideally be in a shared config or database
        const defaultDocs = [
            { name: "Poder Simple", type: "sign", isVaultEligible: true },
            { name: "Logo de la Marca", type: "upload", isVaultEligible: true },
            { name: "Descripción de la Actividad", type: "text", isVaultEligible: false }
        ];
        if (serviceType.toLowerCase().includes("sanitaria")) {
            defaultDocs.push({ name: "Resolución Sanitaria Anterior", type: "upload", isVaultEligible: true });
        }
        const batch = db.batch();
        defaultDocs.forEach((docDef) => {
            const newDocRef = db.collection("documents").doc();
            batch.set(newDocRef, {
                otId: docRef.id,
                clientId: clientId,
                companyId: companyId,
                name: docDef.name,
                type: docDef.type, // 'sign', 'upload', 'text'
                status: 'pending',
                isVaultEligible: docDef.isVaultEligible,
                createdAt: new Date().toISOString()
            });
        });
        await batch.commit();
        console.log(`Created ${defaultDocs.length} default documents for OT ${docRef.id}`);
        // Log Action
        await db.collection("logs").add({
            otId: docRef.id,
            userId: 'system',
            action: `Solicitud creada vía Pipefy (Card: ${card.id})`,
            type: 'system',
            timestamp: new Date().toISOString()
        });
        res.status(200).send({ success: true, otId: docRef.id });
    }
    catch (error) {
        console.error("Error processing Pipefy webhook:", error);
        res.status(500).send("Internal Server Error");
    }
});
//# sourceMappingURL=pipefy.js.map