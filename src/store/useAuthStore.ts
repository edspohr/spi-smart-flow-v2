import { create } from "zustand";
import { auth, db } from "../lib/firebase";
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

// Define types for roles
export type UserRole = "client" | "spi-admin" | "guest";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  companyId?: string;
}


interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: UserProfile | null) => void;
  initializeAuthListener: () => () => void;
  logout: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  markNotificationsRead: () => Promise<void>;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  initialized: false,

  setUser: (user) => set({ user, loading: false }),

  // Initialize Firebase Auth Listener
  initializeAuthListener: () => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const docRef = doc(db, "users", firebaseUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const userData = docSnap.data();
            set({
              user: {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                role: userData.role || "guest",
                companyId: userData.companyId,
              },
              loading: false,
              initialized: true,
            });
          } else {
            // Auto-heal: new magic-link user with no Firestore doc yet
            const guestDoc = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.email?.split('@')[0] || 'Usuario',
              role: "guest" as UserRole,
              companyId: "",
              createdAt: new Date().toISOString(),
            };
            try {
              await setDoc(docRef, guestDoc);
            } catch (e) {
              console.warn("No se pudo crear el perfil de usuario:", e);
            }
            set({ user: guestDoc, loading: false, initialized: true });
          }
        } catch (error: any) {
          console.warn("Aviso: No se pudo obtener el perfil de Firestore:", error.message);
          set({
            user: {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              role: "guest",
              companyId: "Pendiente",
            },
            loading: false,
            initialized: true,
          });
        }
      } else {
        set({ user: null, loading: false, initialized: true });
      }
    });
    return unsubscribe;
  },

  logout: async () => {
    await firebaseSignOut(auth);
    set({ user: null });
  },

  signIn: async (email: string, password: string) => {
    set({ loading: true });
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged handles the rest
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  signInWithGoogle: async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email || '';
      const domain = email.split('@')[1]?.toLowerCase() || '';

      const allowedDomains = (import.meta.env.VITE_ALLOWED_AUTH_DOMAINS || '')
        .split(',')
        .map((d: string) => d.trim().toLowerCase())
        .filter(Boolean);

      // Domain whitelist check
      if (allowedDomains.length > 0 && !allowedDomains.includes(domain)) {
        await firebaseSignOut(auth);
        throw new Error(
          `El dominio ${domain} no está autorizado. Usa una cuenta corporativa.`
        );
      }

      // Auto-heal: the existing onAuthStateChanged listener creates a
      // Firestore user doc with role: 'guest' on first sign-in. No
      // additional work needed here regardless of provider.
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Inicio de sesión cancelado.');
      }
      if (error.code === 'auth/popup-blocked') {
        throw new Error('El navegador bloqueó la ventana emergente. Habilítala e intenta de nuevo.');
      }
      throw error;
    }
  },

  markNotificationsRead: async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    try {
      await updateDoc(doc(db, 'users', uid), {
        lastNotificationReadAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn('Failed to mark notifications read:', e);
    }
  },

}));

export default useAuthStore;
