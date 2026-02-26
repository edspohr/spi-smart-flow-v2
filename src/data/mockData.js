import { addDays, subDays } from "date-fns";

// ═══════════════════════════════════════════════════════════════════
// SPI Smart Flow — Mock Data (Premium Smoke & Mirrors Prototype)
// Service Types: RM, RMBUSQ, BUSQ, CONTA, PREC, RTAO, RENM, OPORM, AFEC
// ═══════════════════════════════════════════════════════════════════

const now = new Date();

// ── Service Type Catalog ──────────────────────────────────────────
export const SERVICE_TYPES = {
  RM: { code: "RM", label: "Registro de Marca", category: "PI" },
  RMBUSQ: {
    code: "RMBUSQ",
    label: "Registro de Marca + Búsqueda",
    category: "PI",
  },
  BUSQ: { code: "BUSQ", label: "Búsqueda de Antecedentes", category: "PI" },
  CONTA: { code: "CONTA", label: "Contestación", category: "AR" },
  PREC: { code: "PREC", label: "Oposición / Precautoria", category: "AR" },
  RTAO: { code: "RTAO", label: "Recurso ante TAO", category: "AR" },
  RENM: { code: "RENM", label: "Renovación de Marca", category: "PI" },
  OPORM: {
    code: "OPORM",
    label: "Oposición Registro de Marca",
    category: "PI",
  },
  AFEC: { code: "AFEC", label: "Afectaciones", category: "AR" },
  REG_SAN: { code: "REG_SAN", label: "Registro Sanitario", category: "AR" },
};

// ── Companies / Clients ───────────────────────────────────────────
export const COMPANIES = [
  {
    id: "comp-fusion",
    name: "Fusion Corp S.A.",
    rut: "76.123.456-7",
    industry: "Tecnología",
  },
  {
    id: "comp-techflow",
    name: "TechFlow Labs SpA",
    rut: "77.654.321-K",
    industry: "Software",
  },
  {
    id: "comp-startuplab",
    name: "StartupLab SpA",
    rut: "76.987.654-3",
    industry: "Innovación",
  },
  {
    id: "comp-agroverde",
    name: "AgroVerde Ltda.",
    rut: "78.111.222-5",
    industry: "Agroindustria",
  },
  {
    id: "comp-biomed",
    name: "BioMed Health SpA",
    rut: "76.555.888-1",
    industry: "Farmacéutica",
  },
  {
    id: "comp-andean",
    name: "Andean Brands Corp",
    rut: "77.333.444-9",
    industry: "Consumo Masivo",
  },
];

export const INITIAL_USERS = [
  {
    id: "client-1",
    name: "Carlos Fuentes",
    email: "cfuentes@fusioncorp.cl",
    role: "client",
    companyId: "comp-fusion",
  },
  {
    id: "client-2",
    name: "María Valdés",
    email: "mvaldes@techflow.io",
    role: "client",
    companyId: "comp-techflow",
  },
  {
    id: "client-3",
    name: "Pedro Corporativo",
    email: "pedro@startuplab.com",
    role: "client",
    companyId: "comp-startuplab",
  },
  {
    id: "client-4",
    name: "Andrea Lagos",
    email: "alagos@agroverde.cl",
    role: "client",
    companyId: "comp-agroverde",
  },
  {
    id: "client-5",
    name: "Tomás Medina",
    email: "tmedina@biomedhealth.cl",
    role: "client",
    companyId: "comp-biomed",
  },
  {
    id: "client-6",
    name: "Sofía Riquelme",
    email: "sriquelme@andeanbrands.com",
    role: "client",
    companyId: "comp-andean",
  },
  {
    id: "admin-1",
    name: "Ana Admin",
    email: "admin@empresa.com",
    role: "client-admin",
    companyId: "comp-fusion",
  },
  {
    id: "admin-2",
    name: "Luisa Manager",
    email: "luisa@startuplab.com",
    role: "client-admin",
    companyId: "comp-startuplab",
  },
  { id: "spi-1", name: "Super SPI", email: "team@spi.com", role: "spi-admin" },
  {
    id: "spi-2",
    name: "Javier Abogado",
    email: "legal@spi.com",
    role: "spi-admin",
  },
];

// ── Document Templates per Service ────────────────────────────────
const DOC_TEMPLATES = {
  RM: [
    { type: "poder_legal", name: "Poder Simple", docType: "sign" },
    {
      type: "logo_marca",
      name: "Logo de la Marca",
      docType: "upload",
      description:
        "Formato JPG/PNG, 300 DPI mínimo. Incluir metadata Pantone (ej: PMS 286C) y equivalencia RGB (#0033A0).",
    },
    {
      type: "descripcion_actividad",
      name: "Descripción de Actividad Económica",
      docType: "text",
    },
    {
      type: "cedula_identidad",
      name: "Cédula de Identidad del Solicitante",
      docType: "upload",
    },
  ],
  RMBUSQ: [
    { type: "poder_legal", name: "Poder Simple", docType: "sign" },
    {
      type: "logo_marca",
      name: "Logo de la Marca",
      docType: "upload",
      description: "Formato JPG/PNG, 300 DPI. Pantone PMS 286C / RGB #0033A0.",
    },
    {
      type: "informe_busqueda",
      name: "Informe de Búsqueda Fonética",
      docType: "upload",
    },
    {
      type: "cedula_identidad",
      name: "Cédula de Identidad",
      docType: "upload",
    },
    {
      type: "descripcion_actividad",
      name: "Descripción de Actividad",
      docType: "text",
    },
  ],
  BUSQ: [
    {
      type: "solicitud_busqueda",
      name: "Solicitud de Búsqueda",
      docType: "text",
    },
    { type: "denominacion", name: "Denominación a buscar", docType: "text" },
  ],
  CONTA: [
    { type: "poder_legal", name: "Poder Legal", docType: "sign" },
    {
      type: "copia_acto",
      name: "Copia Acto Administrativo",
      docType: "upload",
    },
    {
      type: "plantilla_firma",
      name: "Plantilla Firma Digital",
      docType: "sign",
      description: "Estado: Pendiente firma electrónica avanzada.",
    },
    { type: "respuesta_fundada", name: "Respuesta Fundada", docType: "text" },
  ],
  PREC: [
    { type: "poder_legal", name: "Poder Legal", docType: "sign" },
    {
      type: "copia_acto",
      name: "Copia Acto Administrativo",
      docType: "upload",
    },
    {
      type: "antecedentes_oposicion",
      name: "Antecedentes de Oposición",
      docType: "upload",
    },
  ],
  RTAO: [
    { type: "poder_legal", name: "Poder Legal Especial", docType: "sign" },
    {
      type: "resolucion_impugnada",
      name: "Resolución Impugnada",
      docType: "upload",
    },
    {
      type: "fundamentos_recurso",
      name: "Fundamentos del Recurso",
      docType: "text",
    },
    { type: "prueba_documental", name: "Prueba Documental", docType: "upload" },
  ],
  RENM: [
    { type: "poder_legal", name: "Poder Simple", docType: "sign" },
    {
      type: "certificado_vigente",
      name: "Certificado de Marca Vigente",
      docType: "upload",
    },
    {
      type: "comprobante_pago",
      name: "Comprobante de Pago Renovación",
      docType: "upload",
    },
  ],
  OPORM: [
    { type: "poder_legal", name: "Poder Legal", docType: "sign" },
    {
      type: "publicacion_diario",
      name: "Publicación en Diario Oficial",
      docType: "upload",
    },
    {
      type: "fundamentos_oposicion",
      name: "Fundamentos de la Oposición",
      docType: "text",
    },
    { type: "prueba_uso", name: "Prueba de Uso de Marca", docType: "upload" },
  ],
  AFEC: [
    {
      type: "documento_cesion",
      name: "Documento de Cesión",
      docType: "upload",
      description:
        "Acta notarial de cesión de derechos de propiedad industrial.",
    },
    {
      type: "descripcion_afectacion",
      name: "Descripción de la Afectación",
      docType: "text",
      description:
        "Detalle del tipo de afectación: cesión total, parcial, licencia, etc.",
    },
    { type: "poder_legal", name: "Poder Legal", docType: "sign" },
    {
      type: "certificado_marca",
      name: "Certificado de Marca Afectada",
      docType: "upload",
    },
  ],
  REG_SAN: [
    { type: "poder_legal", name: "Poder Legal Especial", docType: "sign" },
    {
      type: "form_minsal",
      name: "Formulario MINSAL Oficial",
      docType: "upload",
    },
    {
      type: "clv",
      name: "Certificado de Libre Venta (Apostillado)",
      docType: "upload",
    },
    { type: "formula", name: "Fórmula Cualicuantitativa", docType: "upload" },
    {
      type: "specs",
      name: "Especificaciones Técnicas Físico-Químicas",
      docType: "text",
    },
    {
      type: "rotulo",
      name: "Bocetos de Rótulos y Empaques",
      docType: "upload",
      description: "Formatos comerciales según norma técnica 2024",
    },
    {
      type: "estabilidad",
      name: "Ensayo de Estabilidad Acelerada",
      docType: "upload",
    },
    {
      type: "gmp",
      name: "Certificado de Buenas Prácticas (GMP)",
      docType: "upload",
      description: "Emitido por autoridad sanitaria de origen",
    },
  ],
};

// ── Document State Pool ───────────────────────────────────────────
// States: pending, validating_ai, ocr_processed, awaiting_signature, validated, vault_matched, uploaded, rejected
const RICH_STATES = {
  solicitud: ["pending", "validating_ai", "pending"],
  pago_adelanto: ["pending", "ocr_processed", "awaiting_signature"],
  gestion: [
    "validated",
    "ocr_processed",
    "awaiting_signature",
    "validating_ai",
  ],
  pago_cierre: [
    "validated",
    "validated",
    "awaiting_signature",
    "ocr_processed",
  ],
  finalizado: ["validated", "validated", "validated", "vault_matched"],
};

// ── History Log Templates ─────────────────────────────────────────
const HISTORY_TEMPLATES = {
  solicitud: [
    {
      action: "Solicitud creada por el cliente",
      type: "system",
      offsetHours: 0,
    },
    {
      action: "AI Match: 98% similitud con antecedentes existentes",
      type: "system",
      offsetHours: 1,
    },
    {
      action: "Asignada a equipo de revisión inicial",
      type: "system",
      offsetHours: 2,
    },
  ],
  pago_adelanto: [
    {
      action: "Solicitud creada por el cliente",
      type: "system",
      offsetHours: 0,
    },
    { action: "Documentos iniciales recibidos", type: "user", offsetHours: 4 },
    {
      action: "Pago de adelanto confirmado vía Webpay",
      type: "system",
      offsetHours: 24,
    },
    {
      action: "Expediente enviado a gestión interna",
      type: "system",
      offsetHours: 26,
    },
  ],
  gestion: [
    {
      action: "Solicitud creada por el cliente",
      type: "system",
      offsetHours: 0,
    },
    { action: "Pago de adelanto confirmado", type: "system", offsetHours: 8 },
    {
      action: "Documento validado por OCR – Cédula",
      type: "system",
      offsetHours: 12,
    },
    {
      action: "Logo analizado: Pantone PMS 286C detectado",
      type: "system",
      offsetHours: 14,
    },
    {
      action: "Enviado a firma digital – Poder Simple",
      type: "system",
      offsetHours: 36,
    },
    {
      action: "Analizando similitud fonética... 98% Match con 'TechFlow'",
      type: "system",
      offsetHours: 48,
    },
    {
      action: "Presentación ingresada ante INAPI",
      type: "user",
      offsetHours: 72,
    },
  ],
  pago_cierre: [
    {
      action: "Solicitud creada por el cliente",
      type: "system",
      offsetHours: 0,
    },
    { action: "Pago de adelanto confirmado", type: "system", offsetHours: 6 },
    { action: "Documento validado por OCR", type: "system", offsetHours: 10 },
    { action: "Firma digital completada", type: "system", offsetHours: 48 },
    {
      action: "Presentación ingresada ante INAPI",
      type: "user",
      offsetHours: 120,
    },
    {
      action: "Resolución favorable recibida",
      type: "system",
      offsetHours: 360,
    },
    {
      action: "Certificado de registro generado",
      type: "system",
      offsetHours: 380,
    },
    {
      action: "Pendiente pago de cierre – Monto: $1.250.000",
      type: "system",
      offsetHours: 400,
    },
  ],
  finalizado: [
    {
      action: "Solicitud creada por el cliente",
      type: "system",
      offsetHours: 0,
    },
    { action: "Pago de adelanto confirmado", type: "system", offsetHours: 4 },
    {
      action: "Documento validado por OCR – todos los documentos",
      type: "system",
      offsetHours: 12,
    },
    { action: "Firma digital completada", type: "system", offsetHours: 36 },
    {
      action: "Presentación ingresada ante INAPI",
      type: "user",
      offsetHours: 96,
    },
    {
      action: "Resolución favorable recibida",
      type: "system",
      offsetHours: 480,
    },
    { action: "Pago de cierre confirmado", type: "system", offsetHours: 500 },
    {
      action: "Certificado de registro entregado al cliente",
      type: "system",
      offsetHours: 520,
    },
    {
      action: "Documentos archivados en Bóveda Smart",
      type: "system",
      offsetHours: 530,
    },
    {
      action: "OT Finalizada – Caso cerrado exitosamente ✓",
      type: "system",
      offsetHours: 540,
    },
  ],
};

// ── Helper: Generate Documents for an OT ──────────────────────────
const generateDocs = (otId, clientId, serviceType, stage) => {
  const templates = DOC_TEMPLATES[serviceType] || DOC_TEMPLATES.RM;
  const statePool = RICH_STATES[stage] || RICH_STATES.solicitud;

  return templates.map((tpl, idx) => {
    const status = statePool[idx % statePool.length];
    const isVault =
      (tpl.type === "poder_legal" || tpl.type === "cedula_identidad") &&
      status === "validated";
    return {
      id: `${otId}-doc-${idx + 1}`,
      otId,
      clientId,
      name: tpl.name,
      type: tpl.type,
      docType: tpl.docType,
      status,
      description: tpl.description || null,
      isVaultEligible: isVault,
      validUntil: isVault ? addDays(now, 365).toISOString() : null,
      url: ["validated", "ocr_processed", "vault_matched", "uploaded"].includes(
        status,
      )
        ? "#mock-url"
        : null,
      validationMetadata:
        status === "validating_ai"
          ? { aiScore: 0.98, model: "spi-doc-validator-v3", analyzing: true }
          : status === "ocr_processed"
            ? {
                ocrEngine: "Tesseract 5.x",
                confidence: 0.96,
                extractedFields: ["RUT", "Nombre", "Fecha"],
              }
            : null,
    };
  });
};

// ── Helper: Generate History Logs ─────────────────────────────────
const generateHistory = (otId, stage, createdAt) => {
  const templates = HISTORY_TEMPLATES[stage] || HISTORY_TEMPLATES.solicitud;
  const baseDate = new Date(createdAt);

  return templates.map((tpl, idx) => ({
    id: `${otId}-log-${idx + 1}`,
    otId,
    userId: tpl.type === "user" ? "spi-2" : "system",
    userName: tpl.type === "user" ? "Javier Abogado" : "Sistema SPI",
    action: tpl.action,
    type: tpl.type,
    timestamp: new Date(
      baseDate.getTime() + tpl.offsetHours * 3600000,
    ).toISOString(),
    metadata: {},
  }));
};

// ── OT Generator ──────────────────────────────────────────────────
const generateOT = ({
  id,
  clientId,
  companyId,
  title,
  serviceType,
  stage,
  daysOffset,
  amount,
  discountPercentage = 0,
}) => {
  const createdAt = subDays(now, Math.abs(daysOffset)).toISOString();
  const deadline = addDays(new Date(createdAt), 90).toISOString();

  return {
    id: `ot-${id}`,
    clientId,
    companyId,
    title,
    serviceType: SERVICE_TYPES[serviceType]?.label || serviceType,
    serviceCode: serviceType,
    area: SERVICE_TYPES[serviceType]?.category || "PI",
    stage,
    amount,
    discountPercentage,
    createdAt,
    deadline,
    status: stage,
    documents: generateDocs(`ot-${id}`, clientId, serviceType, stage),
    history: generateHistory(`ot-${id}`, stage, createdAt),
    paymentStatus: {
      adelanto: ["gestion", "pago_cierre", "finalizado"].includes(stage),
      cierre: ["finalizado"].includes(stage),
    },
    assignedTo: stage === "solicitud" ? [] : ["spi-2"],
    comments: [],
  };
};

// ═══════════════════════════════════════════════════════════════════
// INITIAL_OTS — 18 Mock Orders of Work
// ═══════════════════════════════════════════════════════════════════
export const INITIAL_OTS = [
  // ── Fusion Corp (Big Corporation) ───────────────────────────────
  generateOT({
    id: 1,
    clientId: "client-1",
    companyId: "comp-fusion",
    title: 'Registro de Marca "FusionTech"',
    serviceType: "RM",
    stage: "gestion",
    daysOffset: 15,
    amount: 850000,
  }),
  generateOT({
    id: 2,
    clientId: "client-1",
    companyId: "comp-fusion",
    title: 'Búsqueda + Registro "Fusion AI"',
    serviceType: "RMBUSQ",
    stage: "pago_cierre",
    daysOffset: 45,
    amount: 1250000,
  }),
  generateOT({
    id: 3,
    clientId: "client-1",
    companyId: "comp-fusion",
    title: 'Oposición Marca "FusionTek" (tercero)',
    serviceType: "OPORM",
    stage: "gestion",
    daysOffset: 30,
    amount: 1500000,
  }),
  generateOT({
    id: 4,
    clientId: "client-1",
    companyId: "comp-fusion",
    title: 'Renovación Marca "Fusion Corp"',
    serviceType: "RENM",
    stage: "finalizado",
    daysOffset: 120,
    amount: 450000,
  }),

  // ── TechFlow Labs ───────────────────────────────────────────────
  generateOT({
    id: 5,
    clientId: "client-2",
    companyId: "comp-techflow",
    title: 'Registro de Marca "TechFlow"',
    serviceType: "RM",
    stage: "solicitud",
    daysOffset: 2,
    amount: 750000,
  }),
  generateOT({
    id: 6,
    clientId: "client-2",
    companyId: "comp-techflow",
    title: 'Búsqueda Fonética "FlowTech"',
    serviceType: "BUSQ",
    stage: "gestion",
    daysOffset: 8,
    amount: 180000,
  }),
  generateOT({
    id: 7,
    clientId: "client-2",
    companyId: "comp-techflow",
    title: "Contestación Observación INAPI",
    serviceType: "CONTA",
    stage: "pago_adelanto",
    daysOffset: 5,
    amount: 650000,
  }),

  // ── StartupLab SpA ─────────────────────────────────────────────
  generateOT({
    id: 8,
    clientId: "client-3",
    companyId: "comp-startuplab",
    title: 'Registro "EcoEat" + Búsqueda',
    serviceType: "RMBUSQ",
    stage: "finalizado",
    daysOffset: 100,
    amount: 980000,
  }),
  generateOT({
    id: 9,
    clientId: "client-3",
    companyId: "comp-startuplab",
    title: 'Recurso TAO – Caso "EcoEat"',
    serviceType: "RTAO",
    stage: "gestion",
    daysOffset: 40,
    amount: 2200000,
  }),

  // ── AgroVerde Ltda. ─────────────────────────────────────────────
  generateOT({
    id: 10,
    clientId: "client-4",
    companyId: "comp-agroverde",
    title: 'Registro Marca "GreenHarvest"',
    serviceType: "RM",
    stage: "solicitud",
    daysOffset: 1,
    amount: 750000,
  }),
  generateOT({
    id: 11,
    clientId: "client-4",
    companyId: "comp-agroverde",
    title: 'Precautoria – Uso indebido "AgroVerde"',
    serviceType: "PREC",
    stage: "pago_cierre",
    daysOffset: 60,
    amount: 1800000,
  }),
  generateOT({
    id: 12,
    clientId: "client-4",
    companyId: "comp-agroverde",
    title: 'Afectación – Cesión parcial "Campo Oro"',
    serviceType: "AFEC",
    stage: "gestion",
    daysOffset: 20,
    amount: 950000,
  }),

  // ── BioMed Health SpA ───────────────────────────────────────────
  generateOT({
    id: 13,
    clientId: "client-5",
    companyId: "comp-biomed",
    title: 'Registro "BioVital" Clase 5',
    serviceType: "RM",
    stage: "pago_adelanto",
    daysOffset: 7,
    amount: 850000,
  }),
  generateOT({
    id: 14,
    clientId: "client-5",
    companyId: "comp-biomed",
    title: "Contestación Obs. Sanitaria MINSAL",
    serviceType: "CONTA",
    stage: "gestion",
    daysOffset: 35,
    amount: 1100000,
  }),
  generateOT({
    id: 15,
    clientId: "client-5",
    companyId: "comp-biomed",
    title: 'Renovación "BioMed Health" (logo)',
    serviceType: "RENM",
    stage: "pago_cierre",
    daysOffset: 50,
    amount: 520000,
  }),
  generateOT({
    id: 99,
    clientId: "client-5",
    companyId: "comp-biomed",
    title: 'Registro Sanitario "NeuroVance XR"',
    serviceType: "REG_SAN",
    stage: "gestion",
    daysOffset: 12,
    amount: 4500000,
  }),

  // ── Andean Brands Corp ──────────────────────────────────────────
  generateOT({
    id: 16,
    clientId: "client-6",
    companyId: "comp-andean",
    title: 'Marca "Andean Premium" Clase 30',
    serviceType: "RMBUSQ",
    stage: "solicitud",
    daysOffset: 3,
    amount: 1100000,
  }),
  generateOT({
    id: 17,
    clientId: "client-6",
    companyId: "comp-andean",
    title: 'Oposición "AndeanPremium" por tercero',
    serviceType: "OPORM",
    stage: "finalizado",
    daysOffset: 150,
    amount: 1650000,
  }),
  generateOT({
    id: 18,
    clientId: "client-6",
    companyId: "comp-andean",
    title: 'Afectación – Licencia de uso "Andean"',
    serviceType: "AFEC",
    stage: "solicitud",
    daysOffset: 4,
    amount: 780000,
  }),

  // ── MORE MOCK DATA: PI (Propiedad Intelectual) ──────────────────
  generateOT({
    id: 19,
    clientId: "client-1",
    companyId: "comp-fusion",
    title: 'Registro de Marca "Fusion Pay"',
    serviceType: "RM",
    stage: "pago_adelanto",
    daysOffset: 5,
    amount: 800000,
  }),
  generateOT({
    id: 20,
    clientId: "client-2",
    companyId: "comp-techflow",
    title: 'Renovación "TechFlow Core"',
    serviceType: "RENM",
    stage: "gestion",
    daysOffset: 25,
    amount: 450000,
  }),
  generateOT({
    id: 21,
    clientId: "client-3",
    companyId: "comp-startuplab",
    title: 'Búsqueda "EcoMarket"',
    serviceType: "BUSQ",
    stage: "finalizado",
    daysOffset: 60,
    amount: 150000,
  }),
  generateOT({
    id: 22,
    clientId: "client-4",
    companyId: "comp-agroverde",
    title: 'Oposición "AgroBlue" (Tercero)',
    serviceType: "OPORM",
    stage: "pago_cierre",
    daysOffset: 90,
    amount: 1600000,
  }),
  generateOT({
    id: 23,
    clientId: "client-6",
    companyId: "comp-andean",
    title: 'Registro Marca "Andean Pure"',
    serviceType: "RMBUSQ",
    stage: "gestion",
    daysOffset: 15,
    amount: 1200000,
  }),
  generateOT({
    id: 24,
    clientId: "client-1",
    companyId: "comp-fusion",
    title: 'Renovación "Fusion Data"',
    serviceType: "RENM",
    stage: "solicitud",
    daysOffset: 2,
    amount: 500000,
  }),
  generateOT({
    id: 25,
    clientId: "client-2",
    companyId: "comp-techflow",
    title: 'Oposición "FlowData" (Tercero)',
    serviceType: "OPORM",
    stage: "gestion",
    daysOffset: 35,
    amount: 1800000,
  }),

  // ── MORE MOCK DATA: AR (Asuntos Regulatorios) ───────────────────
  generateOT({
    id: 26,
    clientId: "client-5",
    companyId: "comp-biomed",
    title: 'Registro Sanitario "DermaCare"',
    serviceType: "REG_SAN",
    stage: "pago_adelanto",
    daysOffset: 10,
    amount: 3500000,
  }),
  generateOT({
    id: 27,
    clientId: "client-4",
    companyId: "comp-agroverde",
    title: "Afectación – Traspaso de Derechos",
    serviceType: "AFEC",
    stage: "finalizado",
    daysOffset: 110,
    amount: 850000,
  }),
  generateOT({
    id: 28,
    clientId: "client-5",
    companyId: "comp-biomed",
    title: "Recurso TAO – Rechazo Sanitario",
    serviceType: "RTAO",
    stage: "pago_cierre",
    daysOffset: 65,
    amount: 2500000,
  }),
  generateOT({
    id: 29,
    clientId: "client-6",
    companyId: "comp-andean",
    title: 'Contestación Obs. Cosmético "AndeanGlow"',
    serviceType: "CONTA",
    stage: "gestion",
    daysOffset: 22,
    amount: 950000,
  }),
  generateOT({
    id: 30,
    clientId: "client-4",
    companyId: "comp-agroverde",
    title: "Precautoria – Competencia Desleal",
    serviceType: "PREC",
    stage: "solicitud",
    daysOffset: 1,
    amount: 1400000,
  }),
  generateOT({
    id: 31,
    clientId: "client-5",
    companyId: "comp-biomed",
    title: 'Búsqueda "NutriAdvance"',
    serviceType: "BUSQ",
    stage: "finalizado",
    daysOffset: 80,
    amount: 180000,
  }),
  generateOT({
    id: 32,
    clientId: "client-5",
    companyId: "comp-biomed",
    title: 'Registro Sanitario "NutriAdvance"',
    serviceType: "REG_SAN",
    stage: "gestion",
    daysOffset: 20,
    amount: 4200000,
  }),

  // ── MORE MIXED DATA FOR VOLUME ──────────────────────────────────
  generateOT({
    id: 33,
    clientId: "client-3",
    companyId: "comp-startuplab",
    title: 'Registro Marca "AppGen"',
    serviceType: "RM",
    stage: "gestion",
    daysOffset: 18,
    amount: 750000,
  }),
  generateOT({
    id: 34,
    clientId: "client-1",
    companyId: "comp-fusion",
    title: "Afectación – Licencia Software",
    serviceType: "AFEC",
    stage: "solicitud",
    daysOffset: 3,
    amount: 900000,
  }),
  generateOT({
    id: 35,
    clientId: "client-2",
    companyId: "comp-techflow",
    title: 'Contestación Obs. INAPI "CloudFlow"',
    serviceType: "CONTA",
    stage: "pago_cierre",
    daysOffset: 55,
    amount: 650000,
  }),
  generateOT({
    id: 36,
    clientId: "client-6",
    companyId: "comp-andean",
    title: 'Recurso TAO – "Andean Snacks"',
    serviceType: "RTAO",
    stage: "finalizado",
    daysOffset: 140,
    amount: 1900000,
  }),
];

// ═══════════════════════════════════════════════════════════════════
// INITIAL_DOCS — Flat array of all documents (derived from OTs)
// ═══════════════════════════════════════════════════════════════════
export const INITIAL_DOCS = INITIAL_OTS.flatMap((ot) => ot.documents);

// ═══════════════════════════════════════════════════════════════════
// INITIAL_LOGS — Flat array of all history entries
// ═══════════════════════════════════════════════════════════════════
export const INITIAL_LOGS = INITIAL_OTS.flatMap((ot) => ot.history);

// ═══════════════════════════════════════════════════════════════════
// VAULT_DOCUMENTS — Pre-validated, reusable documents
// ═══════════════════════════════════════════════════════════════════
export const VAULT_DOCUMENTS = [
  {
    id: "vault-poder-1",
    clientId: "client-1",
    name: "Poder Legal General – Fusion Corp",
    type: "poder_legal",
    docType: "sign",
    status: "validated",
    isVaultEligible: true,
    validUntil: addDays(now, 300).toISOString(),
    url: "#vault-mock",
    validationMetadata: {
      validatedBy: "spi-2",
      validatedAt: subDays(now, 60).toISOString(),
    },
  },
  {
    id: "vault-cedula-1",
    clientId: "client-1",
    name: "Cédula de Identidad – Carlos Fuentes",
    type: "cedula_identidad",
    docType: "upload",
    status: "validated",
    isVaultEligible: true,
    validUntil: addDays(now, 730).toISOString(),
    url: "#vault-mock",
    validationMetadata: { ocrEngine: "Tesseract 5.x", confidence: 0.99 },
  },
  {
    id: "vault-poder-2",
    clientId: "client-4",
    name: "Poder Simple – AgroVerde Ltda.",
    type: "poder_legal",
    docType: "sign",
    status: "validated",
    isVaultEligible: true,
    validUntil: addDays(now, 180).toISOString(),
    url: "#vault-mock",
    validationMetadata: {
      validatedBy: "spi-1",
      validatedAt: subDays(now, 90).toISOString(),
    },
  },
  {
    id: "vault-certificado-1",
    clientId: "client-6",
    name: "Certificado Marca 'Andean' – Vigente",
    type: "certificado_vigente",
    docType: "upload",
    status: "validated",
    isVaultEligible: true,
    validUntil: addDays(now, 450).toISOString(),
    url: "#vault-mock",
    validationMetadata: { source: "INAPI", registroNro: "1.234.567" },
  },
];
