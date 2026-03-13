import { create } from 'zustand';
import { db } from '../lib/firebase';
import {
  collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, deleteDoc,
} from 'firebase/firestore';
import { logAction } from '../lib/logAction';
import type { Company } from './types';

interface AdminState {
  users: any[];
  companies: Company[];

  // Subscriptions — all return an unsubscribe function
  subscribeToUsers: () => () => void;
  subscribeToCompanies: () => () => void;

  // Company CRUD
  createCompany: (companyData: Partial<Company>) => Promise<void>;
  updateCompany: (id: string, companyData: Partial<Company>) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
}

const useAdminStore = create<AdminState>((set) => ({
  users: [],
  companies: [],

  subscribeToUsers: () => {
    const q = query(collection(db, 'users'));
    return onSnapshot(
      q,
      (snapshot) => {
        const users = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        set({ users });
      },
      (error) => { console.error('Error fetching users:', error); }
    );
  },

  subscribeToCompanies: () => {
    const q = query(collection(db, 'companies'), orderBy('name'));
    return onSnapshot(
      q,
      (snapshot) => {
        const companies: Company[] = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() } as Company)
        );
        set({ companies });
      },
      (error) => { console.error('Error fetching companies:', error); }
    );
  },

  createCompany: async (companyData) => {
    await addDoc(collection(db, 'companies'), {
      ...companyData,
      createdAt: new Date().toISOString(),
    });
    await logAction('admin', 'system', `Empresa Creada: ${companyData.name}`);
  },

  updateCompany: async (id, companyData) => {
    await updateDoc(doc(db, 'companies', id), {
      ...companyData,
      updatedAt: new Date().toISOString(),
    });
    await logAction('admin', 'system', `Empresa Actualizada: ${companyData.name}`);
  },

  deleteCompany: async (id) => {
    await deleteDoc(doc(db, 'companies', id));
    await logAction('admin', 'system', `Empresa Eliminada ID: ${id}`);
  },
}));

export default useAdminStore;
