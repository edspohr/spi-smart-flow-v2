# SPI Smart Flow v2

Plataforma B2B de gestión de Propiedad Intelectual para **SPI Americas**. Centraliza el ciclo de vida de las Órdenes de Trabajo (OTs), la validación documental asistida por IA y la comunicación con clientes en un único sistema seguro y en tiempo real.

---

## Índice

1. [Descripción funcional](#1-descripción-funcional)
2. [Roles y permisos](#2-roles-y-permisos)
3. [Flujo de trabajo principal](#3-flujo-de-trabajo-principal)
4. [Módulos del sistema](#4-módulos-del-sistema)
5. [Arquitectura técnica](#5-arquitectura-técnica)
6. [Stack tecnológico](#6-stack-tecnológico)
7. [Estructura del proyecto](#7-estructura-del-proyecto)
8. [Modelo de datos (Firestore)](#8-modelo-de-datos-firestore)
9. [Seguridad y RBAC](#9-seguridad-y-rbac)
10. [Cloud Functions](#10-cloud-functions)
11. [Integraciones externas](#11-integraciones-externas)
12. [Variables de entorno](#12-variables-de-entorno)
13. [Comandos de desarrollo](#13-comandos-de-desarrollo)
14. [Despliegue](#14-despliegue)

---

## 1. Descripción funcional

SPI Smart Flow es una aplicación web que permite a SPI Americas gestionar el registro de marcas y otros servicios de Propiedad Intelectual (PI) para sus clientes corporativos. El sistema cubre todo el ciclo desde la creación de una solicitud hasta su finalización, con trazabilidad completa, validación de documentos con IA y firma digital.

### Capacidades principales

| Capacidad | Descripción |
|---|---|
| **Gestión de OTs** | Creación, seguimiento y cierre de Órdenes de Trabajo en un kanban con 5 etapas |
| **Validación IA de documentos** | Análisis automático con Gemini 2.5 Flash: extracción de RUT, nombre, vigencia y tipo de documento |
| **Auto-aprobación** | Si la IA tiene confianza > 85% y el documento es legible, se valida automáticamente sin intervención manual |
| **Bóveda inteligente** | Documentos vigentes y validados se reutilizan en futuras OTs del mismo cliente/empresa |
| **Autenticación sin contraseña** | Acceso por magic link enviado al correo; no se almacenan contraseñas |
| **Firma digital** | Captura de firma en canvas integrado en el flujo documental |
| **Integración Pipefy** | Creación automática de OTs y sincronización de etapas/pagos desde el CRM vía webhooks |
| **Recordatorios automáticos** | Alertas de vencimiento y escalamientos generados por Cloud Functions programadas |
| **Auditoría completa** | Bitácora inmutable de todas las acciones: subidas, validaciones, cambios de etapa |

---

## 2. Roles y permisos

El sistema tiene tres roles con acceso completamente diferenciado:

### `spi-admin` — Equipo interno SPI Americas
- Acceso completo a todas las OTs, documentos y empresas
- Crear y asignar OTs a clientes
- Validar o rechazar documentos manualmente
- Gestionar el catálogo de empresas y usuarios
- Cambiar etapas del kanban
- Ver bitácora de todos los clientes

### `client` — Cliente corporativo
- Ver únicamente sus propias OTs (filtradas por `companyId`)
- Subir documentos requeridos para cada OT
- Consultar el estado de validación de sus documentos
- Acceder a su Bóveda de documentos vigentes
- Ver la bitácora de sus OTs (solo lectura)
- **No puede** cambiar el estado de un documento a `validated`

### `guest` — Usuario sin empresa asignada
- Vista restringida mientras un administrador asigna su empresa y rol
- Acceso al dashboard de invitado

---

## 3. Flujo de trabajo principal

### Ciclo de vida de una OT

```
┌─────────────┐    ┌───────────────┐    ┌──────────┐    ┌──────────────┐    ┌────────────┐
│  solicitud  │ →  │ pago_adelanto │ →  │ gestión  │ →  │ pago_cierre  │ →  │ finalizado │
└─────────────┘    └───────────────┘    └──────────┘    └──────────────┘    └────────────┘
```

1. **Creación** — Un admin crea la OT en `NewRequestPage` o llega automáticamente desde Pipefy
2. **Documentación** — El cliente sube los documentos requeridos desde `ClientDashboard`
3. **Validación IA** — Cada documento se analiza con Gemini 2.5 Flash en el momento de la subida
4. **Auto-aprobación o revisión manual** — Si `confidence > 0.85` y `requiresManualReview === false`, el sistema aprueba automáticamente; si no, queda pendiente para el admin
5. **Avance de etapa** — El admin mueve la OT por el kanban a medida que se completan los requisitos de pago y gestión
6. **Cierre** — La OT llega a `finalizado` y los documentos vigentes quedan disponibles en la Bóveda

### Flujo de autenticación (Magic Link)

```
Usuario ingresa email
        ↓
Sistema envía magic link al correo (Firebase Auth)
        ↓
Usuario hace clic en el enlace
        ↓
completeMagicLinkSignIn() detecta el callback URL
        ↓
onAuthStateChanged busca perfil en Firestore /users/{uid}
        ↓
Si no existe → auto-heal: crea perfil con role: "guest"
        ↓
AppRouter redirige según role: client | spi-admin | guest
```

### Flujo de validación documental

```
DocumentUpload.tsx
        ↓
analyzeDocument(file, docId, otId) → Cloud Function
        ↓
Gemini 2.5 Flash extrae: documentType, name, rut, validUntil,
                          confidence, requiresManualReview
        ↓
confidence > 0.85 AND requiresManualReview === false ?
    ✅ SÍ → status: "validated", isVaultEligible: true  (server-side)
    ⏳ NO → status: "ocr_processed" → revisión manual del admin
        ↓
Documento vigente con isVaultEligible: true → disponible en Bóveda
```

---

## 4. Módulos del sistema

### Panel del cliente (`/client`)
- **KanbanBoard**: vista de todas sus OTs organizadas por etapa
- **OTDetailsModal**: detalle de la OT, listado de documentos, estado de validación, bitácora de eventos
- **DocumentUpload**: subida de archivos con validación IA en tiempo real
- **SmartVaultModal**: sugerencia de reutilización de documentos vigentes de la empresa

### Bóveda del cliente (`/client/vault`)
- Listado de todos los documentos validados y vigentes de la empresa
- Descarga directa de documentos
- Indicador de vigencia y tipo

### Panel SPI Admin (`/spi-admin`)
- Vista global de todas las OTs con filtros y búsqueda
- Estadísticas por empresa, etapa y área (PI / AR)

### Creación de OT (`/spi-admin/new-request`)
- Formulario completo: empresa, cliente, servicio, montos, fechas límite
- Carga de logo y captura de firma digital
- Asignación de colores corporativos de la marca

### Bóveda Admin (`/spi-admin/vault`)
- Vista de todos los documentos validados del sistema
- Acciones de validación/rechazo manual

### Gestión de empresas (`/spi-admin/companies`)
- CRUD de empresas
- Estadísticas de OTs y documentos por empresa
- Gestión de usuarios asociados

---

## 5. Arquitectura técnica

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React 19)                      │
│                                                              │
│   AppRouter → ProtectedRoute → Pages → Components           │
│                                                              │
│   useAuthStore    useOTStore    useDocumentStore  useAdminStore │
│        ↓              ↓               ↓               ↓     │
│              Firebase SDK (Auth / Firestore / Storage)       │
└─────────────────────────────────────────────┬───────────────┘
                                              │ HTTPS Callable / Webhook
┌─────────────────────────────────────────────▼───────────────┐
│                 CLOUD FUNCTIONS (Node 22, Gen 2)             │
│                                                              │
│   analyzeDocument       createOTFromPipefy                   │
│   (Gemini 2.5 Flash)    (Webhook Pipefy)                     │
│                                                              │
│   checkDocumentDeadlines   triggerDeadlinesCheck             │
│   (Scheduled 24h)          (HTTP manual trigger)             │
└─────────────────────────────────────────────────────────────┘
```

### Gestión de estado

La capa de datos está dividida en stores modulares de Zustand. Cada store suscribe sus propios listeners de Firestore y devuelve funciones de limpieza (`unsubscribe`).

```
src/store/
├── types.ts              # Tipos compartidos (OT, Document, Log, Company…)
├── useAuthStore.ts       # Sesión, magic link, perfil de usuario
├── useOTStore.ts         # OTs, bitácora, subscripciones, createOT, updateOTStage
├── useDocumentStore.ts   # Documentos, Bóveda, validaciones, reemplazo de archivos
├── useAdminStore.ts      # Usuarios, empresas, CRUD admin
└── useDataStore.ts       # Barrel de compatibilidad (re-exporta los tres stores)

src/lib/
├── logAction.ts          # Escritura de auditoría en Firestore /logs
├── uploadFile.ts         # Upload a Firebase Storage
└── gemini.ts             # Wrapper del callable analyzeDocument
```

---

## 6. Stack tecnológico

### Frontend
| Tecnología | Versión | Uso |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | 5.x | Tipado estático |
| Vite | 7 | Build tool y dev server |
| Tailwind CSS | 3.4 | Estilos utilitarios |
| Radix UI | Latest | Componentes accesibles (Dialog, Tabs, Dropdown…) |
| Zustand | 5 | Gestión de estado global |
| React Router | 6 | Navegación SPA |
| date-fns | 4 | Manipulación de fechas |
| Lucide React | 0.56 | Iconografía |
| react-signature-canvas | — | Captura de firma digital |

### Backend / Infraestructura
| Tecnología | Uso |
|---|---|
| Firebase Authentication | Autenticación sin contraseña (magic links) |
| Cloud Firestore | Base de datos NoSQL en tiempo real |
| Firebase Storage | Almacenamiento de archivos/documentos |
| Cloud Functions (Gen 2, Node 22) | Lógica server-side, webhooks, tareas programadas |
| Firebase Hosting | Hosting del frontend (SPA con rewrite) |

### IA
| Modelo | Uso |
|---|---|
| Gemini 2.5 Flash | Análisis OCR de documentos legales chilenos |

---

## 7. Estructura del proyecto

```
spi-smart-flow-v2/
├── public/
│   └── spi-logo.png
├── src/
│   ├── main.jsx                    # Entry point
│   ├── App.tsx                     # Root — inicializa auth listener
│   ├── AppRouter.tsx               # Routing por rol
│   ├── pages/
│   │   ├── LoginPage.tsx           # Magic link auth
│   │   ├── ClientDashboard.tsx     # Kanban del cliente
│   │   ├── ClientVault.tsx         # Bóveda del cliente
│   │   ├── SPIAdminDashboard.tsx   # Panel admin
│   │   ├── NewRequestPage.tsx      # Creación de OT
│   │   ├── SPIVault.tsx            # Bóveda admin
│   │   ├── CompaniesPage.tsx       # Gestión de empresas
│   │   └── GuestDashboard.tsx      # Vista invitado
│   ├── components/
│   │   ├── ui/                     # shadcn/ui (Button, Input, Card, Badge…)
│   │   ├── dashboard/
│   │   │   ├── KanbanBoard.tsx
│   │   │   └── TimelineStepper.tsx
│   │   ├── admin/
│   │   │   └── ClientList.tsx
│   │   ├── layout/
│   │   │   └── WhatsAppButton.tsx
│   │   ├── OTDetailsModal.tsx
│   │   ├── DocumentUpload.tsx
│   │   ├── SmartVaultModal.tsx
│   │   ├── SignaturePad.tsx
│   │   ├── ColorPicker.tsx
│   │   └── ProtectedRoute.tsx
│   ├── store/
│   │   ├── types.ts
│   │   ├── useAuthStore.ts
│   │   ├── useOTStore.ts
│   │   ├── useDocumentStore.ts
│   │   ├── useAdminStore.ts
│   │   └── useDataStore.ts         # Barrel de compatibilidad
│   ├── lib/
│   │   ├── firebase.ts
│   │   ├── gemini.ts
│   │   ├── logAction.ts
│   │   ├── uploadFile.ts
│   │   └── utils.ts
│   └── layouts/
│       ├── AppLayout.tsx
│       └── Sidebar.tsx
├── functions/
│   ├── src/
│   │   ├── index.ts                # analyzeDocument (Gemini)
│   │   ├── pipefy.ts               # createOTFromPipefy (webhook)
│   │   └── reminders.ts            # checkDocumentDeadlines (scheduled)
│   ├── lib/                        # JS compilado (no editar directamente)
│   └── package.json
├── firestore.rules                 # Reglas de seguridad RBAC
├── firestore.indexes.json          # Índices compuestos
├── firebase.json                   # Configuración Firebase
├── CLAUDE.md                       # Guía para Claude Code
└── .env.local                      # Variables de entorno (no commitear)
```

---

## 8. Modelo de datos (Firestore)

### `users/{uid}`
```typescript
{
  uid: string
  email: string
  displayName: string
  role: "client" | "spi-admin" | "guest"
  companyId: string
  createdAt: string  // ISO 8601
}
```

### `ots/{otId}`
```typescript
{
  title: string
  serviceType: string
  area: "PI" | "AR"
  stage: "solicitud" | "pago_adelanto" | "gestion" | "pago_cierre" | "finalizado"
  clientId: string
  companyId: string
  amount: number
  fees?: number
  discountPercentage?: number
  deadline: string
  createdAt: string
  updatedAt?: string
  brandName?: string
  description?: string
  colors?: string[]
  logoUrl?: string
  signatureUrl?: string
  pipefyCardId?: string   // Solo OTs creadas desde Pipefy
  source?: "pipefy"
}
```

### `documents/{docId}`
```typescript
{
  otId: string
  clientId: string
  companyId: string
  name: string
  type: string            // "poder_legal" | "cedula" | "logo" | "sign" | "upload" | "text"
  status: "pending" | "uploaded" | "validating_ai" | "ocr_processed" |
          "validated" | "rejected" | "awaiting_signature" | "vault_matched"
  url?: string
  isVaultEligible: boolean
  validUntil?: string
  validationMetadata?: {  // Poblado por Gemini
    documentType: string
    name: string
    rut: string | null
    confidence: number
    requiresManualReview: boolean
  }
  rejectionReason?: string
  uploadedAt: string
  autoApprovedAt?: Timestamp  // Solo documentos auto-aprobados
}
```

### `logs/{logId}`
```typescript
{
  otId: string
  userId: string
  userName: string
  action: string
  type: "system" | "user"
  timestamp: string
  metadata?: {
    docId?: string
    confidence?: number
    autoApproved?: boolean
    [key: string]: any
  }
}
```

### `companies/{companyId}`
```typescript
{
  name: string
  industry?: string
  taxId?: string          // RUT empresa
  address?: string
  contactName?: string
  contactEmail?: string
  createdAt: string
}
```

---

## 9. Seguridad y RBAC

Las reglas de Firestore implementan control de acceso estricto por rol. Las funciones helper `isAdmin()` y `myCompanyId()` usan `exists()` como guarda antes de llamar `get()` para evitar errores con usuarios nuevos sin documento Firestore.

| Colección | `spi-admin` | `client` | `guest` |
|---|---|---|---|
| `users` | Lectura/escritura total | Lee propio + misma empresa; crea/actualiza propio | Solo lee propio |
| `companies` | Lectura/escritura total | Lee solo su empresa | ✗ |
| `ots` | Lectura/escritura total | Solo lectura, filtrado por `companyId` | ✗ |
| `documents` | Lectura/escritura total | Lee + crea (su empresa); no puede poner `validated` | ✗ |
| `logs` | Lectura/escritura total | Lee + crea; no actualiza ni elimina | ✗ |

---

## 10. Cloud Functions

Todas las funciones son **Gen 2** (Cloud Run), Node 22, región `us-central1`.

### `analyzeDocument` — HTTPS Callable
Analiza un documento con Gemini 2.5 Flash.

**Input:**
```typescript
{
  fileBase64: string   // Archivo en base64
  mimeType: string     // MIME type del archivo
  docId?: string       // ID Firestore del documento (activa auto-aprobación)
  otId?: string        // ID de la OT (para auditoría)
}
```

**Output:**
```typescript
{
  documentType: "poder_legal" | "cedula" | "logo" | "unknown"
  name: string
  rut: string | null
  validUntil: string | null
  confidence: number           // 0–1
  requiresManualReview: boolean
  autoApproved: boolean        // true si se validó automáticamente
}
```

**Lógica de auto-aprobación:**
- `confidence > 0.85` AND `requiresManualReview === false` AND `docId` presente
- → Actualiza Firestore: `status: "validated"`, `isVaultEligible: true`, `autoApprovedAt`
- La clave `GEMINI_API_KEY` se gestiona como Firebase Secret (no en `.env`)

---

### `createOTFromPipefy` — HTTPS Webhook

Procesa eventos entrantes de Pipefy. Rutea según `payload.action`:

| `payload.action` | Comportamiento |
|---|---|
| `card.create` (default) | Crea OT + documentos por defecto; busca cliente por email |
| `card.move` | Mapea el nombre de la fase Pipefy al stage de la OT y actualiza Firestore |
| `card.field.update` | Sincroniza `amount`, `fees`, `paymentTerms`, `deadline` |

**Mapeo de fases Pipefy → stages:**

| Keywords de la fase | Stage |
|---|---|
| solicitud, recepción, inicio, nueva | `solicitud` |
| pago adelanto, cobro inicial, adelanto | `pago_adelanto` |
| gestión, proceso, trámite | `gestion` |
| pago cierre, cobro final, cierre | `pago_cierre` |
| finalizado, completado, terminado | `finalizado` |

---

### `checkDocumentDeadlines` — Scheduled (cada 24h)
- Revisa todas las OTs activas (stage ≠ `finalizado`)
- Si `daysLeft <= 2`: escribe log de recordatorio
- Si `daysLeft < 0` o inactividad > 30 días: escribe log de escalamiento

### `triggerDeadlinesCheck` — HTTPS (trigger manual)
Misma lógica que `checkDocumentDeadlines`, activable manualmente para testing.

---

## 11. Integraciones externas

### Pipefy
- **Dirección:** Pipefy → SPI Smart Flow (inbound webhook)
- **URL:** `https://createotfrompipefy-my5tykotyq-uc.a.run.app`
- **Autenticación:** Por IP o secret header (configurar en Pipefy Automation)
- **Eventos soportados:** `card.create`, `card.move`, `card.field.update`

### Firebase Authentication
- Proveedor: **Email link (passwordless)**
- Debe estar habilitado en Firebase Console → Authentication → Sign-in method
- Dominios autorizados: `localhost` (dev) + dominio de producción

### Google Gemini
- Modelo: `gemini-2.5-flash`
- API Key almacenada como Firebase Secret: `GEMINI_API_KEY`
- Acceso: solo desde la Cloud Function `analyzeDocument` (nunca expuesta al cliente)

---

## 12. Variables de entorno

Crear `.env.local` en la raíz del proyecto (nunca commitear):

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=spi-smart-flow
VITE_FIREBASE_STORAGE_BUCKET=spi-smart-flow.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

La `GEMINI_API_KEY` **no va en `.env`** — se gestiona como Firebase Secret:
```bash
firebase functions:secrets:set GEMINI_API_KEY
```

---

## 13. Comandos de desarrollo

### Frontend
```bash
npm install          # Instalar dependencias
npm run dev          # Servidor de desarrollo (localhost:5173)
npm run build        # Build de producción → dist/
npm run lint         # ESLint
npm run preview      # Preview del build de producción
```

### Cloud Functions
```bash
cd functions
npm install
npm run build        # Compilar TypeScript → lib/
npm run build:watch  # Compilar en modo watch
npm run serve        # Build + emulador local de functions
npm run logs         # Ver logs en tiempo real
```

### Firebase CLI
```bash
firebase deploy --only hosting      # Deploy frontend
firebase deploy --only firestore    # Deploy reglas e índices
firebase deploy --only functions    # Deploy Cloud Functions
firebase emulators:start            # Suite completa de emuladores locales
```

> **Nota:** Para hacer deploy de functions se requiere autenticación válida de Google Cloud:
> ```bash
> gcloud auth application-default login
> ```

---

## 14. Despliegue

### Producción
El proyecto se despliega íntegramente en Firebase (`spi-smart-flow`):

```bash
# Deploy completo
firebase deploy

# Deploy parcial (recomendado)
firebase deploy --only hosting          # Frontend
firebase deploy --only firestore        # Reglas y índices
firebase deploy --only functions        # Cloud Functions
```

El hosting está configurado con un rewrite catch-all hacia `index.html` para soportar el router SPA de React.

### Firebase CLI — versión mínima requerida
`firebase-tools >= 15.10.0` (requerido para compatibilidad con `firebase-functions v7` y su protocolo de descubrimiento de funciones basado en manifesto).

```bash
npm install -g firebase-tools@latest
```

---

## Desarrollo Local

### 1. Credenciales de servicio (seed script)

Descarga la clave de servicio desde **Firebase Console → Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada** y guárdala en:

```
scripts/serviceAccountKey.json
```

> ⚠️ **Nunca subas `serviceAccountKey.json` ni archivos `.env` al repositorio.** Están listados en `.gitignore`.

### 2. Variables de entorno del frontend

Crea `.env.local` en la raíz con tus valores de Firebase y activa el modo de pruebas:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=spi-smart-flow
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_MOCK_MODE=true
```

Cuando `VITE_MOCK_MODE=true`, se mostrará un banner amarillo en todas las rutas autenticadas indicando que la integración con Pipefy está desactivada. La validación con Gemini **no se ve afectada** por esta variable.

### 3. Variables de entorno de Cloud Functions

Crea `functions/.env` y `functions/.env.local` con:

```env
PIPEFY_DISABLED=true
```

Esto hace que el webhook de Pipefy devuelva `{ status: 'ignored' }` sin ejecutar ninguna lógica. Útil para desarrollo local y staging.

### 4. Ejecutar el seed

Instala las dependencias y ejecuta el script:

```bash
npm install
npm run seed
```

El script es **idempotente** — puedes ejecutarlo múltiples veces sin crear duplicados. Crea:
- 6 usuarios cliente con contraseña `SpiTest2025!` (excepto `cliente@test.spi.com` que usa `Test1234!`)
- 3 empresas de prueba (Nova, Tech, Andina)
- 7 OTs en distintas etapas del kanban

El usuario `spi-admin` existente en Firebase **no es modificado**.

---

## Licencia

Uso interno — SPI Americas. Todos los derechos reservados.
