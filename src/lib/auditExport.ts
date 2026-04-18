import type { Log } from '@/store/types';

export interface SignatureEventRecord {
  id: string;
  otId?: string;
  requirementId?: string;
  documentId?: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  companyId?: string;
  companyName?: string;
  ip?: string;
  userAgent?: string;
  timestampUTC?: any;
  timestampISO?: string;
  pdfOriginalHash?: string;
  pdfFinalHash?: string;
  pdfOriginalPath?: string;
  pdfFinalPath?: string;
  consentDeclaration?: string;
  legalFramework?: string;
  createdAt?: any;
}

export interface UserLookup {
  [userId: string]: { email?: string; displayName?: string; name?: string };
}

export interface AuditRow {
  timestamp_utc: string;
  source: 'logs' | 'signatureEvents';
  action: string;
  actor: string;
  actor_email: string;
  otId: string;
  requirementId: string;
  documentId: string;
  details: string;
}

const HEADERS: Array<keyof AuditRow> = [
  'timestamp_utc',
  'source',
  'action',
  'actor',
  'actor_email',
  'otId',
  'requirementId',
  'documentId',
  'details',
];

// LATAM Excel locale default: semicolon as separator, comma as decimal.
const SEPARATOR = ';';
const BOM = '\uFEFF';

function toIsoUtc(raw: unknown): string {
  if (!raw) return '';
  if (typeof raw === 'string') {
    const d = new Date(raw);
    return isNaN(d.getTime()) ? raw : d.toISOString();
  }
  if (raw instanceof Date) return raw.toISOString();
  // Firestore Timestamp
  if (typeof (raw as any).toDate === 'function') {
    try {
      return (raw as any).toDate().toISOString();
    } catch {
      return '';
    }
  }
  return '';
}

function escapeCell(value: string): string {
  if (value == null) return '';
  const needsQuotes = /["\r\n;]/.test(value);
  if (!needsQuotes) return value;
  return `"${value.replace(/"/g, '""')}"`;
}

function logToRow(log: Log, users: UserLookup): AuditRow {
  const actor = log.userId || 'system';
  const userInfo = users[actor];
  const { id: _id, otId, userId: _u, action, timestamp, metadata, ...rest } = log as any;
  const details = {
    ...(metadata ? { metadata } : {}),
    ...rest,
  };
  return {
    timestamp_utc: toIsoUtc(timestamp),
    source: 'logs',
    action: action || '',
    actor,
    actor_email: userInfo?.email || '',
    otId: otId || '',
    requirementId: (metadata as any)?.requirementId || '',
    documentId: (metadata as any)?.docId || (metadata as any)?.documentId || '',
    details: Object.keys(details).length > 0 ? JSON.stringify(details) : '',
  };
}

function signatureEventToRow(ev: SignatureEventRecord, users: UserLookup): AuditRow {
  const actor = ev.userId || 'system';
  const userInfo = users[actor];
  const details = {
    ip: ev.ip,
    userAgent: ev.userAgent,
    pdfOriginalHash: ev.pdfOriginalHash,
    pdfFinalHash: ev.pdfFinalHash,
    pdfOriginalPath: ev.pdfOriginalPath,
    pdfFinalPath: ev.pdfFinalPath,
    legalFramework: ev.legalFramework,
    companyName: ev.companyName,
  };
  return {
    timestamp_utc:
      ev.timestampISO || toIsoUtc(ev.timestampUTC) || toIsoUtc(ev.createdAt),
    source: 'signatureEvents',
    action: 'SignatureEvent registrado (Ley 527)',
    actor,
    actor_email: ev.userEmail || userInfo?.email || '',
    otId: ev.otId || '',
    requirementId: ev.requirementId || '',
    documentId: ev.documentId || '',
    details: JSON.stringify(details),
  };
}

/**
 * Merge logs + signature events into a chronological CSV string (UTF-8, `;` separator, BOM-prefixed).
 * Pure function — no side effects, no external I/O.
 */
export function buildAuditCsv(
  logs: Log[],
  signatureEvents: SignatureEventRecord[],
  users: UserLookup = {},
): string {
  const rows: AuditRow[] = [
    ...logs.map((l) => logToRow(l, users)),
    ...signatureEvents.map((e) => signatureEventToRow(e, users)),
  ];

  rows.sort((a, b) => a.timestamp_utc.localeCompare(b.timestamp_utc));

  const headerLine = HEADERS.join(SEPARATOR);
  const body = rows
    .map((row) => HEADERS.map((h) => escapeCell(String(row[h] ?? ''))).join(SEPARATOR))
    .join('\r\n');

  return BOM + headerLine + '\r\n' + body;
}

/** Trigger a browser download for the given CSV content. */
export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
