/**
 * SPI Smart Flow v2 — Seed Script
 * Populates Firebase with test users, companies, and OTs.
 * Fully idempotent — safe to run multiple times.
 *
 * Usage:
 *   npm run seed
 *
 * Prerequisites:
 *   - Place scripts/serviceAccountKey.json (download from Firebase Console)
 *   - npm install (ts-node and firebase-admin must be in devDependencies)
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serviceAccount = JSON.parse(readFileSync(resolve(__dirname, './serviceAccountKey.json'), 'utf-8'));

// ── Initialize Admin SDK ────────────────────────────────────────────────────

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();
const auth = getAuth();

// ── Helpers ─────────────────────────────────────────────────────────────────

async function findOrCreateAuthUser(
  email: string,
  password: string,
  displayName: string
): Promise<string> {
  try {
    const existing = await auth.getUserByEmail(email);
    return existing.uid;
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      const created = await auth.createUser({ email, password, displayName });
      return created.uid;
    }
    throw err;
  }
}

async function ensureFirestoreUser(
  uid: string,
  data: Record<string, any>
): Promise<void> {
  const ref = db.collection('users').doc(uid);
  const snap = await ref.get();
  if (!snap.exists) {
    await ref.set({ ...data, createdAt: FieldValue.serverTimestamp() });
  }
}

async function findOrCreateCompany(name: string, data: Record<string, any>): Promise<string> {
  const snap = await db.collection('companies').where('name', '==', name).limit(1).get();
  if (!snap.empty) return snap.docs[0].id;
  const ref = await db.collection('companies').add({
    ...data,
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

// ── 3a + 3b: Client users ───────────────────────────────────────────────────

const CLIENT_PASSWORD = 'SpiTest2025!';
const DEMO_PASSWORD = 'Test1234!';

const CLIENT_USERS: Array<{ displayName: string; email: string }> = [
  { displayName: 'Isabel Sanín',        email: 'isanin@spiamericas.com'    },
  { displayName: 'Luisa Parra',         email: 'fparra@spiamericas.com'    },
  { displayName: 'Juan Felipe Quintero',email: 'jquintero@spiamericas.com' },
  { displayName: 'Leidy Marín',         email: 'lmarin@spiamericas.com'    },
  { displayName: 'Eduardo Dorado',      email: 'edorado@spiamericas.com'   },
];

const DEMO_USER = { displayName: 'Cliente Demo', email: 'cliente@test.spi.com' };

// ── 3c: Companies ────────────────────────────────────────────────────────────

const COMPANIES = [
  {
    name: 'Grupo Empresarial Nova S.A.S',
    rut: '900.123.456-7',
    country: 'Colombia',
    city: 'Bogotá',
    source: 'seed',
  },
  {
    name: 'Tech Innovations LATAM',
    rut: '76.543.210-K',
    country: 'Chile',
    city: 'Santiago',
    source: 'seed',
  },
  {
    name: 'Distribuidora Andina Ltda',
    rut: '800.987.654-3',
    country: 'Colombia',
    city: 'Medellín',
    source: 'seed',
  },
];

// email → company name
const USER_COMPANY_MAP: Record<string, string> = {
  'isanin@spiamericas.com':    'Grupo Empresarial Nova S.A.S',
  'fparra@spiamericas.com':    'Grupo Empresarial Nova S.A.S',
  'jquintero@spiamericas.com': 'Tech Innovations LATAM',
  'lmarin@spiamericas.com':    'Tech Innovations LATAM',
  'edorado@spiamericas.com':   'Distribuidora Andina Ltda',
  'cliente@test.spi.com':      'Grupo Empresarial Nova S.A.S',
};

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // ── Step 1: Create / resolve UIDs for all client users ──────────────────

  const uidMap: Record<string, string> = {};

  for (const u of CLIENT_USERS) {
    const uid = await findOrCreateAuthUser(u.email, CLIENT_PASSWORD, u.displayName);
    uidMap[u.email] = uid;
    await ensureFirestoreUser(uid, {
      name: u.displayName,
      email: u.email,
      role: 'client',
      companyId: null,
      source: 'seed',
    });
  }

  // Demo user
  const demoUid = await findOrCreateAuthUser(DEMO_USER.email, DEMO_PASSWORD, DEMO_USER.displayName);
  uidMap[DEMO_USER.email] = demoUid;
  await ensureFirestoreUser(demoUid, {
    name: DEMO_USER.displayName,
    email: DEMO_USER.email,
    role: 'client',
    companyId: null,
    source: 'seed',
  });

  // ── Step 2: Create companies ─────────────────────────────────────────────

  const companyIds: Record<string, string> = {};
  for (const c of COMPANIES) {
    const id = await findOrCreateCompany(c.name, c);
    companyIds[c.name] = id;
  }

  const novaId  = companyIds['Grupo Empresarial Nova S.A.S'];
  const techId  = companyIds['Tech Innovations LATAM'];
  const andinaId = companyIds['Distribuidora Andina Ltda'];

  // ── Step 3: Assign users to companies ───────────────────────────────────

  for (const [email, companyName] of Object.entries(USER_COMPANY_MAP)) {
    const uid = uidMap[email];
    const companyId = companyIds[companyName];
    if (uid && companyId) {
      await db.collection('users').doc(uid).update({ companyId });
    }
  }

  // ── Step 4: Create OTs if fewer than 7 seed OTs exist ───────────────────

  const existingOTs = await db.collection('ots').where('source', '==', 'seed').get();

  if (existingOTs.size < 7) {
    const now = new Date();
    const fiveYears = new Date(now.getTime() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString();

    const OTS = [
      // OT 1 — Nova, solicitud
      {
        companyId: novaId,
        companyName: 'Grupo Empresarial Nova S.A.S',
        reference: 'SEED-001',
        stage: 'solicitud',
        procedureTypeCode: 'RM',
        procedureTypeName: 'Solicitud de Registro de Marca',
        assignedToEmail: 'isanin@spiamericas.com',
        internalNotes: 'OT de prueba — sin documentos, flujo inicial',
        source: 'seed',
        createdManually: true,
        documents: [],
        requirementsProgress: {},
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      // OT 2 — Nova, gestion
      {
        companyId: novaId,
        companyName: 'Grupo Empresarial Nova S.A.S',
        reference: 'SEED-002',
        stage: 'gestion',
        procedureTypeCode: 'BUSQ',
        procedureTypeName: 'Búsqueda de Antecedentes',
        assignedToEmail: 'fparra@spiamericas.com',
        internalNotes: 'Búsqueda en curso — denominación registrada, falta país',
        source: 'seed',
        createdManually: true,
        documents: [],
        requirementsProgress: {
          'busq-1': { completed: true,  value: 'NOVA TECH',                          fieldKey: 'denominacion' },
          'busq-2': { completed: true,  value: 'Software de gestión empresarial B2B', fieldKey: 'descripcion'  },
          'busq-3': { completed: false },
        },
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      // OT 3 — Nova, finalizado
      {
        companyId: novaId,
        companyName: 'Grupo Empresarial Nova S.A.S',
        reference: 'SEED-003',
        stage: 'finalizado',
        procedureTypeCode: 'CONTA',
        procedureTypeName: 'Contestación Auto',
        assignedToEmail: 'isanin@spiamericas.com',
        internalNotes: 'Contestación presentada y aceptada',
        source: 'seed',
        createdManually: true,
        documents: [],
        requirementsProgress: {
          'conta-1': { completed: true, signedAt: now.toISOString(), signerName: 'Isabel Sanín', expiresAt: fiveYears },
          'conta-2': { completed: true, value: 'NOVA CONNECT',    fieldKey: 'denominacion' },
          'conta-3': { completed: true, value: 'SC 2024-12345',   fieldKey: 'expediente'   },
          'conta-4': { completed: true, documentUrl: null },
        },
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      // OT 4 — Tech, pago_adelanto
      {
        companyId: techId,
        companyName: 'Tech Innovations LATAM',
        reference: 'SEED-004',
        stage: 'pago_adelanto',
        procedureTypeCode: 'RM',
        procedureTypeName: 'Solicitud de Registro de Marca',
        assignedToEmail: 'jquintero@spiamericas.com',
        internalNotes: 'Esperando comprobante de pago adelanto',
        source: 'seed',
        createdManually: true,
        documents: [],
        requirementsProgress: {
          'rm-1': { completed: true,  signedAt: now.toISOString(), signerName: 'Juan Felipe Quintero', expiresAt: fiveYears },
          'rm-2': { completed: true,  value: 'ANDINA FRESH', fieldKey: 'denominacion' },
          'rm-3': { completed: false },
          'rm-4': { completed: false },
          'rm-5': { completed: false },
          'rm-6': { completed: false },
          'rm-7': { completed: true,  value: 'Chile', fieldKey: 'pais' },
        },
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      // OT 5 — Tech, solicitud
      {
        companyId: techId,
        companyName: 'Tech Innovations LATAM',
        reference: 'SEED-005',
        stage: 'solicitud',
        procedureTypeCode: 'OPORM',
        procedureTypeName: 'Oposición a Registro de Marca',
        assignedToEmail: 'lmarin@spiamericas.com',
        internalNotes: 'Oposición nueva — pendiente documentación completa',
        source: 'seed',
        createdManually: true,
        documents: [],
        requirementsProgress: {},
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      // OT 6 — Andina, finalizado
      {
        companyId: andinaId,
        companyName: 'Distribuidora Andina Ltda',
        reference: 'SEED-006',
        stage: 'finalizado',
        procedureTypeCode: 'RENM',
        procedureTypeName: 'Solicitud Renovación de Registro de Marca',
        assignedToEmail: 'edorado@spiamericas.com',
        internalNotes: 'Renovación completada exitosamente',
        source: 'seed',
        createdManually: true,
        documents: [],
        requirementsProgress: {
          'ren-1': { completed: true, signedAt: now.toISOString(), signerName: 'Eduardo Dorado', expiresAt: fiveYears },
          'ren-2': { completed: true, documentUrl: null },
          'ren-3': { completed: true, value: 'REN-2024-0987', fieldKey: 'expediente' },
          'ren-4': { completed: true, value: 'Colombia',      fieldKey: 'pais'       },
        },
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      // OT 7 — Andina, gestion
      {
        companyId: andinaId,
        companyName: 'Distribuidora Andina Ltda',
        reference: 'SEED-007',
        stage: 'gestion',
        procedureTypeCode: 'AFEC',
        procedureTypeName: 'Afectaciones (Cesión)',
        assignedToEmail: 'edorado@spiamericas.com',
        internalNotes: 'Cesión de marca en revisión',
        source: 'seed',
        createdManually: true,
        documents: [],
        requirementsProgress: {
          'afec-1': { completed: true,  signedAt: now.toISOString(), signerName: 'Eduardo Dorado', expiresAt: fiveYears },
          'afec-2': { completed: true,  value: 'DISTRIBUIDORA ANDINA', fieldKey: 'denominacion' },
          'afec-3': { completed: false },
          'afec-4': { completed: false },
          'afec-5': { completed: false },
        },
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
    ];

    for (const ot of OTS) {
      // Check if OT with this reference already exists
      const existing = await db.collection('ots').where('reference', '==', ot.reference).limit(1).get();
      if (existing.empty) {
        await db.collection('ots').add(ot);
      }
    }
  }

  // ── Step 5: Summary ──────────────────────────────────────────────────────

  console.log('\n✅ Seed completado — SPI Smart Flow v2');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👤 Usuarios cliente creados: 6');
  console.log(`isanin@spiamericas.com    → Grupo Empresarial Nova S.A.S`);
  console.log(`fparra@spiamericas.com    → Grupo Empresarial Nova S.A.S`);
  console.log(`jquintero@spiamericas.com → Tech Innovations LATAM`);
  console.log(`lmarin@spiamericas.com    → Tech Innovations LATAM`);
  console.log(`edorado@spiamericas.com   → Distribuidora Andina Ltda`);
  console.log(`cliente@test.spi.com      → Grupo Empresarial Nova S.A.S`);
  console.log('🏢 Empresas:');
  console.log(`Grupo Empresarial Nova S.A.S   (id: ${novaId})`);
  console.log(`Tech Innovations LATAM          (id: ${techId})`);
  console.log(`Distribuidora Andina Ltda       (id: ${andinaId})`);
  console.log('📋 OTs creadas: 7');
  console.log('SEED-001 RM    solicitud     → Nova');
  console.log('SEED-002 BUSQ  gestion       → Nova');
  console.log('SEED-003 CONTA finalizado    → Nova');
  console.log('SEED-004 RM    pago_adelanto → Tech');
  console.log('SEED-005 OPORM solicitud     → Tech');
  console.log('SEED-006 RENM  finalizado    → Andina');
  console.log('SEED-007 AFEC  gestion       → Andina');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Contraseña todos los usuarios seed: SpiTest2025!');
  console.log('Contraseña cliente@test.spi.com:    Test1234!');
  console.log('NOTA: El usuario spi-admin existente en Firebase no fue modificado.\n');
}

main().catch((err) => {
  console.error('❌ Seed falló:', err);
  process.exit(1);
});
