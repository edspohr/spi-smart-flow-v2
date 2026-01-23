/* eslint-disable react/prop-types */
import { createContext, useContext, useState } from 'react';
import { differenceInDays } from 'date-fns';
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
