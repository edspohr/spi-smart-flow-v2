import { create } from 'zustand';
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { ExchangeRate } from './types';

interface ExchangeRatesState {
  rates: Record<string, ExchangeRate>;
  loading: boolean;
  error: string | null;

  subscribeToRates: () => () => void;
  updateRate: (currency: string, perUSD: number, uid: string) => Promise<void>;
  restoreRateFromApi: (currency: string, perUSD: number) => Promise<void>;
  convertToUSD: (amount: number, currency: string) => number | null;
  convertFromUSD: (amountUSD: number, targetCurrency: string) => number | null;
}

const useExchangeRatesStore = create<ExchangeRatesState>((set, get) => ({
  rates: {},
  loading: false,
  error: null,

  subscribeToRates: () => {
    set({ loading: true, error: null });
    const col = collection(db, 'exchangeRates');
    return onSnapshot(
      col,
      (snap) => {
        const rates: Record<string, ExchangeRate> = {};
        snap.docs.forEach((d) => {
          rates[d.id] = { ...(d.data() as any), currency: d.id } as ExchangeRate;
        });
        set({ rates, loading: false });
      },
      (err) => {
        console.error('Error subscribing to exchange rates:', err);
        set({ loading: false, error: 'Error al cargar las tasas de cambio.' });
      }
    );
  },

  updateRate: async (currency, perUSD, uid) => {
    const ref = doc(db, 'exchangeRates', currency);
    await setDoc(
      ref,
      {
        currency,
        perUSD,
        source: 'manual',
        updatedAt: serverTimestamp(),
        overriddenBy: uid,
        overriddenAt: serverTimestamp(),
      },
      { merge: true }
    );
  },

  restoreRateFromApi: async (currency, perUSD) => {
    const ref = doc(db, 'exchangeRates', currency);
    await setDoc(
      ref,
      {
        currency,
        perUSD,
        source: 'api',
        updatedAt: serverTimestamp(),
        overriddenBy: null,
        overriddenAt: null,
      },
      { merge: true }
    );
  },

  // Conversion formula: amountInUSD = amountInLocalCurrency / perUSD
  convertToUSD: (amount, currency) => {
    const rate = get().rates[currency];
    if (!rate || !rate.perUSD) return null;
    return amount / rate.perUSD;
  },

  convertFromUSD: (amountUSD, targetCurrency) => {
    const rate = get().rates[targetCurrency];
    if (!rate || !rate.perUSD) return null;
    return amountUSD * rate.perUSD;
  },
}));

export default useExchangeRatesStore;
