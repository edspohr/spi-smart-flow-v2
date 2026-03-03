import { create } from "zustand";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, signOut as firebaseSignOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Define types for roles
export type UserRole = "client" | "client-admin" | "spi-admin" | "guest";

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
  signUp: (email: string, password: string, displayName: string, companyName: string) => Promise<void>;
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
          // Fetch additional user role from Firestore
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
            // Fallback if user document doesn't exist (e.g. just signed up, race condition)
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
        } catch (error: any) {
          // If it's a permission error, it's likely the doc hasn't been created/rules not deployed
          // We still set a minimal guest user to avoid blocking the UI if they just signed up
          console.warn("Aviso: No se pudo obtener el perfil de Firestore (posible falta de permisos o documento inexistente):", error.message);
          
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
      // The onAuthStateChanged listener will handle setting the user
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  signUp: async (email, password, displayName, companyName) => {
    set({ loading: true });
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update profile with displayName
      await updateProfile(firebaseUser, { displayName });

      // Create Firestore document
      const userDoc = {
        uid: firebaseUser.uid,
        email,
        displayName,
        companyId: companyName,
        role: 'guest' as UserRole,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), userDoc);
      
      // User will be set by the listener
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  }
}));

export default useAuthStore;
