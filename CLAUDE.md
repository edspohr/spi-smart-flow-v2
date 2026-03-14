# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Frontend (root)
```bash
npm run dev          # Start Vite dev server
npm run build        # Production build → dist/
npm run lint         # ESLint
npm run preview      # Preview production build
```

### Cloud Functions (`/functions`)
```bash
npm run build        # TypeScript compile
npm run build:watch  # Watch mode
npm run serve        # Build + start Firebase emulators (functions only)
npm run deploy       # Deploy functions to Firebase
npm run logs         # Tail Firebase function logs
```

### Firebase
```bash
firebase deploy --only hosting        # Deploy frontend
firebase deploy --only firestore      # Deploy Firestore rules/indexes
firebase deploy --only functions      # Deploy Cloud Functions
firebase emulators:start              # Full local emulator suite
```

**Note:** `firebase deploy --only functions` requires valid Application Default Credentials. If it times out with "User code failed to load", run `gcloud auth application-default login` first.

No test suite is configured.

## Architecture

**SPI Smart Flow** is a LegalTech document management and workflow platform for SPI Americas. It manages work orders (OTs — Órdenes de Trabajo) through a multi-stage lifecycle with AI-assisted document validation.

### Tech Stack
- **Frontend:** React 19 + TypeScript, Vite, Tailwind CSS, Radix UI (shadcn/ui pattern)
- **State:** Zustand — modular stores (see below)
- **Backend:** Firebase — Auth, Firestore, Storage, Cloud Functions (Node 22)
- **AI:** Google Gemini 1.5 Flash via Cloud Function for document OCR/analysis
- **Path alias:** `@` → `./src`

### Authentication
Email + password for all users via `signInWithEmailAndPassword`. Registration is admin-only (via Firebase Console — create user, set password, then set their role + companyId in Firestore `users` collection).

- New users without a Firestore document are auto-healed to a `guest` role on first sign-in
- Magic link is disabled (was unreliable); can be re-enabled later via `useAuthStore` if needed

### User Roles & Routing
Three roles defined in `src/AppRouter.tsx`:
- **client** → `ClientDashboard`, `ClientVault`
- **spi-admin** → `SPIAdminDashboard`, `NewRequestPage`, `SPIVault`, `CompaniesPage`
- **guest** → `GuestDashboard`

### Zustand Stores

The data layer is split into three modular stores. `src/store/useDataStore.ts` is a compatibility barrel that re-exports all three for legacy callers — prefer importing directly from the modular stores.

| Store | File | Owns |
|---|---|---|
| `useAuthStore` | `src/store/useAuthStore.ts` | Auth state, magic-link methods, user profile |
| `useOTStore` | `src/store/useOTStore.ts` | `ots[]`, `logs[]`, OT subscriptions, `createOT`, `updateOTStage` |
| `useDocumentStore` | `src/store/useDocumentStore.ts` | `documents[]`, `vaultDocuments[]`, vault logic, `updateDocumentStatus`, `replaceDocument` |
| `useAdminStore` | `src/store/useAdminStore.ts` | `users[]`, `companies[]`, company CRUD, admin subscriptions |

Shared utilities:
- `src/store/types.ts` — all shared TypeScript types (`OT`, `Document`, `Log`, `Company`, etc.)
- `src/lib/logAction.ts` — standalone Firestore audit log writer (used by all stores)
- `src/lib/uploadFile.ts` — Firebase Storage upload helper

### Firestore Collections & RBAC

| Collection | `spi-admin` | `client` |
|---|---|---|
| `users` | Full access | Read own + same `companyId`; create/update own only |
| `companies` | Full access | Read own company only |
| `ots` | Full access | Read-only, own `companyId` |
| `documents` | Full access | Read + create (own company); cannot set `status: 'validated'` |
| `logs` | Full access | Read + create only |

### OT Lifecycle (Kanban stages)
`solicitud` → `pago_adelanto` → `gestion` → `pago_cierre` → `finalizado`

Stage transitions: `useOTStore.updateOTStage()`. Pipefy `card.move` events also trigger stage sync via the webhook.

### Document Flow
1. User uploads file via `DocumentUpload.tsx`
2. `analyzeDocument(file, docId, otId)` in `src/lib/gemini.ts` calls the Cloud Function
3. Cloud Function calls Gemini 1.5 Flash, extracts: `documentType`, `name`, `rut`, `validUntil`, `confidence`, `requiresManualReview`
4. **Auto-approval**: if `confidence > 0.85` AND `requiresManualReview === false`, the function updates the document to `status: 'validated'` server-side and returns `autoApproved: true`
5. Manual review path: `pending` → `uploaded` → `validating_ai` → `ocr_processed` → `validated`

### Smart Vault
`SmartVaultModal.tsx` + `useDocumentStore.checkVaultForReuse()`:
- Queries validated, non-expired docs for the same `companyId`
- Reuses docs across OTs via `linkVaultDocument()`

### Cloud Functions (`/functions/src/`)
- `index.ts` — `analyzeDocument` (HTTPS callable): Gemini OCR + auto-approval at confidence > 0.85
- `pipefy.ts` — `createOTFromPipefy` (HTTPS webhook): routes on `payload.action`
  - `card.create` → creates OT + default documents
  - `card.move` → maps Pipefy phase name to OT stage via keyword table, updates Firestore
  - `card.field.update` → syncs `amount`, `fees`, `paymentTerms`, `deadline`
- `reminders.ts` — Scheduled daily function for deadline reminders and escalation alerts

### Environment
Requires `.env.local` with `VITE_FIREBASE_*` variables (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId). Firebase project: `spi-smart-flow`.

The `GEMINI_API_KEY` is stored as a Firebase Secret (not in `.env`) and accessed via `defineSecret("GEMINI_API_KEY")` in the Cloud Function.
