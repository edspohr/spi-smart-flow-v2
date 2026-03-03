import { create } from 'zustand';
import { db, storage } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, orderBy, doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
  createdAt: string;
  deadline: string;
  status?: string;
  // PI-specific fields
  brandName?: string;
  description?: string;
  colors?: string[];
  logoUrl?: string;
  signatureUrl?: string;
}

export interface Document {
  id: string;
  otId?: string;
  clientId: string;
  name: string;
  type: string;
  status: DocumentStatus;
  validationMetadata?: any;
  isVaultEligible: boolean;
  validUntil?: string;
  url?: string;
}

export interface Log {
  id: string;
  otId: string;
  userId: string;
  userName?: string;
  action: string;
  type: 'system' | 'user';
  timestamp: string;
  metadata?: {
      docId?: string;
      [key: string]: any;
  };
}

// --- Upload Helper ---
export async function uploadFile(file: File | Blob, storagePath: string): Promise<string> {
  const storageRef = ref(storage, storagePath);
  const snapshot = await uploadBytes(storageRef, file);
  const url = await getDownloadURL(snapshot.ref);
  return url;
}

interface DataState {
  ots: OT[];
  documents: Document[];
  logs: Log[];
  loading: boolean;
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
  updateOTStage: (otId: string, stage: OTStage) => Promise<void>;
}

const useDataStore = create<DataState>((set, get) => ({
  ots: [],
  documents: [],
  logs: [],
  vaultDocuments: [],
  loading: false,

  subscribeToCompanyData: (companyId) => {
    console.log(`Subscribing to data for company: ${companyId}`);
    
    const qOTs = query(collection(db, "ots"), where("companyId", "==", companyId));
    const unsubscribeOTs = onSnapshot(qOTs, (snapshot) => {
        const ots: OT[] = [];
        snapshot.forEach((doc) => {
            ots.push({ id: doc.id, ...doc.data() } as OT);
        });
        set({ ots });
    });

    const qVault = query(
        collection(db, "documents"), 
        where("companyId", "==", companyId),
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
            stage: 'solicitud'
          });
          console.log("OT Created in Firestore");
          if (otData.clientId) {
            get().logAction(otData.clientId, 'new-ot', `Nueva Solicitud Creada: ${otData.title}`);
          }
      } catch (e) {
          console.error("Error creating OT:", e);
          throw e;
      }
  },

  logAction: async (userId, otId, action, metadata = {}) => {
      try {
          // Get current user info for the log
          const useAuthStore = (await import('../store/useAuthStore')).default;
          const { user } = useAuthStore.getState();
          const displayName = user?.displayName || user?.email || 'Usuario Desconocido';
          const realUserId = user?.uid || userId;

          await addDoc(collection(db, "logs"), {
              userId: realUserId,
              userName: displayName,
              otId: otId || 'general',
              action,
              type: 'system',
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
           console.log(`Uploading file ${file.name} to replace doc ${docId}...`);
           const fileUrl = await uploadFile(file, `documents/${docId}/${file.name}`);

           const docRef = doc(db, "documents", docId);
           await updateDoc(docRef, {
               url: fileUrl,
               status: 'uploaded',
               rejectionReason: null,
               updatedAt: new Date().toISOString(),
               replacedAt: new Date().toISOString()
           });

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
          if (stage === 'finalizado') {
              console.warn("Attempting to finalize OT. This should only be done by Admin via strict close process.");
          }

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

}));

export default useDataStore;
