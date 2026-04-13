/**
 * One-time cleanup script — removes all seed/mock data from Firestore.
 * Run manually: npx ts-node scripts/cleanMockData.ts
 * Requires scripts/serviceAccountKey.json
 *
 * SAFE: only deletes documents where source === 'seed' or createdBy === 'pipefy'
 */

import * as admin from 'firebase-admin';
import * as path from 'path';

const serviceAccount = require(path.resolve(__dirname, 'serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function batchDelete(refs: admin.firestore.DocumentReference[]) {
  let deleted = 0;
  for (let i = 0; i < refs.length; i += 500) {
    const batch = db.batch();
    const chunk = refs.slice(i, i + 500);
    chunk.forEach((ref) => batch.delete(ref));
    await batch.commit();
    deleted += chunk.length;
  }
  return deleted;
}

async function main() {
  console.log('=== SPI Smart Flow — Mock Data Cleanup ===\n');

  // 1 — Find seed OTs
  const seedOtsSnap = await db.collection('ots').where('source', '==', 'seed').get();
  const seedOtIds = seedOtsSnap.docs.map((d) => d.id);
  console.log(`Found ${seedOtIds.length} seed OTs`);

  // 2 — Delete documents tied to seed OTs
  let deletedDocs = 0;
  if (seedOtIds.length > 0) {
    // Firestore 'in' queries support max 30 values
    for (let i = 0; i < seedOtIds.length; i += 30) {
      const chunk = seedOtIds.slice(i, i + 30);
      const docsSnap = await db.collection('documents').where('otId', 'in', chunk).get();
      deletedDocs += await batchDelete(docsSnap.docs.map((d) => d.ref));
    }
  }
  console.log(`Deleted ${deletedDocs} documents linked to seed OTs`);

  // 3 — Delete logs tied to seed OTs
  let deletedLogs = 0;
  if (seedOtIds.length > 0) {
    for (let i = 0; i < seedOtIds.length; i += 30) {
      const chunk = seedOtIds.slice(i, i + 30);
      const logsSnap = await db.collection('logs').where('otId', 'in', chunk).get();
      deletedLogs += await batchDelete(logsSnap.docs.map((d) => d.ref));
    }
  }
  console.log(`Deleted ${deletedLogs} logs linked to seed OTs`);

  // 4 — Delete the seed OTs themselves
  const deletedOts = await batchDelete(seedOtsSnap.docs.map((d) => d.ref));
  console.log(`Deleted ${deletedOts} seed OTs`);

  // 5 — Delete test users (safety: must have createdAt containing '202')
  const testEmails = ['cliente@test.spi.com'];
  const testDomains = ['@spiamericas.com'];
  const usersSnap = await db.collection('users').get();
  const testUserRefs = usersSnap.docs.filter((d) => {
    const data = d.data();
    const email = (data.email || '').toLowerCase();
    const hasCreatedAt = typeof data.createdAt === 'string' && data.createdAt.includes('202');
    const isTestEmail = testEmails.includes(email) || testDomains.some((domain) => email.endsWith(domain));
    return isTestEmail && hasCreatedAt;
  }).map((d) => d.ref);
  const deletedUsers = await batchDelete(testUserRefs);
  console.log(`Deleted ${deletedUsers} test users`);

  // 6 — Delete specific mock companies
  const mockCompanyNames = [
    'Grupo Empresarial Nova S.A.S',
    'Tech Innovations LATAM',
    'Distribuidora Andina Ltda',
  ];
  const companyRefs: admin.firestore.DocumentReference[] = [];
  for (const name of mockCompanyNames) {
    const snap = await db.collection('companies').where('name', '==', name).get();
    snap.docs.forEach((d) => companyRefs.push(d.ref));
  }
  const deletedCompanies = await batchDelete(companyRefs);
  console.log(`Deleted ${deletedCompanies} mock companies`);

  // Summary
  console.log('\n=== Summary ===');
  console.log(`  OTs:        ${deletedOts}`);
  console.log(`  Documents:  ${deletedDocs}`);
  console.log(`  Logs:       ${deletedLogs}`);
  console.log(`  Users:      ${deletedUsers}`);
  console.log(`  Companies:  ${deletedCompanies}`);
  console.log('\nDone.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
