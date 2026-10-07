import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

const COMPLAINTS_SEEN_KEY = 'admin_last_seen_complaints';
const EGOV_SEEN_KEY = 'admin_last_seen_egov';

const NotificationContext = createContext({
  complaintsCount: 0,
  egovCount: 0,
  totalCount: 0,
  markComplaintsSeen: () => {},
  markEgovSeen: () => {},
  markAllSeen: () => {}
});

export function NotificationProvider({ children }) {
  const { isAdmin } = useAuth();
  const [complaintsCount, setComplaintsCount] = useState(0);
  const [egovCount, setEgovCount] = useState(0);
  const intervalRef = useRef(null);

  const fetchUnread = useCallback(async () => {
    if (!isAdmin) {
      setComplaintsCount(0);
      setEgovCount(0);
      return;
    }
    try {
      const [complaints, egovRequests] = await Promise.all([
        api.complaints.list(),
        api.egov.requests().catch(() => [])
      ]);

      // --- Complaints count ---
      const seenComplaints = localStorage.getItem(COMPLAINTS_SEEN_KEY);
      if (!seenComplaints) {
        setComplaintsCount(complaints.filter((c) => c.status === 'pending').length);
      } else {
        const seenDate = new Date(seenComplaints);
        setComplaintsCount(
          complaints.filter(
            (c) => c.status === 'pending' && new Date(c.createdAt) > seenDate
          ).length
        );
      }

      // --- E-Governance count ---
      const seenEgov = localStorage.getItem(EGOV_SEEN_KEY);
      if (!seenEgov) {
        setEgovCount(egovRequests.filter((r) => r.status === 'pending').length);
      } else {
        const seenDate = new Date(seenEgov);
        setEgovCount(
          egovRequests.filter(
            (r) => r.status === 'pending' && new Date(r.createdAt) > seenDate
          ).length
        );
      }
    } catch {
      // silently fail
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) { setComplaintsCount(0); setEgovCount(0); return; }
    fetchUnread();
    intervalRef.current = setInterval(fetchUnread, 20000);
    return () => clearInterval(intervalRef.current);
  }, [isAdmin, fetchUnread]);

  const markComplaintsSeen = useCallback(() => {
    localStorage.setItem(COMPLAINTS_SEEN_KEY, new Date().toISOString());
    setComplaintsCount(0);
  }, []);

  const markEgovSeen = useCallback(() => {
    localStorage.setItem(EGOV_SEEN_KEY, new Date().toISOString());
    setEgovCount(0);
  }, []);

  const markAllSeen = useCallback(() => {
    const now = new Date().toISOString();
    localStorage.setItem(COMPLAINTS_SEEN_KEY, now);
    localStorage.setItem(EGOV_SEEN_KEY, now);
    setComplaintsCount(0);
    setEgovCount(0);
  }, []);

  const totalCount = complaintsCount + egovCount;

  return (
    <NotificationContext.Provider value={{
      complaintsCount,
      egovCount,
      totalCount,
      markComplaintsSeen,
      markEgovSeen,
      markAllSeen,
      refetch: fetchUnread
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
