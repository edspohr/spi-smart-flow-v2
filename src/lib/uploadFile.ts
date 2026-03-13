import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

export async function uploadFile(file: File | Blob, storagePath: string): Promise<string> {
  const storageRef = ref(storage, storagePath);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
}
