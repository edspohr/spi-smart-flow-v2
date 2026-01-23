/* eslint-disable react/prop-types */
import { createContext, useContext, useState, useEffect } from 'react';
import { addDays, differenceInDays } from 'date-fns';

const DataContext = createContext();

// Initial Mock Data
const INITIAL_USERS = [
  { id: 'client-1', name: 'Carlos Cliente', email: 'cliente@spi.com', role: 'client', companyId: 'comp-1' },
  { id: 'client-2', name: 'Maria Emprendedora', email: 'maria@startuplab.com', role: 'client', companyId: 'comp-2' },
  { id: 'client-3', name: 'Pedro Corporativo', email: 'pedro@bigcorp.com', role: 'client', companyId: 'comp-3' },
  { id: 'admin-1', name: 'Ana Admin', email: 'admin@empresa.com', role: 'client-admin', companyId: 'comp-1' },
  { id: 'admin-2', name: 'Luisa Manager', email: 'luisa@startuplab.com', role: 'client-admin', companyId: 'comp-2' },
  { id: 'spi-1', name: 'Super SPI', email: 'team@spi.com', role: 'spi-admin' },
  { id: 'spi-2', name: 'Javier Abogado', email: 'legal@spi.com', role: 'spi-admin' },
];

const INITIAL_DOCS = [
  { id: 'doc-poder', name: 'Poder Simple', type: 'sign', status: 'pending', url: null },
  { id: 'doc-logo', name: 'Logo de la Marca', type: 'upload', status: 'pending', url: null },
  { id: 'doc-desc', name: 'Descripción Actividad', type: 'text', status: 'pending', content: '' },
  { id: 'doc-color', name: 'Pantones de Colores', type: 'text', status: 'pending', content: '' },
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
      adelanto: ['gestion', 'pago_cierre', 'finalizado'].includes(stage), 
      cierre: ['finalizado'].includes(stage) 
    },
    documents: JSON.parse(JSON.stringify(INITIAL_DOCS)).map(d => ({
      ...d, 
      status: ['pago_cierre', 'finalizado'].includes(stage) ? 'approved' : 'pending'
    })),
    assignedTo: [],
    comments: [],
    history: [],
  };
};

const INITIAL_OTS = [
  // Client 1 (Demo)
  generateOt(1, 'client-1', 'Registro de Marca "TechFlow"', 'gestion', 0),
  generateOt(2, 'client-1', 'Registro de Patente "AI Core"', 'pago_cierre', -25),
  generateOt(3, 'client-1', 'Oposición Marca "FlowTech"', 'solicitud', -2),
  
  // Client 2
  generateOt(4, 'client-2', 'Marca "EcoEat"', 'finalizado', -100),
  generateOt(5, 'client-2', 'Slogan "Eat Fresh"', 'pago_adelanto', -5),
  generateOt(6, 'client-2', 'Diseño Industrial botella', 'gestion', -45), // Late!

  // Client 3
  generateOt(7, 'client-3', 'Fusion Corp Brand', 'solicitud', -1),
  generateOt(8, 'client-3', 'Copyright Software V1', 'pago_cierre', -20),
  generateOt(9, 'client-3', 'Registro Dominio Global', 'gestion', -15),
  generateOt(10, 'client-3', 'Patente Mecanismo X', 'finalizado', -120),
];

export const DataProvider = ({ children }) => {
  const [users] = useState(INITIAL_USERS);
  const [ots, setOts] = useState(INITIAL_OTS);

  // Helper to calculate days remaining/overdue
  const getTimeStatus = (ot) => {
    const now = new Date();
    const start = new Date(ot.createdAt);
    const daysElapsed = differenceInDays(now, start);
    
    let label = '';
    let discount = 0;
    let surcharge = 0;

    if (daysElapsed <= 30) {
      label = `${30 - daysElapsed} días para descuento`;
      discount = 10;
    } else if (daysElapsed > 90) {
      label = `Recargo aplicado (+90 días)`;
      surcharge = 10;
    } else {
      label = 'Tarifa estándar';
    }

    return { label, discount, surcharge, daysElapsed };
  };

  // Actions
  const addComment = (otId, user, text) => {
    setOts(prev => prev.map(ot => {
      if (ot.id === otId) {
        return {
          ...ot,
          comments: [...ot.comments, { id: Date.now(), user, text, date: new Date().toISOString() }]
        };
      }
      return ot;
    }));
  };

  const updateDocumentStatus = (otId, docId, status, content = null) => {
    setOts(prev => prev.map(ot => {
      if (ot.id === otId) {
        const newDocs = ot.documents.map(d => 
          d.id === docId ? { ...d, status, ...(content && { content }) } : d
        );

        // Check overall OT stage progression logic here? 
        // Or keep it separate. Let's start with just doc update.
        // If all docs are approved/pre-approved, we can theoretically move to validation? 
        // Current requirement: "Client fills doc -> AI Pre-approves -> SPI Confirms".
        
        return { ...ot, documents: newDocs };
      }
      return ot;
    }));
  };

  const advanceStage = (otId) => {
    setOts(prev => prev.map(ot => {
      if (ot.id !== otId) return ot;
      
      let nextStage = ot.stage;
      if (ot.stage === 'solicitud') nextStage = 'pago_adelanto';
      else if (ot.stage === 'pago_adelanto') nextStage = 'gestion';
      else if (ot.stage === 'gestion') nextStage = 'pago_cierre';
      else if (ot.stage === 'pago_cierre') nextStage = 'finalizado';

      return { ...ot, stage: nextStage };
    }));
  };

  const confirmPayment = (otId, type) => {
    setOts(prev => prev.map(ot => {
      if(ot.id !== otId) return ot;
      const newPayment = { ...ot.paymentStatus, [type]: true };
      
      // Auto-advance logic on payment
      let nextStage = ot.stage;
      if (type === 'adelanto' && ot.stage === 'pago_adelanto') nextStage = 'gestion';
      if (type === 'cierre' && ot.stage === 'pago_cierre') nextStage = 'finalizado';

      return { 
        ...ot, 
        paymentStatus: newPayment,
        stage: nextStage
      };
    }));
  };

  const assignUser = (otId, userId) => {
    setOts(prev => prev.map(ot => {
      if (ot.id === otId) {
        // Toggle assignment or just set one? Assuming single responsible for now or list.
        // Let's assume list of IDs.
        const currentAssigned = ot.assignedTo || [];
        const newAssigned = currentAssigned.includes(userId) 
          ? currentAssigned.filter(id => id !== userId)
          : [...currentAssigned, userId];
        
        return { ...ot, assignedTo: newAssigned };
      }
      return ot;
    }));
  };

  return (
    <DataContext.Provider value={{ 
      users, 
      ots, 
      getTimeStatus, 
      addComment, 
      updateDocumentStatus,
      advanceStage,
      confirmPayment,
      assignUser
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
