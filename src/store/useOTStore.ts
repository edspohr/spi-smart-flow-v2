import { create } from 'zustand';
import { db } from '../lib/firebase';
import {
  collection, query, where, onSnapshot, addDoc, orderBy, limit, doc, updateDoc,
} from 'firebase/firestore';
import { logAction } from '../lib/logAction';
import type { OT, OTStage, Log } from './types';

interface OTState {
  ots: OT[];
  logs: Log[];
  loading: boolean;
  error: string | null;
  clearError: () => void;

  // Subscriptions — all return an unsubscribe function
  subscribeToAllOTs: () => () => void;
  subscribeToOTs: () => () => void;
  subscribeToClientOTs: (clientId: string) => () => void;
  subscribeToCompanyOTs: (companyId: string) => () => void;
  subscribeToOTLogs: (otId: string) => () => void;
  subscribeToRecentLogs: (limitCount?: number) => () => void;

  // CRUD
  createOT: (otData: Partial<OT>) => Promise<void>;
  updateOTStage: (otId: string, stage: OTStage) => Promise<void>;
  updateOTDetails: (otId: string, data: Partial<OT>) => Promise<void>;
}

const useOTStore = create<OTState>((set) => ({
  ots: [],
  logs: [],
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  subscribeToAllOTs: () => {
    set({ loading: true });
    const q = query(collection(db, 'ots'), orderBy('createdAt', 'desc'), limit(500));
    return onSnapshot(
      q,
      (snapshot) => {
        const ots: OT[] = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as OT));
        set({ ots, loading: false });
      },
      (error) => {
        console.error('Error fetching all OTs:', error);
        set({ loading: false, error: 'Error al cargar las solicitudes.' });
      }
    );
  },

  // Unordered variant used by CompaniesPage stats
  subscribeToOTs: () => {
    const q = query(collection(db, 'ots'), limit(500));
    return onSnapshot(
      q,
      (snapshot) => {
        const ots: OT[] = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as OT));
        set({ ots });
      },
      (error) => {
        console.error('Error fetching OTs:', error);
        set({ error: 'Error al cargar las solicitudes.' });
      }
    );
  },

  subscribeToClientOTs: (clientId) => {
    const q = query(collection(db, 'ots'), where('clientId', '==', clientId));
    return onSnapshot(
      q,
      (snapshot) => {
        const ots: OT[] = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as OT));
        set({ ots, loading: false });
      },
      (error) => {
        console.error('Error fetching client OTs:', error);
        set({ loading: false, error: 'Error al cargar las solicitudes.' });
      }
    );
  },

  subscribeToCompanyOTs: (companyId) => {
    const q = query(collection(db, 'ots'), where('companyId', '==', companyId));
    return onSnapshot(
      q,
      (snapshot) => {
        const ots: OT[] = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as OT));
        set({ ots });
      },
      (error) => {
        console.error('Error fetching company OTs:', error);
        set({ error: 'Error al cargar las solicitudes.' });
      }
    );
  },

  subscribeToOTLogs: (otId) => {
    const q = query(
      collection(db, 'logs'),
      where('otId', '==', otId),
      orderBy('timestamp', 'desc')
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const logs: Log[] = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Log));
        set({ logs });
      },
      (error) => {
        console.error('Error fetching OT logs:', error);
        set({ error: 'Error al cargar el historial.' });
      }
    );
  },

  subscribeToRecentLogs: (limitCount = 200) => {
    const q = query(
      collection(db, 'logs'),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const logs: Log[] = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Log));
        set({ logs });
      },
      (error) => {
        console.error('Error fetching recent logs:', error);
        set({ error: 'Error al cargar la actividad.' });
      }
    );
  },

  createOT: async (otData) => {
    set({ loading: true, error: null });
    try {
      const docRef = await addDoc(collection(db, 'ots'), {
        ...otData,
        createdAt: new Date().toISOString(),
        stage: 'solicitud',
      });
      if (otData.clientId) {
        await logAction(otData.clientId, docRef.id, `Nueva Solicitud Creada: ${otData.title}`);
      }
    } catch (err: any) {
      const message = err?.message || 'Error al crear la solicitud';
      set({ error: message });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  updateOTStage: async (otId, stage) => {
    set({ error: null });
    try {
      const otRef = doc(db, 'ots', otId);
      await updateDoc(otRef, { stage, updatedAt: new Date().toISOString() });
      await logAction('system', otId, `Etapa actualizada a: ${stage}`);
    } catch (err: any) {
      const message = err?.message || 'Error al actualizar la etapa';
      set({ error: message });
      throw err;
    }
  },

  updateOTDetails: async (otId, data) => {
    set({ error: null });
    try {
      const otRef = doc(db, 'ots', otId);
      await updateDoc(otRef, { ...data, updatedAt: new Date().toISOString() });
      await logAction('system', otId, `Detalles de OT actualizados`);
    } catch (err: any) {
      const message = err?.message || 'Error al actualizar los detalles';
      set({ error: message });
      throw err;
    }
  },
}));

export default useOTStore;
