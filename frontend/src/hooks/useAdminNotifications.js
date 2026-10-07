import { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client';

const LAST_SEEN_KEY = 'admin_last_seen_complaints';

export function useAdminNotifications(isAdmin) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastSeenAt, setLastSeenAt] = useState(() => {
    return localStorage.getItem(LAST_SEEN_KEY) || null;
  });

  const fetchUnread = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const complaints = await api.complaints.list();
      const seen = localStorage.getItem(LAST_SEEN_KEY);
      if (!seen) {
        // First time — all pending complaints count as new
        setUnreadCount(complaints.filter((c) => c.status === 'pending').length);
      } else {
        const seenDate = new Date(seen);
        const newOnes = complaints.filter(
          (c) => c.status === 'pending' && new Date(c.createdAt) > seenDate
        );
        setUnreadCount(newOnes.length);
      }
    } catch {
      // silently fail
    }
  }, [isAdmin]);

  // Poll every 30 seconds for new complaints
  useEffect(() => {
    if (!isAdmin) return;
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [isAdmin, fetchUnread]);

  const markAllSeen = useCallback(() => {
    const now = new Date().toISOString();
    localStorage.setItem(LAST_SEEN_KEY, now);
    setLastSeenAt(now);
    setUnreadCount(0);
  }, []);

  return { unreadCount, markAllSeen };
}
