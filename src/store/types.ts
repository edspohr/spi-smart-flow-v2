export type OTStage =
  | 'solicitud'
  | 'pago_adelanto'
  | 'gestion'
  | 'pago_cierre'
  | 'finalizado';

export type DocumentStatus = 'pending' | 'uploaded' | 'validated' | 'rejected' |
  'validating_ai' | 'ocr_processed' | 'awaiting_signature' | 'vault_matched' |
  'pending_review' | 'approved';

export interface OT {
  id: string;
  companyId: string;
  companyName?: string;
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
  submittedAt?: string;
  brandName?: string;
  description?: string;
  colors?: string[];
  pantone?: string;
  logoUrl?: string;
  signatureUrl?: string;
  pipefyCardId?: string;
  source?: 'pipefy' | 'manual';
  internalNotes?: string;
  procedureTypeId?: string;
  procedureTypeCode?: string;
  procedureTypeName?: string;
  reference?: string;
  createdManually?: boolean;
  assignedToEmail?: string;
  // Pipefy-aligned fields (for future integration)
  contactLanguage?: 'es' | 'en' | 'pt';
  billingCurrency?: 'COP' | 'USD' | 'CLP' | 'MXN' | 'PEN';
  billingCountry?: string;
  projectName?: string;
  procedureCountry?: string;
  basicCharges?: number;
  officialFees?: number;
  paymentTerms?: string;
  discountDeadline?: string;
  fees?: number;
  encargadoEmail?: string;
  assignedToId?: string | null;
  assignedByNombre?: string;
  requirementsProgress?: Record<string, RequirementProgress>;
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
  // Comprobante de pago fields
  paymentType?: 'adelanto' | 'cierre';
  paymentDate?: string;
  receiptNote?: string;
  amount?: number;
  currency?: string;
  rejectionReason?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  // Reinforced POA signature (Ley 527)
  signatureEventId?: string;
  reinforcedSignature?: boolean;
  fileUrl?: string;
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
  name?: string;          // set by seed / registration flow
  displayName?: string;   // set by Firebase Auth / createUser CF
  role: UserRole;
  companyId?: string;
  disabled?: boolean;
  createdAt?: string;
  activatedAt?: string;
  activatedBy?: string;
  lastNotificationReadAt?: string; // ISO timestamp of last bell-open by this user
}

export type PIDocumentType =
  | 'poder_legal'
  | 'cedula'
  | 'logo'
  | 'certificado_constitucion'
  | 'unknown';

export type RequirementType = 'document_upload' | 'digital_signature' | 'form_field' | 'checkbox_confirmation';

export interface RequirementProgress {
  completed?: boolean;
  value?: string;
  signedAt?: string;
  signerName?: string;
  expiresAt?: string;
  documentUrl?: string | null;
}

export interface Requirement {
  id: string;
  label: string;
  type: RequirementType;
  description?: string;
  isRequired: boolean;
  order: number;
  acceptedFormats?: Array<'PDF' | 'JPG' | 'PNG'>;
  validatedByAI?: boolean;
  templateType?: 'poder_simple';
  fieldKey?: string;
  placeholder?: string;
}

export interface ProcedureType {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  powerValidityYears: number;
  requirements: Requirement[];
  createdAt: any;
  updatedAt: any;
}

export type TrackedCurrency = 'USD' | 'CLP' | 'COP' | 'MXN' | 'PEN' | 'BRL' | 'ARS';

// Conversion formula: amountInUSD = amountInLocalCurrency / perUSD
export interface ExchangeRate {
  currency: TrackedCurrency;
  perUSD: number;
  source: 'api' | 'manual';
  updatedAt: any;
  overriddenBy?: string;
  overriddenAt?: any;
}
