import { create } from 'zustand';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc } from 'firebase/firestore';

// --- Types ---
export type OTStage = 'solicitud' | 'pago_adelanto' | 'gestion' | 'pago_cierre' | 'finalizado';
export type DocumentStatus = 'pending' | 'uploaded' | 'validated' | 'rejected';

export interface OT {
  id: string;
  companyId: string;
  clientId: string;
  title: string;
  serviceType: string;
  stage: OTStage;
  amount: number;
  discountPercentage?: number;
  createdAt: string; // ISO String
  deadline: string; // ISO String
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
  action: string;
  type: 'system' | 'user';
  timestamp: string;
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
  
  // Vault Logic
  checkVaultForReuse: (documentType: string) => Document | undefined;
  addToVault: (doc: Document) => void; 
  createOT: (otData: Partial<OT>) => Promise<void>;
  logAction: (userId: string, otId: string, action: string) => Promise<void>; 

  // Mock Data Generators for Dev
  loadMockData: (role: 'client' | 'client-admin' | 'spi-admin', id: string) => void;
}

const MOCK_OTS: OT[] = [
  {
    id: 'ot-101',
    companyId: 'demo-company-1',
    clientId: 'mock-client-123',
    title: 'Registro de Marca "SuperTech"',
    serviceType: 'Propiedad Intelectual',
    stage: 'gestion',
    amount: 1500,
    discountPercentage: 0,
    createdAt: new Date().toISOString(),
    deadline: new Date(Date.now() + 86400000 * 5).toISOString(), // 5 days from now
  },
  {
    id: 'ot-102',
    companyId: 'demo-company-1',
    clientId: 'mock-client-123',
    title: 'Renovación Sanitaria',
    serviceType: 'Asuntos Regulatorios',
    stage: 'solicitud',
    amount: 800,
    createdAt: new Date().toISOString(),
    deadline: new Date(Date.now() + 86400000 * 10).toISOString(),
  }
];

const MOCK_DOCS: Document[] = [
  {
    id: 'doc-vault-1',
    clientId: 'mock-client-123',
    name: 'Poder Legal General',
    type: 'poder_legal',
    status: 'validated',
    isVaultEligible: true,
    validUntil: '2028-01-01T00:00:00Z',
    url: '#'
  },
   {
    id: 'doc-req-1',
    otId: 'ot-101',
    clientId: 'mock-client-123',
    name: 'Cédula de Identidad',
    type: 'cedula',
    status: 'pending',
    isVaultEligible: false,
    url: ''
  }
];

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

  logAction: async (userId, otId, action) => {
      try {
          await addDoc(collection(db, "logs"), {
              userId, // In a real scenario, this should be the actor's ID
              otId: otId || 'general',
              action,
              type: 'user',
              timestamp: new Date().toISOString()
          });
      } catch (e) {
         console.error("Error logging action:", e);
      }
  },

  loadMockData: (role, _id) => {
      // Kept for fallback, but main logic is now in subscribe functions
      console.warn("loadMockData called - prefer using subscribeToClientData/CompanyData");
      set({ loading: true });
       setTimeout(() => {
        if (role === 'client' || role === 'client-admin') {
            set({
                ots: MOCK_OTS,
                documents: MOCK_DOCS.filter(d => !d.isVaultEligible), 
                vaultDocuments: MOCK_DOCS.filter(d => d.isVaultEligible),
                loading: false
            });
        }
    }, 500);
  }

}));

export default useDataStore;
