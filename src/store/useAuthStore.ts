import { create } from 'zustand';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// Define types for roles
export type UserRole = 'client' | 'client-admin' | 'spi-admin';

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
  
  // Method to simulate login for testing/dev
  devLogin: (role: UserRole) => void;
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
                role: userData.role || 'client', // Default to client
                companyId: userData.companyId
              },
              loading: false,
              initialized: true
            });
          } else {
             // Fallback if user document doesn't exist (e.g. just signed up)
             set({
              user: {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                role: 'client',
                companyId: 'demo-company-1'
              },
              loading: false,
              initialized: true
            });
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          set({ user: null, loading: false, initialized: true });
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

  // Mock Login for Dev/Testing (Bypasses Firebase Auth)
  devLogin: (role: UserRole) => {
    set({
      user: {
        uid: role === 'client' ? 'mock-client-123' : `mock-${role}-123`,
        email: `${role}@example.com`,
        displayName: `Mock ${role.toUpperCase()}`,
        role: role,
        companyId: role === 'spi-admin' ? undefined : 'demo-company-1'
      },
      loading: false,
      initialized: true
    });
  }
}));

export default useAuthStore;
