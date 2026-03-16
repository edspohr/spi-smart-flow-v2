export type OTStage =
  | 'solicitud'
  | 'pago_adelanto'
  | 'gestion'
  | 'pago_cierre'
  | 'finalizado';

export type DocumentStatus = 'pending' | 'uploaded' | 'validated' | 'rejected' | 
  'validating_ai' | 'ocr_processed' | 'awaiting_signature' | 'vault_matched';

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
  updatedAt?: string;
  deadline: string;
  status?: string;
  brandName?: string;
  description?: string;
  colors?: string[];
  pantone?: string;
  logoUrl?: string;
  signatureUrl?: string;
  pipefyCardId?: string;
  source?: 'pipefy' | 'manual';
  internalNotes?: string;
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

export interface DocumentVersion {
  id: string;
  url: string;
  status: DocumentStatus;
  replacedAt: string;
  replacedBy: string;  // userId
  uploadedAt?: string;
}

export type UserRole = 'spi-admin' | 'client' | 'guest';

export interface AppUser {
  id: string;
  email: string;
  displayName?: string;
  role: UserRole;
  companyId?: string;
  disabled?: boolean;
  createdAt?: string;
}

export type PIDocumentType =
  | 'poder_legal' 
  | 'cedula' 
  | 'logo' 
  | 'certificado_constitucion' 
  | 'unknown';
