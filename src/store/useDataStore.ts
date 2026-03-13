/**
 * Compatibility barrel — re-exports everything from the modular stores.
 * Prefer importing directly from useOTStore, useDocumentStore, or useAdminStore.
 */
export type { OTStage, OT, DocumentStatus, Document, Log, Company } from './types';
export { uploadFile } from '../lib/uploadFile';
export { logAction } from '../lib/logAction';
export { default as useOTStore } from './useOTStore';
export { default as useDocumentStore } from './useDocumentStore';
export { default as useAdminStore } from './useAdminStore';

// Default export — merges all three stores for legacy callers.
import useOTStore from './useOTStore';
import useDocumentStore from './useDocumentStore';
import useAdminStore from './useAdminStore';

function useDataStore() {
  const ot = useOTStore();
  const document = useDocumentStore();
  const admin = useAdminStore();
  return {
    ...ot,
    ...document,
    ...admin,
    // Surface renamed subscriptions under their original names
    subscribeToClientData: ot.subscribeToClientOTs,
    subscribeToCompanyData: ot.subscribeToCompanyOTs,
    subscribeToAllDocuments: document.subscribeToAllVaultDocuments,
  };
}

export default useDataStore;
