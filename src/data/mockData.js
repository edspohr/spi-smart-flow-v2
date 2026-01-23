import { addDays } from "date-fns";

export const INITIAL_USERS = [
  {
    id: "client-1",
    name: "Carlos Cliente",
    email: "cliente@spi.com",
    role: "client",
    companyId: "comp-1",
  },
  {
    id: "client-2",
    name: "Maria Emprendedora",
    email: "maria@startuplab.com",
    role: "client",
    companyId: "comp-2",
  },
  {
    id: "client-3",
    name: "Pedro Corporativo",
    email: "pedro@bigcorp.com",
    role: "client",
    companyId: "comp-3",
  },
  {
    id: "admin-1",
    name: "Ana Admin",
    email: "admin@empresa.com",
    role: "client-admin",
    companyId: "comp-1",
  },
  {
    id: "admin-2",
    name: "Luisa Manager",
    email: "luisa@startuplab.com",
    role: "client-admin",
    companyId: "comp-2",
  },
  { id: "spi-1", name: "Super SPI", email: "team@spi.com", role: "spi-admin" },
  {
    id: "spi-2",
    name: "Javier Abogado",
    email: "legal@spi.com",
    role: "spi-admin",
  },
];

export const INITIAL_DOCS = [
  {
    id: "doc-poder",
    name: "Poder Simple",
    type: "sign",
    status: "pending",
    url: null,
  },
  {
    id: "doc-logo",
    name: "Logo de la Marca",
    type: "upload",
    status: "pending",
    url: null,
  },
  {
    id: "doc-desc",
    name: "Descripción Actividad",
    type: "text",
    status: "pending",
    content: "",
  },
  {
    id: "doc-color",
    name: "Pantones de Colores",
    type: "text",
    status: "pending",
    content: "",
  },
];

const generateOt = (id, clientId, title, stage, daysOffset) => {
  const createdAt = addDays(new Date(), daysOffset).toISOString();
  // Simple logic to mock deadlines based on creation
  return {
    id: `ot-${id}`,
    clientId,
    title,
    stage,
    createdAt,
    deadline30: addDays(new Date(createdAt), 30).toISOString(),
    deadline90: addDays(new Date(createdAt), 90).toISOString(),
    paymentStatus: {
      adelanto: ["gestion", "pago_cierre", "finalizado"].includes(stage),
      cierre: ["finalizado"].includes(stage),
    },
    documents: JSON.parse(JSON.stringify(INITIAL_DOCS)).map((d) => ({
      ...d,
      status: ["pago_cierre", "finalizado"].includes(stage)
        ? "approved"
        : "pending",
    })),
    assignedTo: [],
    comments: [],
    history: [],
  };
};

export const INITIAL_OTS = [
  // Client 1 (Demo)
  generateOt(1, "client-1", 'Registro de Marca "TechFlow"', "gestion", 0),
  generateOt(
    2,
    "client-1",
    'Registro de Patente "AI Core"',
    "pago_cierre",
    -25,
  ),
  generateOt(3, "client-1", 'Oposición Marca "FlowTech"', "solicitud", -2),

  // Client 2
  generateOt(4, "client-2", 'Marca "EcoEat"', "finalizado", -100),
  generateOt(5, "client-2", 'Slogan "Eat Fresh"', "pago_adelanto", -5),
  generateOt(6, "client-2", "Diseño Industrial botella", "gestion", -45), // Late!

  // Client 3
  generateOt(7, "client-3", "Fusion Corp Brand", "solicitud", -1),
  generateOt(8, "client-3", "Copyright Software V1", "pago_cierre", -20),
  generateOt(9, "client-3", "Registro Dominio Global", "gestion", -15),
  generateOt(10, "client-3", "Patente Mecanismo X", "finalizado", -120),
];
