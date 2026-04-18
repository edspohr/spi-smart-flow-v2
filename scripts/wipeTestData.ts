/**
 * Phase 0 — Full wipe of test data from Firestore + Storage.
 * Run manually:   npm run wipe
 * Requires       scripts/serviceAccountKey.json
 *
 * Deletes:
 *   - All docs in `ots`
 *   - All docs in `documents` (including `documents/{id}/versions` subcollections)
 *   - All docs in `logs`
 *   - All docs in `companies` (including `companies/{id}/vault` subcollections)
 *   - All docs in `users` EXCEPT role === 'spi-admin'
 *   - All Storage files under prefixes: ots/, documents/, signed-powers/
 *
 * Preserves:
 *   - `procedureTypes` collection
 *   - Any spi-admin user doc
 *   - Firebase Auth users (never touched)
 *   - Storage files outside the three listed prefixes (e.g. config/)
 */
import admin from 'firebase-admin';
import * as readline from 'readline';

import * as path from 'path';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serviceAccount = JSON.parse(
  readFileSync(path.resolve(__dirname, 'serviceAccountKey.json'), 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: `${serviceAccount.project_id}.firebasestorage.app`,
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

const BATCH_SIZE = 500;

async function confirm(): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(
      `⚠️  This will DELETE ALL OTs, documents, logs, companies, and non-admin users from project ${serviceAccount.project_id}. Type YES to continue: `,
      (answer) => {
        rl.close();
        resolve(answer.trim() === 'YES');
      }
    );
  });
}

async function deleteRefsInBatches(
  refs: admin.firestore.DocumentReference[],
  label: string
): Promise<number> {
  let deleted = 0;
  for (let i = 0; i < refs.length; i += BATCH_SIZE) {
    const chunk = refs.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    chunk.forEach((ref) => batch.delete(ref));
    await batch.commit();
    deleted += chunk.length;
    console.log(`  ${label}: ${deleted}/${refs.length}`);
  }
  return deleted;
}

async function deleteSubcollection(
  parentCol: string,
  subCol: string
): Promise<number> {
  const parents = await db.collection(parentCol).listDocuments();
  let total = 0;
  for (const parent of parents) {
    const subSnap = await parent.collection(subCol).get();
    if (subSnap.empty) continue;
    total += await deleteRefsInBatches(
      subSnap.docs.map((d) => d.ref),
      `${parentCol}/.../${subCol}`
    );
  }
  return total;
}

async function deleteCollection(col: string): Promise<number> {
  const snap = await db.collection(col).get();
  if (snap.empty) return 0;
  return deleteRefsInBatches(snap.docs.map((d) => d.ref), col);
}

async function deleteStoragePrefix(prefix: string): Promise<number> {
  const [files] = await bucket.getFiles({ prefix });
  if (files.length === 0) {
    console.log(`  storage/${prefix}: 0 files`);
    return 0;
  }
  let deleted = 0;
  for (let i = 0; i < files.length; i += 100) {
    const chunk = files.slice(i, i + 100);
    await Promise.all(chunk.map((f) => f.delete({ ignoreNotFound: true } as any)));
    deleted += chunk.length;
    console.log(`  storage/${prefix}: ${deleted}/${files.length}`);
  }
  return deleted;
}

async function main() {
  console.log('\n=== SPI Smart Flow — Full Test Data Wipe ===\n');

  const ok = await confirm();
  if (!ok) {
    console.log('Aborted.');
    process.exit(0);
  }

  console.log('\nProceeding with wipe...\n');

  // 1 — OTs
  const deletedOts = await deleteCollection('ots');

  // 2 — Documents + their `versions` subcollections
  const deletedDocVersions = await deleteSubcollection('documents', 'versions');
  const deletedDocs = await deleteCollection('documents');

  // 3 — Logs
  const deletedLogs = await deleteCollection('logs');

  // 4 — Companies + their `vault` subcollections
  const deletedVaults = await deleteSubcollection('companies', 'vault');
  const deletedCompanies = await deleteCollection('companies');

  // 5 — Non-admin users only
  const usersSnap = await db.collection('users').get();
  const nonAdminRefs = usersSnap.docs
    .filter((d) => (d.data() as any).role !== 'spi-admin')
    .map((d) => d.ref);
  const deletedUsers = await deleteRefsInBatches(nonAdminRefs, 'users (non-admin)');

  // 6 — Storage
  const deletedOtFiles = await deleteStoragePrefix('ots/');
  const deletedDocFiles = await deleteStoragePrefix('documents/');
  const deletedSignedFiles = await deleteStoragePrefix('signed-powers/');
  const deletedStorage = deletedOtFiles + deletedDocFiles + deletedSignedFiles;

  console.log('\n=== Summary ===');
  console.log(`  OTs:                  ${deletedOts}`);
  console.log(`  Documents:            ${deletedDocs}`);
  console.log(`  Document versions:    ${deletedDocVersions}`);
  console.log(`  Logs:                 ${deletedLogs}`);
  console.log(`  Companies:            ${deletedCompanies}`);
  console.log(`  Company vault docs:   ${deletedVaults}`);
  console.log(`  Non-admin users:      ${deletedUsers}`);
  console.log(`  Storage files:        ${deletedStorage}`);
  console.log('\nDone.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
