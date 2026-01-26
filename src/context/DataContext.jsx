
import { createContext, useContext, useState } from 'react';
import { differenceInDays, addDays } from 'date-fns';
import { INITIAL_USERS, INITIAL_OTS } from '../data/mockData';

const DataContext = createContext();

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
  const createOt = (serviceType, title, description, clientId) => { 
    const newId = `ot-${ots.length + 1}`;
    const newOt = {
      id: newId,
      clientId: clientId || 'client-1', // Default to provided client or fallback

      title,
      description, // Add description
      stage: 'solicitud',
      createdAt: new Date().toISOString(),
      serviceType, // Track service type
      deadline30: addDays(new Date(), 30).toISOString(),
      deadline90: addDays(new Date(), 90).toISOString(),
      paymentStatus: { adelanto: false, cierre: false },
      documents: [
        // Default docs based on generic flow for now
        { id: 'doc-poder', name: "Poder Simple", type: "sign", status: "pending", url: null },
        { id: 'doc-logo', name: "Logo de la Marca", type: "upload", status: "pending", url: null },
        { id: 'doc-desc', name: "Descripción Actividad", type: "text", status: "pending", content: description || "" },
        { id: 'doc-color', name: "Pantones de Colores", type: "text", status: "pending", content: "" },
      ],
      assignedTo: [],
      comments: [],
      history: [
        { id: Date.now(), type: 'system', text: `Solicitud creada: ${title}`, date: new Date().toISOString() }
      ],
    };

    setOts(prev => [newOt, ...prev]);
    return newOt;
  };

  const addComment = (otId, user, text, type = 'comment') => {
    setOts(prev => prev.map(ot => {
      if (ot.id === otId) {
        const newEntry = { 
          id: Date.now(), 
          user: type === 'system' ? { name: 'Sistema' } : user, 
          text, 
          date: new Date().toISOString(),
          type 
        };
        // Merge comments into history for unified view if needed, or keep separate. 
        // For "Bitácora", we likely want a unified feed.
        // Let's use 'history' as the master record for now.
        return {
          ...ot,
          history: [newEntry, ...(ot.history || [])],
          comments: [...(ot.comments || []), newEntry] 
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
        
        const docName = ot.documents.find(d => d.id === docId)?.name || 'Documento';
        const historyEntry = {
          id: Date.now(),
          type: 'system',
          text: `Documento actualizado: ${docName} -> ${status}`,
          date: new Date().toISOString()
        };

        return { 
          ...ot, 
          documents: newDocs,
          history: [historyEntry, ...(ot.history || [])]
        };
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

      const historyEntry = {
        id: Date.now(),
        type: 'system',
        text: `Avance de etapa: ${ot.stage} -> ${nextStage}`,
        date: new Date().toISOString()
      };

      return { 
        ...ot, 
        stage: nextStage,
        history: [historyEntry, ...(ot.history || [])]
      };
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

      const historyEntry = {
        id: Date.now(),
        type: 'system',
        text: `Pago confirmado: ${type}. Nueva etapa: ${nextStage}`,
        date: new Date().toISOString()
      };

      return { 
        ...ot, 
        paymentStatus: newPayment,
        stage: nextStage,
        history: [historyEntry, ...(ot.history || [])]
      };
    }));
  };

  const assignUser = (otId, userId) => {
    setOts(prev => prev.map(ot => {
      if (ot.id === otId) {
        const currentAssigned = ot.assignedTo || [];
        const isRemoving = currentAssigned.includes(userId);
        const newAssigned = isRemoving
          ? currentAssigned.filter(id => id !== userId)
          : [...currentAssigned, userId];
        
        const historyEntry = {
          id: Date.now(),
          type: 'system',
          text: `Usuario ${isRemoving ? 'removido' : 'asignado'}: ${userId}`, // In real app use name lookup
          date: new Date().toISOString()
        };

        return { 
          ...ot, 
          assignedTo: newAssigned,
          history: [historyEntry, ...(ot.history || [])]
        };
      }
      return ot;
    }));
  };

  return (
    <DataContext.Provider value={{ 
      users, 
      ots, 
      getTimeStatus, 
      createOt,
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

// eslint-disable-next-line react-refresh/only-export-components
export const useData = () => useContext(DataContext);
