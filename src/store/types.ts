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
  companyId?: string;
  name: string;
  type: string;
  status: DocumentStatus;
  validationMetadata?: any;
  isVaultEligible: boolean;
  validUntil?: string;
  url?: string;
  uploadedAt: string;
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

export interface Company {
  id: string;
  name: string;
  industry?: string;
  taxId?: string;
  address?: string;
  contactName?: string;
  contactEmail?: string;
  createdAt: string;
}
