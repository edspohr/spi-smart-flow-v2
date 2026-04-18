import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as Sentry from '@sentry/node';

interface DeleteUserData {
  uid: string;
}

/**
 * Soft-delete a user: disables Firebase Auth access and marks the Firestore
 * profile with deletedAt + deletedBy while preserving the record (and therefore
 * the audit trail of past actions). Reversible by clearing those fields + re-
 * enabling the Auth account — not exposed as a dedicated CF yet; do it manually
 * from the Firebase console if ever needed.
 */
export const deleteUser = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Auth required.');
  }

  const callerUid = request.auth.uid;
  const db = admin.firestore();

  // Verify caller is spi-admin (Firestore-backed; custom claims are optional).
  const callerSnap = await db.collection('users').doc(callerUid).get();
  if (!callerSnap.exists || (callerSnap.data() as any)?.role !== 'spi-admin') {
    throw new HttpsError('permission-denied', 'Only spi-admin can delete users.');
  }

  const { uid } = request.data as DeleteUserData;
  if (!uid) {
    throw new HttpsError('invalid-argument', 'uid is required.');
  }
  if (uid === callerUid) {
    throw new HttpsError(
      'failed-precondition',
      'No podés eliminar tu propio usuario.',
    );
  }

  // 1. Verify the target Firestore profile exists before touching Auth.
  const targetRef = db.collection('users').doc(uid);
  const targetSnap = await targetRef.get();
  if (!targetSnap.exists) {
    logger.warn(`deleteUser: target Firestore doc ${uid} not found.`);
    throw new HttpsError('not-found', 'El usuario ya no existe en Firestore.');
  }
  const targetData = targetSnap.data() as any;
  const email: string = targetData?.email || uid;

  try {
    // 2. Disable Firebase Auth — blocks sign-in immediately. Tolerant of legacy
    //    users whose Firestore doc id does NOT match their Auth uid (we still
    //    soft-delete the Firestore side so they disappear from the admin UI).
    try {
      await admin.auth().updateUser(uid, { disabled: true });
    } catch (err: any) {
      const code: string | undefined = err?.code;
      if (code === 'auth/user-not-found') {
        logger.warn(`deleteUser: auth record missing for ${uid}; Firestore-only soft delete.`);
      } else if (code === 'auth/invalid-uid') {
        logger.warn(`deleteUser: invalid uid "${uid}" for Auth; Firestore-only soft delete.`);
      } else {
        logger.error(`deleteUser: admin.auth().updateUser failed for ${uid}:`, err);
        throw new HttpsError('internal', `Auth error: ${code || err?.message || 'unknown'}`);
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
  } catch (err: any) {
    if (err instanceof HttpsError) throw err;
    logger.error('deleteUser failed:', err);
    Sentry.captureException(err, { extra: { uid, callerUid } });
    throw new HttpsError('internal', err?.message || 'Error deleting user.');
  }
});
