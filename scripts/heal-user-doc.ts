/**
 * heal-user-doc.ts — re-keys a user's Firestore /users/{uid} document onto
 * their current Firebase Auth UID and removes any orphan duplicates.
 *
 * Use this when a user's Firestore profile is at the "wrong" doc ID (e.g.
 * keyed by an older UID or by email-prefix), causing isAdmin() rules and
 * CF role gates to silently deny their admin actions.
 *
 * Usage:
 *   npx tsx scripts/heal-user-doc.ts <email> [--role=spi-admin] [--dry-run]
 *
 * Requires either GOOGLE_APPLICATION_CREDENTIALS env var pointing to a
 * service account JSON, or a ./service-account.json next to the cwd.
 */
import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Auth via service account JSON (never commit this file)
const SERVICE_ACCOUNT_PATH =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ?? './service-account.json';

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(readFileSync(resolve(SERVICE_ACCOUNT_PATH), 'utf8')),
  ),
});

const args = process.argv.slice(2);
const email = args[0];
const roleArg =
  args.find((a) => a.startsWith('--role='))?.split('=')[1] ?? 'spi-admin';
const dryRun = args.includes('--dry-run');

if (!email) {
  console.error(
    'Usage: tsx scripts/heal-user-doc.ts <email> [--role=spi-admin] [--dry-run]',
  );
  process.exit(1);
}

async function heal() {
  const auth = admin.auth();
  const db = admin.firestore();

  // 1. Fetch Auth user
  let authUser: admin.auth.UserRecord;
  try {
    authUser = await auth.getUserByEmail(email);
  } catch (err: any) {
    console.error(`No Firebase Auth user found for ${email}:`, err.message);
    process.exit(1);
  }
  console.log(`Auth UID for ${email}: ${authUser.uid}`);
  if (authUser.disabled) {
    console.warn('  WARNING: this Auth user is disabled. Re-enabling.');
    if (!dryRun) await auth.updateUser(authUser.uid, { disabled: false });
  }

  // 2. List all Firestore user docs with this email
  const snap = await db.collection('users').where('email', '==', email).get();
  console.log(`Found ${snap.size} Firestore user doc(s) for ${email}.`);

  if (snap.size === 0) {
    console.log('Creating fresh admin doc at users/' + authUser.uid);
    const payload = {
      email,
      displayName: authUser.displayName ?? email.split('@')[0],
      role: roleArg,
      companyId: '',
      createdAt: new Date().toISOString(),
      healedBy: 'heal-user-doc.ts',
      healedAt: new Date().toISOString(),
    };
    console.log('  payload:', payload);
    if (!dryRun) await db.collection('users').doc(authUser.uid).set(payload);
    console.log(dryRun ? 'DRY RUN — no changes written.' : 'Heal complete.');
    return;
  }

  if (snap.size === 1 && snap.docs[0].id === authUser.uid) {
    console.log('  Doc already keyed by Auth UID. Forcing role to:', roleArg);
    if (!dryRun) {
      await snap.docs[0].ref.update({
        role: roleArg,
        disabled: admin.firestore.FieldValue.delete(),
        deletedAt: admin.firestore.FieldValue.delete(),
        healedAt: new Date().toISOString(),
      });
    }
    console.log(dryRun ? 'DRY RUN — no changes written.' : 'Heal complete.');
    return;
  }

  // Multi-doc or mismatched ID — consolidate
  const ROLE_PRIORITY = ['spi-admin', 'spi-staff', 'client', 'guest'];
  const sorted = snap.docs.sort(
    (a, b) =>
      ROLE_PRIORITY.indexOf((a.data().role as string) ?? 'guest') -
      ROLE_PRIORITY.indexOf((b.data().role as string) ?? 'guest'),
  );
  const winner = sorted[0];
  console.log(
    `  Highest-privilege doc: ${winner.id} (role: ${winner.data().role})`,
  );

  const consolidated: Record<string, unknown> = {
    ...winner.data(),
    email,
    role: roleArg,
    disabled: admin.firestore.FieldValue.delete(),
    deletedAt: admin.firestore.FieldValue.delete(),
    healedBy: 'heal-user-doc.ts',
    healedAt: new Date().toISOString(),
    previousDocIds: snap.docs.map((d) => d.id),
  };

  console.log(`  Migrating to users/${authUser.uid}:`, consolidated);
  console.log(
    `  Deleting ${snap.size} old doc(s):`,
    snap.docs.map((d) => d.id),
  );

  if (!dryRun) {
    const batch = db.batch();
    batch.set(db.collection('users').doc(authUser.uid), consolidated);
    snap.docs.forEach((d) => {
      if (d.id !== authUser.uid) batch.delete(d.ref);
    });
    await batch.commit();
  }

  console.log(dryRun ? 'DRY RUN — no changes written.' : 'Heal complete.');
}

heal().catch((err) => {
  console.error('Heal failed:', err);
  process.exit(1);
});
