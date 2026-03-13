import { addDoc, collection } from 'firebase/firestore';
import { db } from './firebase';
import useAuthStore from '../store/useAuthStore';

export async function logAction(
  userId: string,
  otId: string,
  action: string,
  metadata: Record<string, any> = {}
): Promise<void> {
  try {
    const { user } = useAuthStore.getState();
    const displayName = user?.displayName || user?.email || 'Usuario Desconocido';
    const realUserId = user?.uid || userId;

    await addDoc(collection(db, 'logs'), {
      userId: realUserId,
      userName: displayName,
      otId: otId || 'general',
      action,
      type: 'system',
      timestamp: new Date().toISOString(),
      metadata,
    });
  } catch (e) {
    console.error('Error logging action:', e);
  }
}
