import { create } from "zustand";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, signOut as firebaseSignOut, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Define types for roles
export type UserRole = "client" | "spi-admin" | "guest";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  companyId?: string;
}

const MAGIC_LINK_EMAIL_KEY = 'spi_magic_link_email';

const actionCodeSettings = {
  url: window.location.origin,
  handleCodeInApp: true,
};

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  setUser: (user: UserProfile | null) => void;
  initializeAuthListener: () => () => void;
  logout: () => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  completeMagicLinkSignIn: () => Promise<boolean>;
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

  sendMagicLink: async (email: string) => {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    localStorage.setItem(MAGIC_LINK_EMAIL_KEY, email);
  },

  completeMagicLinkSignIn: async () => {
    if (!isSignInWithEmailLink(auth, window.location.href)) return false;

    let email = localStorage.getItem(MAGIC_LINK_EMAIL_KEY);
    if (!email) {
      // Fallback: ask the user (different browser/device scenario)
      email = window.prompt('Por favor, confirma tu correo electrónico para completar el acceso:');
    }
    if (!email) return false;

    set({ loading: true });
    try {
      await signInWithEmailLink(auth, email, window.location.href);
      localStorage.removeItem(MAGIC_LINK_EMAIL_KEY);
      // Clean the URL so refreshing doesn't re-trigger the link
      window.history.replaceState(null, '', window.location.pathname);
      return true;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
}));

export default useAuthStore;
