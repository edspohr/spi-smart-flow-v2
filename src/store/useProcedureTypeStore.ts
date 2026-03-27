import { create } from 'zustand';
import { db } from '../lib/firebase';
import {
  collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, serverTimestamp,
} from 'firebase/firestore';
import type { ProcedureType } from './types';

interface ProcedureTypeState {
  procedureTypes: ProcedureType[];
  loading: boolean;

  subscribeToAll: () => () => void;
  createType: (data: Omit<ProcedureType, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateType: (id: string, data: Partial<Omit<ProcedureType, 'id' | 'createdAt'>>) => Promise<void>;
  toggleActive: (id: string, isActive: boolean) => Promise<void>;
}

const useProcedureTypeStore = create<ProcedureTypeState>((set) => ({
  procedureTypes: [],
  loading: true,

  subscribeToAll: () => {
    const q = query(collection(db, 'procedureTypes'), orderBy('code'));
    return onSnapshot(q, (snap) => {
      const procedureTypes = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ProcedureType));
      set({ procedureTypes, loading: false });
    }, (err) => {
      console.error('procedureTypes subscription error:', err);
      set({ loading: false });
    });
  },

  createType: async (data) => {
    const ref = await addDoc(collection(db, 'procedureTypes'), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  },

  updateType: async (id, data) => {
    await updateDoc(doc(db, 'procedureTypes', id), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  toggleActive: async (id, isActive) => {
    await updateDoc(doc(db, 'procedureTypes', id), {
      isActive,
      updatedAt: serverTimestamp(),
    });
  },
}));

export default useProcedureTypeStore;
