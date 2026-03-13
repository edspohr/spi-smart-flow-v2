import { create } from 'zustand';
import { db } from '../lib/firebase';
import {
  collection, query, where, onSnapshot, addDoc, doc, updateDoc, getDoc,
} from 'firebase/firestore';
import { uploadFile } from '../lib/uploadFile';
import { logAction } from '../lib/logAction';
import useAuthStore from './useAuthStore';
import type { Document, DocumentStatus } from './types';

interface DocumentState {
  documents: Document[];
  vaultDocuments: Document[];
  loading: boolean;

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
}

const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  vaultDocuments: [],
  loading: false,

  subscribeToClientDocuments: (clientId) => {
    set({ loading: true });
    const q = query(collection(db, 'documents'), where('clientId', '==', clientId));
    return onSnapshot(q, (snapshot) => {
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
    });
  },

  subscribeToCompanyVault: (companyId) => {
    const q = query(
      collection(db, 'documents'),
      where('companyId', '==', companyId),
      where('isVaultEligible', '==', true),
      where('status', '==', 'validated')
    );
    return onSnapshot(q, (snapshot) => {
      const vaultDocuments: Document[] = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Document)
      );
      set({ vaultDocuments });
    });
  },

  subscribeToAllVaultDocuments: () => {
    set({ loading: true });
    const q = query(
      collection(db, 'documents'),
      where('isVaultEligible', '==', true),
      where('status', '==', 'validated')
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const vaultDocuments: Document[] = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() } as Document)
        );
        set({ vaultDocuments, loading: false });
      },
      (error) => { console.error('Error fetching vault documents:', error); set({ loading: false }); }
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
    const { id: _id, ...data } = docData;
    await addDoc(collection(db, 'documents'), { ...data, createdAt: new Date().toISOString() });
    await logAction(
      docData.clientId,
      docData.otId || 'vault',
      `Documento agregado a Bóveda via Upload: ${docData.type}`
    );
  },

  linkVaultDocument: async (otId, vaultDoc) => {
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
  },

  updateDocumentStatus: async (docId, status, reason) => {
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
        await logAction('admin', docData.otId, actionText);
      }
    }
  },

  replaceDocument: async (docId, file) => {
    const fileUrl = await uploadFile(file, `documents/${docId}/${file.name}`);
    const docRef = doc(db, 'documents', docId);
    await updateDoc(docRef, {
      url: fileUrl,
      status: 'uploaded',
      rejectionReason: null,
      updatedAt: new Date().toISOString(),
      replacedAt: new Date().toISOString(),
    });

    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const docData = docSnap.data() as Document;
      await logAction('current', docData.otId || 'general', `Documento Reemplazado: ${docData.name}`);
    }
  },
}));

export default useDocumentStore;
