"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = void 0;
const https_1 = require("firebase-functions/v2/https");
const firebase_functions_1 = require("firebase-functions");
const admin = require("firebase-admin");
const Sentry = require("@sentry/node");
/**
 * Soft-delete a user: disables Firebase Auth access and marks the Firestore
 * profile with deletedAt + deletedBy while preserving the record (and therefore
 * the audit trail of past actions). Reversible by clearing those fields + re-
 * enabling the Auth account — not exposed as a dedicated CF yet; do it manually
 * from the Firebase console if ever needed.
 */
exports.deleteUser = (0, https_1.onCall)(async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Auth required.');
    }
    const callerUid = request.auth.uid;
    const db = admin.firestore();
    // Verify caller is spi-admin (Firestore-backed; custom claims are optional).
    const callerSnap = await db.collection('users').doc(callerUid).get();
    if (!callerSnap.exists || ((_a = callerSnap.data()) === null || _a === void 0 ? void 0 : _a.role) !== 'spi-admin') {
        throw new https_1.HttpsError('permission-denied', 'Only spi-admin can delete users.');
    }
    const { uid } = request.data;
    if (!uid) {
        throw new https_1.HttpsError('invalid-argument', 'uid is required.');
    }
    if (uid === callerUid) {
        throw new https_1.HttpsError('failed-precondition', 'No podés eliminar tu propio usuario.');
    }
    // 1. Verify the target Firestore profile exists before touching Auth.
    const targetRef = db.collection('users').doc(uid);
    const targetSnap = await targetRef.get();
    if (!targetSnap.exists) {
        firebase_functions_1.logger.warn(`deleteUser: target Firestore doc ${uid} not found.`);
        throw new https_1.HttpsError('not-found', 'El usuario ya no existe en Firestore.');
    }
    const targetData = targetSnap.data();
    const email = (targetData === null || targetData === void 0 ? void 0 : targetData.email) || uid;
    try {
        // 2. Disable Firebase Auth — blocks sign-in immediately. Tolerant of legacy
        //    users whose Firestore doc id does NOT match their Auth uid (we still
        //    soft-delete the Firestore side so they disappear from the admin UI).
        try {
            await admin.auth().updateUser(uid, { disabled: true });
        }
        catch (err) {
            const code = err === null || err === void 0 ? void 0 : err.code;
            if (code === 'auth/user-not-found') {
                firebase_functions_1.logger.warn(`deleteUser: auth record missing for ${uid}; Firestore-only soft delete.`);
            }
            else if (code === 'auth/invalid-uid') {
                firebase_functions_1.logger.warn(`deleteUser: invalid uid "${uid}" for Auth; Firestore-only soft delete.`);
            }
            else {
                firebase_functions_1.logger.error(`deleteUser: admin.auth().updateUser failed for ${uid}:`, err);
                throw new https_1.HttpsError('internal', `Auth error: ${code || (err === null || err === void 0 ? void 0 : err.message) || 'unknown'}`);
            }
        }
        // 3. Mark Firestore profile as deleted (preserves audit trail).
        await targetRef.update({
            disabled: true,
            deletedAt: admin.firestore.FieldValue.serverTimestamp(),
            deletedBy: callerUid,
        });
        // 4. Audit log
        await db.collection('logs').add({
            otId: 'system',
            userId: callerUid,
            action: `Usuario eliminado (soft): ${email}`,
            type: 'system',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            metadata: { targetUid: uid },
        });
        return { success: true };
    }
    catch (err) {
        if (err instanceof https_1.HttpsError)
            throw err;
        firebase_functions_1.logger.error('deleteUser failed:', err);
        Sentry.captureException(err, { extra: { uid, callerUid } });
        throw new https_1.HttpsError('internal', (err === null || err === void 0 ? void 0 : err.message) || 'Error deleting user.');
    }
});
//# sourceMappingURL=userAdmin.js.map