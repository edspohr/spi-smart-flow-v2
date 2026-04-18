import { useEffect, useMemo, useRef, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import useAuthStore from '@/store/useAuthStore';
import useOTStore from '@/store/useOTStore';
import { safeDate } from '@/lib/utils';
import {
  buildClientNotifications,
  type NotificationItem,
} from '@/lib/clientNotifications';
import type { Log } from '@/store/types';

const MAX_IN_CLAUSE = 30;
const LOGS_LIMIT = 100;

interface UseClientNotificationsResult {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  markAllRead: () => Promise<void>;
}

/**
 * Subscribes to `logs` scoped to the current client's active OTs and derives
 * a feed of NotificationItems. Reads `users/{uid}.lastNotificationReadAt` once
 * on mount and stores it in a ref so the "unread" indicator stays stable for
 * the whole session.
 */
export function useClientNotifications(): UseClientNotificationsResult {
  const user = useAuthStore((s) => s.user);
  const markNotificationsRead = useAuthStore((s) => s.markNotificationsRead);
  const ots = useOTStore((s) => s.ots);
  const subscribeToCompanyOTs = useOTStore((s) => s.subscribeToCompanyOTs);

  const [logs, setLogs] = useState<Log[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [lastReadReady, setLastReadReady] = useState(false);
  const lastReadAtRef = useRef<Date | null>(null);

  const isClient = user?.role === 'client';
  const companyId = user?.companyId;
  const uid = user?.uid;

  // 1. Ensure OTs are loaded — subscribe on-demand when no other page has.
  useEffect(() => {
    if (!isClient || !companyId) return;
    if (ots.length > 0) return;
    const unsub = subscribeToCompanyOTs(companyId);
    return () => unsub();
    // We deliberately only re-run when companyId or role changes — not on every
    // `ots` update, to avoid resubscribing while the first snapshot is landing.
  }, [isClient, companyId, subscribeToCompanyOTs]);

  // 2. Read `lastNotificationReadAt` once per uid; store in ref to keep the
  //    unread visual stable across this session.
  useEffect(() => {
    if (!uid) {
      lastReadAtRef.current = null;
      setLastReadReady(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', uid));
        if (cancelled) return;
        const raw = snap.exists()
          ? (snap.data() as any).lastNotificationReadAt
          : null;
        lastReadAtRef.current = safeDate(raw);
      } catch {
        lastReadAtRef.current = null;
      } finally {
        if (!cancelled) setLastReadReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  // 3. Build the list of active OT ids to query. Sort by createdAt desc and
  //    slice to 30 (Firestore `in` cap).
  const activeOtIds = useMemo(() => {
    if (!isClient) return [] as string[];
    const sorted = [...ots].sort((a, b) => {
      const ta = Date.parse(a.createdAt || '') || 0;
      const tb = Date.parse(b.createdAt || '') || 0;
      return tb - ta;
    });
    return sorted.slice(0, MAX_IN_CLAUSE).map((ot) => ot.id);
  }, [isClient, ots]);

  // 4. Subscribe to logs for these OTs.
  useEffect(() => {
    if (!isClient) {
      setLogs([]);
      setLogsLoading(false);
      return;
    }
    if (activeOtIds.length === 0) {
      setLogs([]);
      setLogsLoading(false);
      return;
    }
    setLogsLoading(true);
    const q = query(
      collection(db, 'logs'),
      where('otId', 'in', activeOtIds),
      orderBy('timestamp', 'desc'),
      limit(LOGS_LIMIT),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setLogs(
          snap.docs.map((d) => ({ id: d.id, ...d.data() } as Log)),
        );
        setLogsLoading(false);
      },
      (err) => {
        console.error('useClientNotifications logs subscription failed:', err);
        setLogs([]);
        setLogsLoading(false);
      },
    );
    return () => unsub();
    // activeOtIds is a new array reference on every ots change — stringify so
    // we don't resubscribe when the set of ids hasn't actually changed.
  }, [isClient, activeOtIds.join('|')]);

  // 5. Derive feed.
  const notifications = useMemo(() => {
    if (!lastReadReady) return [];
    return buildClientNotifications(logs, ots, lastReadAtRef.current);
  }, [logs, ots, lastReadReady]);

  const unreadCount = notifications.filter((n) => n.isUnread).length;

  return {
    notifications,
    unreadCount,
    isLoading: logsLoading || !lastReadReady,
    markAllRead: markNotificationsRead,
  };
}

export default useClientNotifications;
