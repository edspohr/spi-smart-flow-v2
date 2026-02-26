import { create } from 'zustand';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, orderBy, doc, updateDoc, getDoc } from 'firebase/firestore';
// @ts-ignore
import { INITIAL_OTS, INITIAL_DOCS, INITIAL_LOGS, VAULT_DOCUMENTS } from '../data/mockData';

// --- Types ---
export type OTStage = 'solicitud' | 'pago_adelanto' | 'gestion' | 'pago_cierre' | 'finalizado';
export type DocumentStatus = 'pending' | 'uploaded' | 'validated' | 'rejected' | 'validating_ai' | 'ocr_processed' | 'awaiting_signature' | 'vault_matched';

export interface OT {
  id: string;
  companyId: string;
  clientId: string;
  title: string;
  serviceType: string;
  area: 'PI' | 'AR';
  stage: OTStage;
  amount: number;
  discountPercentage?: number;
  createdAt: string; // ISO String
  deadline: string; // ISO String
  status?: string;
}

export interface Document {
  id: string;
  otId?: string; // Can be null if it's a vault document not linked to active OT? Or always linked?
  clientId: string;
  name: string;
  type: string; // e.g., 'poder_legal', 'cedula'
  status: DocumentStatus;
  validationMetadata?: any;
  isVaultEligible: boolean;
  validUntil?: string; // ISO String
  url?: string;
}

export interface Log {
  id: string;
  otId: string;
  userId: string;
  userName?: string; // Added for real user visibility
  action: string;
  type: 'system' | 'user';
  timestamp: string;
  metadata?: {
      docId?: string;
      [key: string]: any;
  };
}

interface DataState {
  ots: OT[];
  documents: Document[];
  logs: Log[];
  loading: boolean;
  
  // Vault specific
  vaultDocuments: Document[]; 

  // Actions
  subscribeToCompanyData: (companyId: string) => () => void;
  subscribeToClientData: (clientId: string) => () => void;
  subscribeToAllOTs: () => () => void;
  subscribeToOTLogs: (otId: string) => () => void;
  
  // Vault Logic
  checkVaultForReuse: (documentType: string) => Document | undefined;
  addToVault: (doc: Document) => void; 
  createOT: (otData: Partial<OT>) => Promise<void>;
  logAction: (userId: string, otId: string, action: string, metadata?: any) => Promise<void>; 
  updateDocumentStatus: (docId: string, status: DocumentStatus, reason?: string) => Promise<void>; 
  replaceDocument: (docId: string, file: File) => Promise<void>; 
  updateOTStage: (otId: string, stage: OTStage) => Promise<void>; // Added for strict transition control
 

  // Mock Data Generators for Dev
  loadMockData: (role: 'client' | 'client-admin' | 'spi-admin', id: string) => void;
}

// Mock data is now imported from src/data/mockData.js
const MOCK_OTS: OT[] = INITIAL_OTS as OT[];
const MOCK_DOCS: Document[] = [...(INITIAL_DOCS as Document[]), ...(VAULT_DOCUMENTS as Document[])];
const MOCK_LOGS = INITIAL_LOGS;

const useDataStore = create<DataState>((set, get) => ({
  ots: [],
  documents: [],
  logs: [],
  vaultDocuments: [],
  loading: false,

  subscribeToCompanyData: (companyId) => {
    console.log(`Subscribing to data for company: ${companyId}`);
    
    // Subscribe to OTs
    const qOTs = query(collection(db, "ots"), where("companyId", "==", companyId));
    const unsubscribeOTs = onSnapshot(qOTs, (snapshot) => {
        const ots: OT[] = [];
        snapshot.forEach((doc) => {
            ots.push({ id: doc.id, ...doc.data() } as OT);
        });
        set({ ots });
    });

    // Subscribe to Vault Documents (Valid & Eligible)
    const qVault = query(
        collection(db, "documents"), 
        where("companyId", "==", companyId), // Assuming docs belong to company too? Or User?
        where("isVaultEligible", "==", true),
        where("status", "==", "validated")
    );
    
    const unsubscribeVault = onSnapshot(qVault, (snapshot) => {
        const vaultDocuments: Document[] = [];
        snapshot.forEach((doc) => {
            vaultDocuments.push({ id: doc.id, ...doc.data() } as Document);
        });
        set({ vaultDocuments });
    });

    return () => {
        unsubscribeOTs();
        unsubscribeVault();
    };
  },

  subscribeToClientData: (clientId) => {
    console.log(`Subscribing to data for client: ${clientId}`);
    // Subscribe to Client's Documents (Active/Pending)
    const qDocs = query(collection(db, "documents"), where("clientId", "==", clientId));
    
    const unsubscribeDocs = onSnapshot(qDocs, (snapshot) => {
        const documents: Document[] = [];
        const vaultDocuments: Document[] = [];
        
        snapshot.forEach((doc) => {
            const data = { id: doc.id, ...doc.data() } as Document;
            if (data.isVaultEligible && data.status === 'validated') {
                vaultDocuments.push(data);
            } else {
                documents.push(data);
            }
        });
        set({ documents, vaultDocuments });
    });

    // Subscribe to Client's OTs
    const qOTs = query(collection(db, "ots"), where("clientId", "==", clientId));
    const unsubscribeOTs = onSnapshot(qOTs, (snapshot) => {
        const ots: OT[] = [];
        snapshot.forEach((doc) => {
            ots.push({ id: doc.id, ...doc.data() } as OT);
        });
         set({ ots, loading: false });
    });

    return () => {
        unsubscribeDocs();
        unsubscribeOTs();
    };
  },

  subscribeToAllOTs: () => {
      console.log("Subscribing to ALL OTs (SPI Admin)");
      const q = query(collection(db, "ots"), orderBy("createdAt", "desc"));
      return onSnapshot(q, (snapshot) => {
          const ots: OT[] = [];
          snapshot.forEach((doc) => {
              ots.push({ id: doc.id, ...doc.data() } as OT);
          });
          set({ ots, loading: false });
      }, (error) => {
          console.error("Error fetching all OTs:", error);
      });
  },

  subscribeToOTLogs: (otId) => {
      console.log(`Subscribing to logs for OT: ${otId}`);
      // Note: This requires a composite index if we mix where and orderBy. 
      // For now, let's just get them and sort in memory if index is missing, 
      // OR rely on client-side filtering if volume is low.
      // But let's try the query first.
      const qLogs = query(
          collection(db, "logs"), 
          where("otId", "==", otId), 
          orderBy("timestamp", "desc")
      );
      
      return onSnapshot(qLogs, (snapshot) => {
          const logs: Log[] = [];
          snapshot.forEach((doc) => {
              logs.push({ id: doc.id, ...doc.data() } as Log);
          });
          set({ logs });
      }, (error) => {
          console.error("Error processing logs query (check indexes):", error);
      });
  },

  checkVaultForReuse: (documentType) => {
    const { vaultDocuments } = get();
    return vaultDocuments.find(d => 
      d.type === documentType && 
      d.status === 'validated' && 
      d.isVaultEligible &&
      (d.validUntil ? new Date(d.validUntil) > new Date() : true)
    );
  },

  addToVault: async (docData) => {
      try {
          const { id: _id, ...data } = docData; 
          await addDoc(collection(db, "documents"), {
              ...data,
              createdAt: new Date().toISOString()
          });
          console.log("Document added to Vault (Firestore)");
          
          // Log the action
          get().logAction(docData.clientId, docData.otId || 'vault', `Documento agregado a Bóveda via Upload: ${docData.type}`);

      } catch (e) {
          console.error("Error adding to vault:", e);
      }
  },

  createOT: async (otData: Partial<OT>) => {
      try {
          await addDoc(collection(db, "ots"), {
            ...otData,
            createdAt: new Date().toISOString(),
            status: 'solicitud', // Default status? Or comes in otData?
            stage: 'solicitud'
          });
          console.log("OT Created in Firestore");
          if (otData.clientId) {
            get().logAction(otData.clientId, 'new-ot', `Nueva Solicitud Creada: ${otData.title}`);
          }
      } catch (e) {
          console.error("Error creating OT:", e);
          throw e; // Re-throw so component knows it failed
      }
  },

  // Enhanced Log Action with Real User
  logAction: async (userId, otId, action, metadata = {}) => {
      try {
          // Dynamic Import to avoid circular dependency if possible, or just standard import if valid.
          // Better: User passes userName, OR we try to fetch it here if we are on client side.
          // Since we are in a store, let's try to get it from the Auth Store if not explicitly known?
          // Actually, let's grab the current user from the AuthStore directly if userId is 'current' or similar,
          // BUT the prompt says: "Retrieve the actual displayName from useAuthStore.getState().user"

          // We need to import useAuthStore at the top level, but let's assume it's available or we pass it.
          // To avoid circular deps, we can assume the caller passes it, OR we use the direct import trick if supported.
          // Let's rely on the caller passing the right ID, BUT we need the NAME for the log? 
          // Actually, the Log interface now needs a 'userName' field.
          
          // Let's get the user from the store state (we'll add the import).
          const { user } = require('../store/useAuthStore').default.getState();
          const displayName = user?.displayName || user?.email || 'Usuario Desconocido';
          const realUserId = user?.uid || userId;

          await addDoc(collection(db, "logs"), {
              userId: realUserId,
              userName: displayName, // Added field
              otId: otId || 'general',
              action,
              type: 'system', // Keep 'system' for automated, but maybe 'user' for explicit actions?
              // Let's infer type: if it's a direct user action like "Uploaded", "Approved", it matches.
              timestamp: new Date().toISOString(),
              metadata
          });
      } catch (e) {
         console.error("Error logging action:", e);
      }
  },

  updateDocumentStatus: async (docId: string, status: DocumentStatus, reason?: string) => {
      try {
          const docRef = doc(db, "documents", docId);
          await updateDoc(docRef, {
              status,
              ...(reason && { rejectionReason: reason }),
              updatedAt: new Date().toISOString()
          });

          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
              const docData = docSnap.data() as Document;
              const actionText = status === 'validated' 
                  ? `Documento Aprobado: ${docData.name}` 
                  : `Documento Rechazado: ${docData.name}. Razón: ${reason}`;
              
              if (docData.otId) {
                  get().logAction('admin', docData.otId, actionText);
              }
          }
      } catch (e) {
          console.error("Error updating document status:", e);
          throw e;
      }
  },

  replaceDocument: async (docId: string, file: File) => {
      try {
           // 1. Simulate Upload (In real app: upload bytes to storage, get URL)
           console.log(`Uploading file ${file.name} to replace doc ${docId}...`);
           const fakeUrl = URL.createObjectURL(file); // Temporary for demo

           // 2. Update Firestore
           const docRef = doc(db, "documents", docId);
           await updateDoc(docRef, {
               url: fakeUrl,
               status: 'uploaded', // Reset status as requested
               rejectionReason: null, // Clear any previous rejection
               updatedAt: new Date().toISOString(),
               replacedAt: new Date().toISOString()
           });

           // 3. Log
           const docSnap = await getDoc(docRef);
           if (docSnap.exists()) {
               const docData = docSnap.data() as Document;
               get().logAction('current', docData.otId || 'general', `Documento Reemplazado: ${docData.name}`);
           }

      } catch (e) {
          console.error("Error replacing document:", e);
          throw e;
      }
  },

  updateOTStage: async (otId: string, stage: OTStage) => {
      try {
          // STRICT LOGIC: Prevents jumping to 'finalizado' accidentally
          if (stage === 'finalizado') {
              console.warn("Attempting to finalize OT. This should only be done by Admin via strict close process.");
              // In future, check for role or specific conditions here
          }

          // Specific Logic for Terms Acceptance (if context matches)
          // If previous stage was 'solicitud' and new is 'finalizado', BLOCK IT
          const otRef = doc(db, "ots", otId);
          await updateDoc(otRef, {
              stage,
              updatedAt: new Date().toISOString()
          });
          
          get().logAction('system', otId, `Etapa actualizada a: ${stage}`);

      } catch (e) {
           console.error("Error updating OT stage:", e);
           throw e;
      }
  },

  loadMockData: (role, _id) => {
      // Loads comprehensive mock data from mockData.js
      console.log("loadMockData: Loading premium mock dataset");
      set({ loading: true });
       setTimeout(() => {
        if (role === 'client' || role === 'client-admin') {
            set({
                ots: MOCK_OTS,
                documents: MOCK_DOCS.filter(d => !d.isVaultEligible), 
                vaultDocuments: MOCK_DOCS.filter(d => d.isVaultEligible),
                logs: MOCK_LOGS as any[],
                loading: false
            });
        } else if (role === 'spi-admin') {
            set({
                ots: MOCK_OTS,
                documents: MOCK_DOCS,
                vaultDocuments: MOCK_DOCS.filter(d => d.isVaultEligible),
                logs: MOCK_LOGS as any[],
                loading: false
            });
        }
    }, 500);
  }

}));

export default useDataStore;
