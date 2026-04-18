"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerExchangeRateHandlers = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const https_1 = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const firestore_1 = require("firebase-admin/firestore");
const Sentry = require("@sentry/node");
// Conversion formula (consumed client-side):
//   amountInUSD = amountInLocalCurrency / perUSD
// USD itself is stored with perUSD = 1.
const API_URL = 'https://open.er-api.com/v6/latest/USD';
const TRACKED_CURRENCIES = ['USD', 'CLP', 'COP', 'MXN', 'PEN', 'BRL', 'ARS'];
async function fetchRatesFromApi() {
    const res = await fetch(API_URL);
    if (!res.ok) {
        throw new Error(`exchange-rate API responded ${res.status}`);
    }
    const data = (await res.json());
    if (data.result !== 'success' || !data.rates) {
        throw new Error(`exchange-rate API error: ${data['error-type'] || 'unknown'}`);
    }
    return data.rates;
}
async function refreshAll(db) {
    const result = { updated: [], skipped: [], errors: [] };
    let rates;
    try {
        rates = await fetchRatesFromApi();
    }
    catch (err) {
        logger.error('[exchangeRates] Fetch failed', err);
        Sentry.captureException(err);
        result.errors.push(err.message || 'fetch_failed');
        return result;
    }
    for (const currency of TRACKED_CURRENCIES) {
        try {
            const ref = db.collection('exchangeRates').doc(currency);
            const snap = await ref.get();
            if (snap.exists && snap.data().source === 'manual') {
                result.skipped.push(currency);
                continue;
            }
            const perUSD = currency === 'USD' ? 1 : rates[currency];
            if (typeof perUSD !== 'number' || !isFinite(perUSD) || perUSD <= 0) {
                result.errors.push(`${currency}: missing/invalid rate`);
                continue;
            }
            await ref.set({
                currency,
                perUSD,
                source: 'api',
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            }, { merge: true });
            result.updated.push(currency);
        }
        catch (err) {
            logger.error(`[exchangeRates] Upsert failed for ${currency}`, err);
            Sentry.captureException(err, { extra: { currency } });
            result.errors.push(`${currency}: ${err.message}`);
        }
    }
    if (result.updated.length > 0) {
        await db.collection('logs').add({
            otId: 'system',
            userId: 'system',
            action: 'Tasas de cambio actualizadas desde API',
            type: 'system',
            timestamp: new Date().toISOString(),
            metadata: {
                currencies: result.updated,
                skipped: result.skipped,
                source: 'open.er-api.com',
            },
        });
    }
    return result;
}
const registerExchangeRateHandlers = (db) => {
    const refreshExchangeRates = (0, scheduler_1.onSchedule)('every 24 hours', async () => {
        logger.info('[exchangeRates] Scheduled refresh starting...');
        const result = await refreshAll(db);
        logger.info('[exchangeRates] Scheduled refresh complete', result);
    });
    const triggerExchangeRatesRefresh = (0, https_1.onRequest)(async (req, res) => {
        try {
            const result = await refreshAll(db);
            res.status(200).json(result);
        }
        catch (err) {
            logger.error('[exchangeRates] Manual refresh failed', err);
            Sentry.captureException(err);
            res.status(500).json({
                updated: [],
                skipped: [],
                errors: [err.message || 'unknown_error'],
            });
        }
    });
    return { refreshExchangeRates, triggerExchangeRatesRefresh };
};
exports.registerExchangeRateHandlers = registerExchangeRateHandlers;
//# sourceMappingURL=exchangeRates.js.map