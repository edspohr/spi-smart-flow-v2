import { create } from 'zustand';

type OTDetailsTab = 'overview' | 'documents' | 'history';

interface OTDetailsTarget {
  otId: string;
  defaultTab?: OTDetailsTab;
  scrollToRequirementId?: string;
}

interface GlobalModalState {
  otDetails: OTDetailsTarget | null;
  openOTDetails: (target: OTDetailsTarget) => void;
  closeOTDetails: () => void;
}

const useGlobalModalStore = create<GlobalModalState>((set) => ({
  otDetails: null,
  openOTDetails: (target) => set({ otDetails: target }),
  closeOTDetails: () => set({ otDetails: null }),
}));

export default useGlobalModalStore;
