import { create } from 'zustand';
import { db } from '../lib/firebase';
import {
  collection, query, where, onSnapshot, addDoc, orderBy, doc, updateDoc,
} from 'firebase/firestore';
import { logAction } from '../lib/logAction';
import type { OT, OTStage, Log } from './types';

interface OTState {
  ots: OT[];
  logs: Log[];
  loading: boolean;

  // Subscriptions — all return an unsubscribe function
  subscribeToAllOTs: () => () => void;
  subscribeToOTs: () => () => void;
  subscribeToClientOTs: (clientId: string) => () => void;
  subscribeToCompanyOTs: (companyId: string) => () => void;
  subscribeToOTLogs: (otId: string) => () => void;

  // CRUD
  createOT: (otData: Partial<OT>) => Promise<void>;
  updateOTStage: (otId: string, stage: OTStage) => Promise<void>;
  updateOTDetails: (otId: string, data: Partial<OT>) => Promise<void>;
}

const useOTStore = create<OTState>((set) => ({
  ots: [],
  logs: [],
  loading: false,

  subscribeToAllOTs: () => {
    set({ loading: true });
    const q = query(collection(db, 'ots'), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const ots: OT[] = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as OT));
        set({ ots, loading: false });
      },
      (error) => { console.error('Error fetching all OTs:', error); set({ loading: false }); }
    );
  },

  // Unordered variant used by CompaniesPage stats
  subscribeToOTs: () => {
    const q = query(collection(db, 'ots'));
    return onSnapshot(q, (snapshot) => {
      const ots: OT[] = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as OT));
      set({ ots });
    });
  },

  subscribeToClientOTs: (clientId) => {
    const q = query(collection(db, 'ots'), where('clientId', '==', clientId));
    return onSnapshot(q, (snapshot) => {
      const ots: OT[] = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as OT));
      set({ ots, loading: false });
    });
  },

  subscribeToCompanyOTs: (companyId) => {
    const q = query(collection(db, 'ots'), where('companyId', '==', companyId));
    return onSnapshot(q, (snapshot) => {
      const ots: OT[] = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as OT));
      set({ ots });
    });
  },

  subscribeToOTLogs: (otId) => {
    const q = query(
      collection(db, 'logs'),
      where('otId', '==', otId),
      orderBy('timestamp', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const logs: Log[] = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Log));
      set({ logs });
    });
  },

  createOT: async (otData) => {
    const docRef = await addDoc(collection(db, 'ots'), {
      ...otData,
      createdAt: new Date().toISOString(),
      stage: 'solicitud',
    });
    if (otData.clientId) {
      await logAction(otData.clientId, docRef.id, `Nueva Solicitud Creada: ${otData.title}`);
    }
  },

  updateOTStage: async (otId, stage) => {
    const otRef = doc(db, 'ots', otId);
    await updateDoc(otRef, { stage, updatedAt: new Date().toISOString() });
    await logAction('system', otId, `Etapa actualizada a: ${stage}`);
  },

  updateOTDetails: async (otId, data) => {
    const otRef = doc(db, 'ots', otId);
    await updateDoc(otRef, { ...data, updatedAt: new Date().toISOString() });
    await logAction('system', otId, `Detalles de OT actualizados`);
  },
}));

export default useOTStore;
