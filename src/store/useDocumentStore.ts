import { create } from 'zustand';
import { db } from '../lib/firebase';
import {
  collection, query, where, onSnapshot, addDoc, doc, updateDoc, getDoc, getDocs,
  orderBy, limit,
} from 'firebase/firestore';
import { uploadFile } from '../lib/uploadFile';
import { logAction } from '../lib/logAction';
import useAuthStore from './useAuthStore';
import type { Document, DocumentStatus, DocumentVersion } from './types';

interface DocumentState {
  documents: Document[];
  vaultDocuments: Document[];
  loading: boolean;
  error: string | null;
  clearError: () => void;

  // Subscriptions — all return an unsubscribe function
  subscribeToClientDocuments: (clientId: string) => () => void;
  subscribeToCompanyVault: (companyId: string) => () => void;
  subscribeToAllVaultDocuments: () => () => void;

  // Vault
  checkVaultForReuse: (documentType: string) => Document | undefined;
  addToVault: (docData: Document) => Promise<void>;
  linkVaultDocument: (otId: string, vaultDoc: Document) => Promise<void>;

  // Status / file management
  updateDocumentStatus: (docId: string, status: DocumentStatus, reason?: string) => Promise<void>;
  replaceDocument: (docId: string, file: File) => Promise<void>;
  getDocumentVersions: (docId: string) => Promise<DocumentVersion[]>;
}

const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  vaultDocuments: [],
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  subscribeToClientDocuments: (clientId) => {
    set({ loading: true });
    const q = query(collection(db, 'documents'), where('clientId', '==', clientId));
    return onSnapshot(
      q,
      (snapshot) => {
        const documents: Document[] = [];
        const vaultDocuments: Document[] = [];
        snapshot.docs.forEach((d) => {
          const data = { id: d.id, ...d.data() } as Document;
          if (data.isVaultEligible && data.status === 'validated') {
            vaultDocuments.push(data);
          } else {
            documents.push(data);
          }
        });
        set({ documents, vaultDocuments, loading: false });
      },
      (error) => {
        console.error('Error fetching client documents:', error);
        set({ loading: false, error: 'Error al cargar los documentos.' });
      }
    );
  },

  subscribeToCompanyVault: (companyId) => {
    const q = query(
      collection(db, 'documents'),
      where('companyId', '==', companyId),
      where('isVaultEligible', '==', true),
      where('status', '==', 'validated')
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const vaultDocuments: Document[] = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() } as Document)
        );
        set({ vaultDocuments });
      },
      (error) => {
        console.error('Error fetching company vault:', error);
        set({ error: 'Error al cargar la bóveda.' });
      }
    );
  },

  subscribeToAllVaultDocuments: () => {
    set({ loading: true });
    const q = query(
      collection(db, 'documents'),
      where('isVaultEligible', '==', true),
      where('status', '==', 'validated'),
      limit(1000)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const vaultDocuments: Document[] = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() } as Document)
        );
        set({ vaultDocuments, loading: false });
      },
      (error) => {
        console.error('Error fetching vault documents:', error);
        set({ loading: false, error: 'Error al cargar la bóveda.' });
      }
    );
  },

  checkVaultForReuse: (documentType) => {
    return get().vaultDocuments.find(
      (d) =>
        d.type === documentType &&
        d.status === 'validated' &&
        d.isVaultEligible &&
        (d.validUntil ? new Date(d.validUntil) > new Date() : true)
    );
  },

  addToVault: async (docData) => {
    set({ error: null });
    try {
      const { id: _id, ...data } = docData;
      await addDoc(collection(db, 'documents'), { ...data, createdAt: new Date().toISOString() });
      await logAction(
        docData.clientId,
        docData.otId || 'vault',
        `Documento agregado a Bóveda via Upload: ${docData.type}`
      );
    } catch (err: any) {
      const message = err?.message || 'Error al agregar a la bóveda';
      set({ error: message });
      throw err;
    }
  },

  linkVaultDocument: async (otId, vaultDoc) => {
    set({ error: null });
    try {
      const newDoc = {
        name: vaultDoc.name,
        url: vaultDoc.url || '',
        status: 'validated' as DocumentStatus,
        otId,
        clientId: vaultDoc.clientId,
        companyId: vaultDoc.companyId || '',
        type: vaultDoc.type || 'generic',
        uploadedAt: new Date().toISOString(),
        isVaultEligible: false,
      };
      await addDoc(collection(db, 'documents'), newDoc);
      const userId = useAuthStore.getState().user?.uid || 'client';
      await logAction(userId, otId, `Documento vinculado desde Bóveda: ${vaultDoc.name}`);
    } catch (err: any) {
      const message = err?.message || 'Error al vincular documento de la bóveda';
      set({ error: message });
      throw err;
    }
  },

  updateDocumentStatus: async (docId, status, reason) => {
    set({ error: null });
    try {
      const docRef = doc(db, 'documents', docId);
      await updateDoc(docRef, {
        status,
        ...(reason && { rejectionReason: reason }),
        updatedAt: new Date().toISOString(),
      });

      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const docData = docSnap.data() as Document;
        const actionText =
          status === 'validated'
            ? `Documento Aprobado: ${docData.name}`
            : `Documento Rechazado: ${docData.name}. Razón: ${reason}`;
        if (docData.otId) {
          const userId = useAuthStore.getState().user?.uid || 'admin';
          await logAction(userId, docData.otId, actionText);
        }
      }
    } catch (err: any) {
      const message = err?.message || 'Error al actualizar el estado del documento';
      set({ error: message });
      throw err;
    }
  },

  replaceDocument: async (docId, file) => {
    set({ error: null });
    try {
      const docRef = doc(db, 'documents', docId);

      // Snapshot current version before overwriting
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const current = docSnap.data() as Document;
        const userId = useAuthStore.getState().user?.uid || 'client';
        if (current.url) {
          await addDoc(collection(db, 'documents', docId, 'versions'), {
            url: current.url,
            status: current.status,
            uploadedAt: current.uploadedAt || null,
            replacedAt: new Date().toISOString(),
            replacedBy: userId,
          });
        }
      }

      const fileUrl = await uploadFile(file, `documents/${docId}/${file.name}`);
      await updateDoc(docRef, {
        url: fileUrl,
        status: 'uploaded',
        rejectionReason: null,
        updatedAt: new Date().toISOString(),
        replacedAt: new Date().toISOString(),
      });

      if (docSnap.exists()) {
        const docData = docSnap.data() as Document;
        const userId = useAuthStore.getState().user?.uid || 'client';
        await logAction(userId, docData.otId || 'general', `Documento Reemplazado: ${docData.name}`);
      }
    } catch (err: any) {
      const message = err?.message || 'Error al reemplazar el documento';
      set({ error: message });
      throw err;
    }
  },

  getDocumentVersions: async (docId) => {
    const q = query(
      collection(db, 'documents', docId, 'versions'),
      orderBy('replacedAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as DocumentVersion));
  },
}));

export default useDocumentStore;
