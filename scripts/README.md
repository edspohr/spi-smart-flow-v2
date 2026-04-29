# User document healing script

Use this when a user's Firestore `/users/{uid}` document is out-of-sync
with their Firebase Auth UID, causing role-based permissions to silently
fail.

## Setup

1. Download a service account JSON from Firebase Console →
   Project settings → Service accounts → Generate new private key.
2. Save as `./service-account.json` (gitignored) **or** set the
   `GOOGLE_APPLICATION_CREDENTIALS` environment variable to its path.

## Run

```bash
npm install -D tsx
npx tsx scripts/heal-user-doc.ts juliana@spi-americas.com --role=spi-admin
npx tsx scripts/heal-user-doc.ts edu@spi-americas.com --role=spi-staff --dry-run
```

Flags:

- `--dry-run` — shows what would change without writing.
- `--role=<role>` — defaults to `spi-admin`.

## What it does

1. Fetches the Firebase Auth user by email → gets the current UID.
2. Lists every `users/{*}` Firestore document where `email == <arg>`.
3. If exactly one doc and its ID matches the Auth UID → forces the
   role and clears `disabled` / `deletedAt` flags.
4. If exactly one doc with mismatched ID → migrates the fields onto
   `users/{authUid}` and deletes the orphan.
5. If multiple docs → picks the highest-privilege role
   (`spi-admin > spi-staff > client > guest`), migrates it onto
   `users/{authUid}`, and deletes the rest.
6. If zero docs → creates a fresh profile at `users/{authUid}` with
   the requested role.

The script also re-enables the Auth account if it was disabled.
