import { create } from 'zustand';
import { db, auth, functions } from '../lib/firebase';
import {
  collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { logAction } from '../lib/logAction';
import type { Company, AppUser } from './types';

interface AdminState {
  users: AppUser[];
  companies: Company[];
  loading: boolean;
  error: string | null;
  clearError: () => void;

  // Subscriptions — all return an unsubscribe function
  subscribeToUsers: () => () => void;
  subscribeToCompanies: () => () => void;

  // User management
  createUserAccount: (data: { email: string; password: string; displayName: string; role: AppUser['role']; companyId?: string }) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  toggleUserDisabled: (userId: string, disabled: boolean) => Promise<void>;
  // Activation: updates Firestore + calls activateUser Cloud Function
  updateUserActivation: (uid: string, companyId: string, role: AppUser['role'], activatedBy: string) => Promise<void>;

  // Company CRUD
  createCompany: (companyData: Partial<Company>) => Promise<void>;
  updateCompany: (id: string, companyData: Partial<Company>) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
}

const useAdminStore = create<AdminState>((set) => ({
  users: [],
  companies: [],
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  subscribeToUsers: () => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const users: AppUser[] = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as AppUser));
        set({ users });
      },
      (error) => {
        console.error('Error fetching users:', error);
        set({ error: 'Error al cargar los usuarios.' });
      }
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
      (error) => {
        console.error('Error fetching companies:', error);
        set({ error: 'Error al cargar las empresas.' });
      }
    );
  },

  createUserAccount: async (data) => {
    set({ loading: true, error: null });
    try {
      const fn = httpsCallable(functions, 'createUser');
      await fn(data);
    } catch (err: any) {
      const message = err?.message || 'Error al crear el usuario';
      set({ error: message });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  sendPasswordReset: async (email) => {
    set({ error: null });
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      const message = err?.message || 'Error al enviar el correo de restablecimiento';
      set({ error: message });
      throw err;
    }
  },

  toggleUserDisabled: async (userId, disabled) => {
    set({ error: null });
    try {
      await updateDoc(doc(db, 'users', userId), { disabled });
      await logAction('admin', 'system', `Usuario ${disabled ? 'desactivado' : 'activado'}: ${userId}`);
    } catch (err: any) {
      const message = err?.message || 'Error al actualizar el usuario';
      set({ error: message });
      throw err;
    }
  },

  updateUserActivation: async (uid, companyId, role, activatedBy) => {
    set({ error: null });
    try {
      await updateDoc(doc(db, 'users', uid), {
        companyId,
        role,
        activatedAt: serverTimestamp(),
        activatedBy,
      });
      const fn = httpsCallable(functions, 'activateUser');
      await fn({ uid, companyId, role });
      await logAction('admin', 'system', `Usuario activado: ${uid} → rol ${role}`);
    } catch (err: any) {
      const message = err?.message || 'Error al activar el usuario';
      set({ error: message });
      throw err;
    }
  },

  createCompany: async (companyData) => {
    set({ loading: true, error: null });
    try {
      await addDoc(collection(db, 'companies'), {
        ...companyData,
        createdAt: new Date().toISOString(),
      });
      await logAction('admin', 'system', `Empresa Creada: ${companyData.name}`);
    } catch (err: any) {
      const message = err?.message || 'Error al crear la empresa';
      set({ error: message });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  updateCompany: async (id, companyData) => {
    set({ loading: true, error: null });
    try {
      await updateDoc(doc(db, 'companies', id), {
        ...companyData,
        updatedAt: new Date().toISOString(),
      });
      await logAction('admin', 'system', `Empresa Actualizada: ${companyData.name}`);
    } catch (err: any) {
      const message = err?.message || 'Error al actualizar la empresa';
      set({ error: message });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  deleteCompany: async (id) => {
    set({ loading: true, error: null });
    try {
      await deleteDoc(doc(db, 'companies', id));
      await logAction('admin', 'system', `Empresa Eliminada ID: ${id}`);
    } catch (err: any) {
      const message = err?.message || 'Error al eliminar la empresa';
      set({ error: message });
      throw err;
    } finally {
      set({ loading: false });
    }
  },
}));

export default useAdminStore;
