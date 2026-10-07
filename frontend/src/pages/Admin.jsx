import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Bell, Briefcase, ShieldAlert, Search, Trash2, Plus,
  AlertCircle, CheckCircle2, Clock, UserCheck, MapPin, Activity,
  Sliders, Megaphone, Wrench, Shield, ClipboardList, RefreshCw,
  Receipt, Pencil, X, Save, Phone, Sparkles, Bus
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAppUpdate } from '../hooks/useAppUpdate';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { useNotifications } from '../context/NotificationContext';
import { AdminSkeleton } from '../components/common/Skeletons';

export default function Admin() {
  const { user: currentUser, isAdmin } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data states
  const [users, setUsers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [complaints, setComplaints] = useState([]);

  // Billing States
  const [utilityBills, setUtilityBills] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [billForm, setBillForm] = useState({ userId: '', type: 'water', amount: '', dueDate: '', usage: '' });
  const [submittingBill, setSubmittingBill] = useState(false);
  const [billSearch, setBillSearch] = useState('');
  const [billTypeFilter, setBillTypeFilter] = useState('all');
  const [billStatusFilter, setBillStatusFilter] = useState('all');
  const [editingBillId, setEditingBillId] = useState(null);
  const [editBillForm, setEditBillForm] = useState({ usage: '', amount: '', dueDate: '' });
  const [savingBill, setSavingBill] = useState(false);

  // Transport / Bus Routes & Ticket States
  const [routes, setRoutes] = useState([]);
  const [routeForm, setRouteForm] = useState({ number: '', name: '', stops: '', frequency: 'Every 15 min' });
  const [editingRouteId, setEditingRouteId] = useState(null);
  const [routeSearch, setRouteSearch] = useState('');
  const [submittingRoute, setSubmittingRoute] = useState(false);

  const [tickets, setTickets] = useState([]);
  const [editingTicketId, setEditingTicketId] = useState(null);
  const [editTicketForm, setEditTicketForm] = useState({ route: '', from: '', to: '', price: '', status: 'active' });
  const [savingTicket, setSavingTicket] = useState(false);
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState('all');

  // Form states
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', category: 'general' });
  const [workerForm, setWorkerForm] = useState({ name: '', department: 'waste', status: 'available' });

  // Search/Filter states
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [workerDeptFilter, setWorkerDeptFilter] = useState('all');
  const [emergencyStatusFilter, setEmergencyStatusFilter] = useState('all');

  const { complaintsCount, egovCount, markComplaintsSeen, markEgovSeen } = useNotifications();
  const { checking, updateAvailable, currentVersion, remoteVersion, applyUpdate } = useAppUpdate();

  const fetchData = async () => {
    try {
      const [u, a, w, e, c, b, ct, rts, tkts] = await Promise.all([
        api.auth.getUsers(),
        api.announcements.list(),
        api.workers.list(),
        api.emergency.requests(),
        api.complaints.list(),
        api.utilities.adminListBills().catch(() => []),
        api.emergency.contacts().catch(() => []),
        api.transport.routes().catch(() => []),
        api.transport.tickets().catch(() => [])
      ]);
      setUsers(u);
      setAnnouncements(a);
      setWorkers(w);
      setEmergencies(e);
      setComplaints(c);
      setUtilityBills(b);
      setContacts(ct);
      setRoutes(rts);
      setTickets(tkts);
    } catch (err) {
      toast(err.message || 'Failed to fetch admin data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleUpdateTicket = async (id) => {
    if (!editTicketForm.from.trim() || !editTicketForm.to.trim() || !editTicketForm.price) {
      toast('From, To, and Price are required', 'error');
      return;
    }
    setSavingTicket(true);
    try {
      const updated = await api.transport.updateTicket(id, {
        route: editTicketForm.route,
        from: editTicketForm.from,
        to: editTicketForm.to,
        price: Number(editTicketForm.price),
        status: editTicketForm.status
      });
      setTickets(tickets.map(t => t.id === id ? updated : t));
      setEditingTicketId(null);
      toast('Bus ticket updated successfully');
    } catch (err) {
      toast(err.message || 'Failed to update ticket', 'error');
    } finally {
      setSavingTicket(false);
    }
  };

  const handleDeleteAdminTicket = async (id) => {
    if (!window.confirm('Are you sure you want to delete this ticket?')) return;
    try {
      await api.transport.deleteTicket(id);
      setTickets(tickets.filter(t => t.id !== id));
      if (editingTicketId === id) setEditingTicketId(null);
      toast('Bus ticket deleted successfully');
    } catch (err) {
      toast(err.message || 'Failed to delete ticket', 'error');
    }
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const citizen = users.find(u => u.id === t.userId);
      const matchesSearch = !ticketSearch.trim() ||
        t.route.toLowerCase().includes(ticketSearch.toLowerCase().trim()) ||
        t.from.toLowerCase().includes(ticketSearch.toLowerCase().trim()) ||
        t.to.toLowerCase().includes(ticketSearch.toLowerCase().trim()) ||
        (citizen && citizen.name.toLowerCase().includes(ticketSearch.toLowerCase().trim())) ||
        (citizen && citizen.email.toLowerCase().includes(ticketSearch.toLowerCase().trim()));
      const matchesStatus = ticketStatusFilter === 'all' || t.status === ticketStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tickets, users, ticketSearch, ticketStatusFilter]);

  const handleCreateRoute = async (e) => {
    e.preventDefault();
    if (!routeForm.number.trim() || !routeForm.name.trim() || !routeForm.stops.trim() || !routeForm.frequency.trim()) {
      toast('All fields are required', 'error');
      return;
    }
    const stopsArray = routeForm.stops.split(',').map(s => s.trim()).filter(Boolean);
    setSubmittingRoute(true);
    try {
      if (editingRouteId) {
        const updated = await api.transport.updateRoute(editingRouteId, {
          number: routeForm.number,
          name: routeForm.name,
          stops: stopsArray,
          frequency: routeForm.frequency
        });
        setRoutes(routes.map(r => r.id === updated.id ? updated : r));
        setEditingRouteId(null);
        toast('Bus route updated successfully');
      } else {
        const created = await api.transport.createRoute({
          number: routeForm.number,
          name: routeForm.name,
          stops: stopsArray,
          frequency: routeForm.frequency
        });
        setRoutes([...routes, created]);
        toast('Bus route created successfully');
      }
      setRouteForm({ number: '', name: '', stops: '', frequency: 'Every 15 min' });
    } catch (err) {
      toast(err.message || 'Failed to save bus route', 'error');
    } finally {
      setSubmittingRoute(false);
    }
  };

  const handleDeleteRoute = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bus route?')) return;
    try {
      await api.transport.deleteRoute(id);
      setRoutes(routes.filter(r => r.id !== id));
      if (editingRouteId === id) {
        setEditingRouteId(null);
        setRouteForm({ number: '', name: '', stops: '', frequency: 'Every 15 min' });
      }
      toast('Bus route deleted successfully');
    } catch (err) {
      toast(err.message || 'Failed to delete route', 'error');
    }
  };

  const handleStartEditRoute = (r) => {
    setEditingRouteId(r.id);
    const stopsData = r.stops;
    const stopsArray = Array.isArray(stopsData) ? stopsData : (stopsData?.stops || []);
    setRouteForm({
      number: r.number,
      name: r.name,
      stops: stopsArray.join(', '),
      frequency: r.frequency
    });
  };

  const filteredRoutes = useMemo(() => {
    if (!routeSearch.trim()) return routes;
    const query = routeSearch.toLowerCase().trim();
    return routes.filter((r) => {
      const stopsArray = Array.isArray(r.stops) ? r.stops : (r.stops?.stops || []);
      return (
        r.number.toLowerCase().includes(query) ||
        r.name.toLowerCase().includes(query) ||
        stopsArray.some(s => s.toLowerCase().includes(query))
      );
    });
  }, [routes, routeSearch]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Auth Guards
  if (!currentUser) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">
          Please <Link to="/login" className="text-primary-600 font-medium">sign in</Link> as an admin to access the Admin Portal.
        </p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-16">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-slate-500 font-medium text-lg mb-2">Access Restricted</p>
        <p className="text-slate-400 text-sm">
          You do not have administrative permissions to view this page.
        </p>
      </div>
    );
  }

  if (loading) return <AdminSkeleton />;

  // --- Handlers ---

  // User Handlers
  const handleRoleChange = async (userId, newRole) => {
    try {
      const updated = await api.auth.updateUser(userId, { role: newRole });
      setUsers(users.map((u) => (u.id === userId ? updated : u)));
      toast(`User role updated to ${newRole}`);
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handleUserDelete = async (userId) => {
    if (userId === currentUser.id) {
      toast('You cannot delete your own admin account.', 'error');
      return;
    }
    if (!window.confirm('Are you sure you want to permanently delete this user account?')) {
      return;
    }
    try {
      await api.auth.deleteUser(userId);
      setUsers(users.filter((u) => u.id !== userId));
      toast('User account successfully deleted');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  // Announcement Handlers
  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    if (!announcementForm.title.trim() || !announcementForm.content.trim()) {
      toast('Title and content are required', 'error');
      return;
    }
    try {
      const created = await api.announcements.create(announcementForm);
      setAnnouncements([created, ...announcements]);
      setAnnouncementForm({ title: '', content: '', category: 'general' });
      toast('Announcement published successfully');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handleAnnouncementDelete = async (annId) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await api.announcements.delete(annId);
      setAnnouncements(announcements.filter((a) => a.id !== annId));
      toast('Announcement deleted');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  // Worker Handlers
  const handleWorkerSubmit = async (e) => {
    e.preventDefault();
    if (!workerForm.name.trim()) {
      toast('Worker name is required', 'error');
      return;
    }
    try {
      const created = await api.workers.create(workerForm);
      setWorkers([...workers, created]);
      setWorkerForm({ name: '', department: 'waste', status: 'available' });
      toast('Field worker hired successfully');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handleWorkerDelete = async (workerId) => {
    if (!window.confirm('Dismiss this field worker from services?')) return;
    try {
      await api.workers.delete(workerId);
      setWorkers(workers.filter((w) => w.id !== workerId));
      toast('Worker dismissed');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  // Emergency Handlers
  const handleEmergencyStatus = async (emergencyId, newStatus) => {
    try {
      const updated = await api.emergency.updateStatus(emergencyId, newStatus);
      setEmergencies(emergencies.map((e) => (e.id === emergencyId ? updated : e)));
      toast(`Emergency status marked as ${newStatus}`);
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handleEmergencyDelete = async (emergencyId) => {
    if (!window.confirm('Are you sure you want to permanently delete this emergency request record?')) return;
    try {
      await api.emergency.delete(emergencyId);
      setEmergencies(emergencies.filter((e) => e.id !== emergencyId));
      toast('Emergency request record successfully deleted');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  // Utility Bill Handlers
  const handleAdminPayBill = async (billId) => {
    try {
      const updated = await api.utilities.adminPayBill(billId);
      setUtilityBills(utilityBills.map((b) => (b.id === billId ? updated : b)));
      toast('Bill marked as paid successfully');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handleBillSubmit = async (e) => {
    e.preventDefault();
    if (!billForm.userId || !billForm.amount || !billForm.dueDate || !billForm.usage) {
      toast('All fields are required', 'error');
      return;
    }
    setSubmittingBill(true);
    try {
      const created = await api.utilities.adminCreateBill(billForm);
      setUtilityBills([created, ...utilityBills]);
      setBillForm({ userId: '', type: 'water', amount: '', dueDate: '', usage: '' });
      toast('Utility bill generated successfully');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSubmittingBill(false);
    }
  };

  const handleBillUpdate = async (billId) => {
    setSavingBill(true);
    try {
      const updated = await api.utilities.adminUpdateBill(billId, editBillForm);
      setUtilityBills(utilityBills.map((b) => (b.id === billId ? updated : b)));
      setEditingBillId(null);
      toast('Usage & billing details updated successfully');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSavingBill(false);
    }
  };

  // --- Filtering Calculations ---
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredWorkers = workers.filter((w) => {
    return workerDeptFilter === 'all' || w.department === workerDeptFilter;
  });

  const filteredEmergencies = emergencies.filter((e) => {
    return emergencyStatusFilter === 'all' || e.status === emergencyStatusFilter;
  });

  const filteredBills = utilityBills.filter((b) => {
    const matchesStatus = billStatusFilter === 'all' || b.status === billStatusFilter;
    const u = users.find((user) => user.id === b.userId);
    const matchesSearch = !billSearch || 
      (u && (u.name.toLowerCase().includes(billSearch.toLowerCase()) || u.email.toLowerCase().includes(billSearch.toLowerCase()))) ||
      b.usage.toLowerCase().includes(billSearch.toLowerCase());
    
    const matchesType = billTypeFilter === 'all' || b.type === billTypeFilter;
    return matchesStatus && matchesSearch && matchesType;
  });

  // Overview Counts
  const counts = {
    users: users.length,
    activeWorkers: workers.filter((w) => w.status === 'active').length,
    activeEmergencies: emergencies.filter((e) => e.status === 'dispatched').length,
    pendingComplaints: complaints.filter((c) => c.status === 'pending').length,
    inProgressComplaints: complaints.filter((c) => c.status === 'in_progress').length,
    resolvedComplaints: complaints.filter((c) => c.status === 'resolved').length,
    pendingBills: utilityBills.filter((b) => b.status === 'pending').length,
  };

  return (
    <div className="w-full max-w-full space-y-6 overflow-hidden">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-6 h-6 text-primary-600" />
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">Admin Control Panel</h1>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            System management, citizen roles, service deployments, and announcement dispatch.
          </p>
        </div>
        <div className="flex gap-2 self-start md:self-auto">
          <button
            onClick={async () => {
              if (updateAvailable) {
                toast(`Updating to v${remoteVersion}...`);
              } else {
                toast('Checking for updates...');
              }
              await applyUpdate();
            }}
            disabled={checking}
            className={`btn !py-2 !px-3 flex items-center gap-1.5 shadow-sm ${updateAvailable ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-primary-600 hover:bg-primary-700 text-white'}`}
            title={
              updateAvailable
                ? `Update v${remoteVersion} available! Current: v${currentVersion}`
                : `App v${currentVersion || '1.0.0'} — Check for updates`
            }
          >
            {checking ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {checking ? 'Checking…' : updateAvailable ? `Update v${remoteVersion} Available` : 'Update App'}
            {updateAvailable && !checking && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold">NEW</span>
            )}
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary !py-2 !px-3 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Workspace
          </button>
        </div>
      </div>

      {/* New Complaints Notification Banner */}
      {complaintsCount > 0 && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 shadow-sm animate-pulse-once">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-amber-900 text-sm">
                {complaintsCount} new complaint{complaintsCount > 1 ? 's' : ''} received!
              </p>
              <p className="text-amber-700 text-xs mt-0.5">
                Citizens have submitted new complaints that need your attention in the Government portal.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/government"
              onClick={markComplaintsSeen}
              className="btn bg-amber-500 hover:bg-amber-600 text-white !py-1.5 !px-3 text-xs font-semibold"
            >
              View Complaints
            </Link>
            <button
              onClick={markComplaintsSeen}
              className="btn-secondary !py-1.5 !px-3 text-xs"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* New E-Gov Request Notification Banner */}
      {egovCount > 0 && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 shadow-sm animate-pulse-once">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-blue-900 text-sm">
                {egovCount} new E-Governance request{egovCount > 1 ? 's' : ''} received!
              </p>
              <p className="text-blue-700 text-xs mt-0.5">
                Citizens have submitted document or certificate requests that need processing.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/egov"
              onClick={markEgovSeen}
              className="btn bg-blue-500 hover:bg-blue-600 text-white !py-1.5 !px-3 text-xs font-semibold"
            >
              View Requests
            </Link>
            <button
              onClick={markEgovSeen}
              className="btn-secondary !py-1.5 !px-3 text-xs"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200 overflow-x-auto pb-px gap-1">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'users', label: 'Citizens & Roles', icon: Users },
          { id: 'announcements', label: 'Announcements', icon: Megaphone },
          { id: 'workers', label: 'Field Staff', icon: Wrench },
          { id: 'emergencies', label: 'Emergencies', icon: Shield },
          { id: 'bills', label: 'Utility Bills', icon: Receipt },
          { id: 'transport', label: 'Public Transport', icon: Bus }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'emergencies' && counts.activeEmergencies > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 font-bold text-xs animate-pulse">
                  {counts.activeEmergencies}
                </span>
              )}
              {tab.id === 'bills' && counts.pendingBills > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold text-xs">
                  {counts.pendingBills}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TABS CONTENT */}

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <StatCard title="Registered Citizens" value={counts.users} icon={Users} color="primary" />
            <StatCard title="Active Emergencies" value={counts.activeEmergencies} icon={ShieldAlert} color={counts.activeEmergencies > 0 ? 'red' : 'green'} />
            <StatCard title="Active Field Workers" value={`${counts.activeWorkers}/${workers.length}`} icon={Wrench} color="cyan" />
            <StatCard title="Pending Issues" value={counts.pendingComplaints} icon={Clock} color="amber" />
          </div>

          <div className="grid lg:grid-cols-3 gap-6 w-full max-w-full overflow-hidden">
            {/* System Health */}
            <div className="card p-5 lg:col-span-2 space-y-4">
              <h2 className="font-semibold text-slate-900 text-lg">System Health & Live Monitoring</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Complaints Resolved</span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-800">{counts.resolvedComplaints}</span>
                    <span className="text-xs text-green-600 font-medium">
                      ({complaints.length > 0 ? Math.round((counts.resolvedComplaints / complaints.length) * 100) : 0}% rate)
                    </span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Issues In Progress</span>
                  <div className="mt-2">
                    <span className="text-2xl font-bold text-slate-800">{counts.inProgressComplaints}</span>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total Announcements</span>
                  <div className="mt-2">
                    <span className="text-2xl font-bold text-slate-800">{announcements.length}</span>
                  </div>
                </div>
              </div>

              {/* Service Logs */}
              <div className="pt-2">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Critical Service Status</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center p-2.5 rounded bg-red-50 border border-red-100 text-red-700">
                    <span className="font-medium flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" /> Emergency Dispatch Core
                    </span>
                    <span className="font-semibold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-red-100">
                      {counts.activeEmergencies > 0 ? `${counts.activeEmergencies} Active Dispatches` : 'Operational'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded bg-green-50 border border-green-100 text-green-700">
                    <span className="font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Citizen Feedback Registry
                    </span>
                    <span className="font-semibold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-green-100">
                      Normal Latency
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 rounded bg-primary-50 border border-primary-100 text-primary-700">
                    <span className="font-medium flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5" /> Field Staff Network
                    </span>
                    <span className="font-semibold uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-primary-100">
                      {workers.length} Personnel Registered
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="card p-5 space-y-4">
              <h2 className="font-semibold text-slate-900 text-lg">Quick Shortcuts</h2>
              <p className="text-xs text-slate-500">Jump directly to specific administrative panels or modules.</p>
              <div className="flex flex-col gap-2">
                <Link
                  to="/government"
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 hover:border-primary-100 text-slate-700 font-medium text-sm transition-all"
                >
                  <span className="flex items-center gap-2"><ClipboardList className="w-4 h-4 text-slate-500" /> Complaints</span>
                  <span className="text-slate-400">&rarr;</span>
                </Link>
                <Link
                  to="/analytics"
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 hover:border-primary-100 text-slate-700 font-medium text-sm transition-all"
                >
                  <span className="flex items-center gap-2"><Activity className="w-4 h-4 text-slate-500" /> System Analytics</span>
                  <span className="text-slate-400">&rarr;</span>
                </Link>
                <button
                  onClick={() => setActiveTab('announcements')}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 hover:border-primary-100 text-slate-700 font-medium text-sm text-left transition-all w-full"
                >
                  <span className="flex items-center gap-2"><Megaphone className="w-4 h-4 text-slate-500" /> Publish Announcement</span>
                  <span className="text-slate-400">&rarr;</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Users Management */}
      {activeTab === 'users' && (
        <div className="card p-5 space-y-4 w-full max-w-full overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <h2 className="font-semibold text-slate-900 text-lg">Citizen Directory</h2>
            <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name/email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="input pl-10 !py-1.5 text-sm w-full sm:w-48"
                />
              </div>
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="input !py-1.5 text-sm flex-1 sm:flex-initial sm:!w-auto"
              >
                <option value="all">All Roles</option>
                <option value="admin">Administrators</option>
                <option value="citizen">Citizens</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto w-full max-w-full rounded-xl border border-slate-100/80 shadow-sm bg-white">
            <table className="min-w-[1000px] w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50/75 text-slate-500 font-semibold text-left">
                <tr>
                  <th className="px-3 md:px-8 py-3.5 whitespace-nowrap">Citizen Information</th>
                  <th className="px-3 md:px-8 py-3.5 whitespace-nowrap">Contact Number</th>
                  <th className="px-3 md:px-8 py-3.5 whitespace-nowrap">System Role</th>
                  <th className="px-3 md:px-8 py-3.5 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-slate-400 text-sm italic">
                      No citizens matching the query.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelf = u.id === currentUser.id;
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-3 md:px-8 py-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-900">{u.name}</div>
                          <div className="text-slate-400 text-xs mt-0.5">{u.email}</div>
                        </td>
                        <td className="px-3 md:px-8 py-4 text-slate-600 whitespace-nowrap font-medium">
                          {u.phone || <span className="text-slate-300 italic font-normal">No phone record</span>}
                        </td>
                        <td className="px-3 md:px-8 py-4 whitespace-nowrap">
                          {isSelf ? (
                            <span className="badge bg-primary-100 text-primary-700 capitalize flex items-center gap-1 w-fit font-bold text-xs py-1 px-2.5 rounded-full whitespace-nowrap">
                              <UserCheck className="w-3.5 h-3.5" /> Admin (You)
                            </span>
                          ) : (
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              className="input !py-1.5 !px-3 text-xs w-[140px] whitespace-nowrap"
                            >
                              <option value="citizen">Citizen</option>
                              <option value="admin">Admin</option>
                            </select>
                          )}
                        </td>
                        <td className="px-3 md:px-8 py-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleUserDelete(u.id)}
                            disabled={isSelf}
                            className={`p-2 rounded-lg border text-red-600 transition-colors ${
                              isSelf
                                ? 'opacity-30 cursor-not-allowed border-transparent'
                                : 'border-slate-100 hover:bg-red-50 hover:border-red-100 shadow-sm'
                            }`}
                            title={isSelf ? 'Cannot delete yourself' : 'Delete Account'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Announcements */}
      {activeTab === 'announcements' && (
        <div className="grid lg:grid-cols-3 gap-6 w-full max-w-full overflow-hidden">
          {/* Create Announcement Form */}
          <div className="card p-5 h-fit space-y-4">
            <h2 className="font-semibold text-slate-900 text-lg border-b border-slate-100 pb-3 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-primary-600" />
              Publish Announcement
            </h2>
            <form onSubmit={handleAnnouncementSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Title</label>
                <input
                  type="text"
                  placeholder="e.g. Scheduled Power Outage"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  className="input text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Category</label>
                <select
                  value={announcementForm.category}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, category: e.target.value })}
                  className="input text-sm"
                >
                  <option value="general">General</option>
                  <option value="community">Community</option>
                  <option value="utilities">Utilities</option>
                  <option value="emergency">Emergency Alert</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Content Details</label>
                <textarea
                  placeholder="Provide precise details for the announcement..."
                  value={announcementForm.content}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                  className="input text-sm h-28 resize-none"
                  required
                />
              </div>

              <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 py-2">
                <Plus className="w-4 h-4" /> Publish Broadcast
              </button>
            </form>
          </div>

          {/* List Announcements */}
          <div className="lg:col-span-2 card p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="font-semibold text-slate-900 text-lg">Broadcast History</h2>
              <span className="text-xs font-bold text-slate-500 px-2 py-0.5 rounded-full bg-slate-100">
                {announcements.length} Published
              </span>
            </div>

            <div className="space-y-3.5">
              {announcements.length === 0 ? (
                <p className="text-center py-8 text-slate-400 text-sm italic">
                  No announcements published yet.
                </p>
              ) : (
                announcements.map((ann) => (
                  <div key={ann.id} className="p-4 rounded-xl border border-slate-100 hover:shadow-sm transition-all space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide ${
                          ann.category === 'emergency'
                            ? 'bg-red-100 text-red-700'
                            : ann.category === 'utilities'
                            ? 'bg-cyan-100 text-cyan-700'
                            : ann.category === 'community'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {ann.category}
                        </span>
                        <h3 className="font-semibold text-slate-900 text-base mt-1.5">{ann.title}</h3>
                      </div>
                      <button
                        onClick={() => handleAnnouncementDelete(ann.id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors"
                        title="Delete Announcement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{ann.content}</p>
                    <div className="text-[10px] text-slate-400 pt-1">
                      Published on {new Date(ann.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Workers Management */}
      {activeTab === 'workers' && (
        <div className="space-y-6">
          {/* Add Worker Form */}
          <div className="card p-5 h-fit space-y-4">
            <h2 className="font-semibold text-slate-900 text-lg border-b border-slate-100 pb-3 flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary-600" />
              Recruit Field Worker
            </h2>
            <form onSubmit={handleWorkerSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alexander Smith"
                  value={workerForm.name}
                  onChange={(e) => setWorkerForm({ ...workerForm, name: e.target.value })}
                  className="input text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Department</label>
                <select
                  value={workerForm.department}
                  onChange={(e) => setWorkerForm({ ...workerForm, department: e.target.value })}
                  className="input text-sm"
                >
                  <option value="waste">Waste Management</option>
                  <option value="roads">Road Infrastructure</option>
                  <option value="electricity">Power Grid & Electricity</option>
                  <option value="water">Water Works</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Status</label>
                <select
                  value={workerForm.status}
                  onChange={(e) => setWorkerForm({ ...workerForm, status: e.target.value })}
                  className="input text-sm"
                >
                  <option value="available">Available / Idle</option>
                  <option value="active">Active (On Duty)</option>
                  <option value="maintenance">On Break / Maintenance</option>
                </select>
              </div>

              <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 py-2">
                <Plus className="w-4 h-4" /> Deploy Personnel
              </button>
            </form>
          </div>

          {/* Workers Directory List */}
          <div className="card p-5 space-y-4 w-full max-w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <h2 className="font-semibold text-slate-900 text-lg">Staff Register</h2>
              <select
                value={workerDeptFilter}
                onChange={(e) => setWorkerDeptFilter(e.target.value)}
                className="input !py-1 text-xs !w-auto"
              >
                <option value="all">All Departments</option>
                <option value="waste">Waste Management</option>
                <option value="roads">Roads</option>
                <option value="electricity">Electricity</option>
                <option value="water">Water</option>
              </select>
            </div>

            <div className="overflow-x-auto w-full max-w-full rounded-xl border border-slate-100 bg-white shadow-sm">
              <table className="min-w-[1100px] w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-slate-500 font-semibold text-left">
                  <tr>
                    <th className="px-3 md:px-8 py-3.5 whitespace-nowrap">Name</th>
                    <th className="px-3 md:px-8 py-3.5 whitespace-nowrap">Department</th>
                    <th className="px-3 md:px-8 py-3.5 whitespace-nowrap">Status</th>
                    <th className="px-3 md:px-8 py-3.5 whitespace-nowrap">Current Duty</th>
                    <th className="px-3 md:px-8 py-3.5 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredWorkers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-slate-400 text-sm italic">
                        No field workers found.
                      </td>
                    </tr>
                  ) : (
                    filteredWorkers.map((w) => (
                      <tr key={w.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-3 md:px-8 py-4 font-semibold text-slate-800 whitespace-nowrap">{w.name}</td>
                        <td className="px-3 md:px-8 py-4 capitalize text-slate-600 whitespace-nowrap">{w.department}</td>
                        <td className="px-3 md:px-8 py-4 whitespace-nowrap">
                          <StatusBadge status={w.status} />
                        </td>
                        <td className="px-3 md:px-8 py-4 text-slate-500 text-xs whitespace-nowrap">
                          {w.currentTask || <span className="text-slate-300 italic font-normal">No assigned work</span>}
                        </td>
                        <td className="px-3 md:px-8 py-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleWorkerDelete(w.id)}
                            className="p-2 border border-slate-100 hover:border-red-100 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shadow-sm"
                            title="Dismiss Worker"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Emergency Service Dispatch */}
      {activeTab === 'emergencies' && (
        <div className="space-y-4 w-full">
          {/* Header + filter */}
          <div className="card p-4 sm:p-5 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-500" />
                  Emergency Operations Center
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time tracking of ambulance, police, and fire dispatches.
                </p>
              </div>
              <select
                value={emergencyStatusFilter}
                onChange={(e) => setEmergencyStatusFilter(e.target.value)}
                className="input !py-1.5 text-xs w-full sm:w-auto"
              >
                <option value="all">All Dispatches</option>
                <option value="dispatched">Dispatched (Active)</option>
                <option value="resolved">Resolved (Closed)</option>
              </select>
            </div>
          </div>

          {/* Main content grid — same as user's EmergencyServices */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 w-full overflow-hidden">
            <div className="lg:col-span-2 space-y-4 lg:space-y-6 w-full min-w-0">
              {/* Dispatch log */}
              <div className="card w-full overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-100">
                  <h2 className="font-semibold text-slate-900">Emergency Requests Log</h2>
                </div>
                {filteredEmergencies.length === 0 ? (
                  <p className="text-center py-8 text-slate-400 text-sm italic p-4">
                    No active or historical emergency records match the filter.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredEmergencies.map((e) => {
                      const citizen = users.find((u) => u.id === e.userId);
                      return (
                        <div key={e.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-start justify-between gap-4 w-full">
                          {/* Details section */}
                          <div className="w-full md:flex-1 min-w-0 space-y-2">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                              e.type === 'fire'
                                ? 'bg-orange-100 text-orange-700'
                                : e.type === 'ambulance'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-indigo-100 text-indigo-700'
                            }`}>
                              {e.type} Request
                            </span>
                            
                            {e.location && (
                              <p className="text-xs text-slate-500 break-all">{e.location}</p>
                            )}
                            
                            {e.description && (
                              <p className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700 break-words whitespace-pre-wrap word-break-break-word">
                                {e.description}
                              </p>
                            )}
                            
                            {citizen && (
                              <div className="border-t border-slate-100 pt-2 mt-1 text-xs text-slate-500 space-y-0.5 w-full">
                                <p className="font-semibold text-slate-600 break-words">Requested by: {citizen.name}</p>
                                <p className="break-all">{citizen.email}</p>
                                {citizen.phone && <p className="break-all">{citizen.phone}</p>}
                              </div>
                            )}
                            
                            <p className="text-[10px] text-slate-400">
                              Reported: {new Date(e.createdAt).toLocaleString()}
                            </p>
                          </div>

                          {/* Status badge & action buttons */}
                          <div className="flex flex-row items-center gap-3 shrink-0 self-start md:self-auto w-fit">
                            <StatusBadge status={e.status} />
                            <div className="flex items-center gap-1.5 shrink-0">
                              {e.status === 'dispatched' ? (
                                <button
                                  onClick={() => handleEmergencyStatus(e.id, 'resolved')}
                                  className="btn bg-green-600 hover:bg-green-700 text-white flex items-center gap-1.5 !py-1.5 !px-3 text-xs font-semibold"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleEmergencyStatus(e.id, 'dispatched')}
                                  className="btn-secondary flex items-center gap-1.5 !py-1.5 !px-3 text-xs font-semibold"
                                >
                                  <RefreshCw className="w-3 h-3" /> Re-open
                                </button>
                              )}
                              <button
                                onClick={() => handleEmergencyDelete(e.id)}
                                className="p-2 border border-slate-100 hover:border-red-100 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shadow-sm shrink-0"
                                title="Delete Emergency Request"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 lg:space-y-6 w-full min-w-0">
              {/* Hotlines */}
              <div className="card p-4 sm:p-5 w-full">
                <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-red-600" /> Emergency Hotlines
                </h2>
                <div className="space-y-3">
                  {contacts.map((c) => (
                    <a
                      key={c.id}
                      href={`tel:${c.number}`}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-4 rounded-xl bg-red-50 hover:bg-red-100 transition-colors"
                    >
                      <span className="font-medium text-slate-900 break-words">{c.name}</span>
                      <span className="text-lg font-bold text-red-600 shrink-0">{c.number}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Utility Bills Management */}
      {activeTab === 'bills' && (
        <div className="space-y-6">
          {/* Create Utility Bill Form */}
          <div className="card p-5 h-fit space-y-4">
            <h2 className="font-semibold text-slate-900 text-lg border-b border-slate-100 pb-3 flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary-600" />
              Generate Utility Bill
            </h2>
            <form onSubmit={handleBillSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Select Citizen</label>
                <select
                  value={billForm.userId}
                  onChange={(e) => setBillForm({ ...billForm, userId: e.target.value })}
                  className="input text-sm"
                  required
                >
                  <option value="">Choose a citizen...</option>
                  {users.filter((u) => u.role === 'citizen').map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Utility Type</label>
                <select
                  value={billForm.type}
                  onChange={(e) => setBillForm({ ...billForm, type: e.target.value })}
                  className="input text-sm"
                >
                  <option value="water">Water supply</option>
                  <option value="electricity">Power & Electricity</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Usage Amount</label>
                <input
                  type="text"
                  placeholder="e.g. 12,500 L or 320 kWh"
                  value={billForm.usage}
                  onChange={(e) => setBillForm({ ...billForm, usage: e.target.value })}
                  className="input text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Bill Amount (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 450"
                  value={billForm.amount}
                  onChange={(e) => setBillForm({ ...billForm, amount: e.target.value })}
                  className="input text-sm"
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Due Date</label>
                <input
                  type="date"
                  value={billForm.dueDate}
                  onChange={(e) => setBillForm({ ...billForm, dueDate: e.target.value })}
                  className="input text-sm"
                  required
                />
              </div>

              <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 py-2" disabled={submittingBill}>
                <Plus className="w-4 h-4" /> {submittingBill ? 'Generating...' : 'Generate Bill'}
              </button>
            </form>
          </div>

          {/* Utility Bills Directory */}
          <div className="card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <h2 className="font-semibold text-slate-900 text-lg">Billing Register</h2>
              <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search citizen..."
                    value={billSearch}
                    onChange={(e) => setBillSearch(e.target.value)}
                    className="input pl-10 !py-1 text-xs w-full sm:w-40"
                  />
                </div>
                <select
                  value={billTypeFilter}
                  onChange={(e) => setBillTypeFilter(e.target.value)}
                  className="input !py-1 text-xs flex-1 sm:flex-initial sm:!w-auto"
                >
                  <option value="all">All Types</option>
                  <option value="water">Water</option>
                  <option value="electricity">Electricity</option>
                </select>
                <select
                  value={billStatusFilter}
                  onChange={(e) => setBillStatusFilter(e.target.value)}
                  className="input !py-1 text-xs flex-1 sm:flex-initial sm:!w-auto"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto w-full max-w-full rounded-xl border border-slate-100 bg-white shadow-sm">
              <table className="min-w-[1250px] w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-slate-500 font-semibold text-left">
                  <tr>
                    <th className="px-3 md:px-8 py-4 whitespace-nowrap">Citizen</th>
                    <th className="px-3 md:px-8 py-4 whitespace-nowrap">Utility</th>
                    <th className="px-3 md:px-8 py-4 whitespace-nowrap">Usage</th>
                    <th className="px-3 md:px-8 py-4 whitespace-nowrap">Amount (₹)</th>
                    <th className="px-3 md:px-8 py-4 whitespace-nowrap">Due Date</th>
                    <th className="px-3 md:px-8 py-4 whitespace-nowrap">Status</th>
                    <th className="px-3 md:px-8 py-4 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBills.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-slate-400 text-sm italic">
                        No utility bills match the criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredBills.map((b) => {
                      const citizen = users.find((u) => u.id === b.userId);
                      const isEditing = editingBillId === b.id;
                      return (
                        <tr key={b.id} className={`hover:bg-slate-50/50 transition-colors ${isEditing ? 'bg-blue-50/30' : ''}`}>
                          <td className="px-3 md:px-8 py-4 whitespace-nowrap">
                            <div className="font-semibold text-slate-800">{citizen?.name || 'Unknown User'}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{citizen?.email}</div>
                          </td>
                          <td className="px-3 md:px-8 py-4 capitalize text-slate-600 whitespace-nowrap">{b.type}</td>
                          <td className="px-3 md:px-8 py-4 whitespace-nowrap">
                            {isEditing ? (
                              <input
                                type="text"
                                className="input !py-1 !px-2 text-xs w-28 inline-block whitespace-nowrap"
                                value={editBillForm.usage}
                                onChange={(e) => setEditBillForm({ ...editBillForm, usage: e.target.value })}
                                placeholder={b.type === 'water' ? 'e.g. 12,500 L' : 'e.g. 320 kWh'}
                              />
                            ) : (
                              <span className="text-xs text-slate-500 font-medium whitespace-nowrap">{b.usage || 'N/A'}</span>
                            )}
                          </td>
                          <td className="px-3 md:px-8 py-4 whitespace-nowrap">
                            {isEditing ? (
                              <input
                                type="number"
                                className="input !py-1 !px-2 text-xs w-24 inline-block whitespace-nowrap"
                                value={editBillForm.amount}
                                onChange={(e) => setEditBillForm({ ...editBillForm, amount: e.target.value })}
                                min="0"
                              />
                            ) : (
                              <span className="font-semibold text-slate-900 whitespace-nowrap">₹{b.amount}</span>
                            )}
                          </td>
                          <td className="px-3 md:px-8 py-4 whitespace-nowrap">
                            {isEditing ? (
                              <input
                                type="date"
                                className="input !py-1 !px-2 text-xs w-32 inline-block whitespace-nowrap"
                                value={editBillForm.dueDate}
                                onChange={(e) => setEditBillForm({ ...editBillForm, dueDate: e.target.value })}
                              />
                            ) : (
                              <span className="text-xs text-slate-500 font-medium whitespace-nowrap">{b.dueDate}</span>
                            )}
                          </td>
                          <td className="px-3 md:px-8 py-4 whitespace-nowrap">
                            <StatusBadge status={b.status} />
                            {b.status === 'paid' && b.paidAt && (
                              <div className="text-[9px] text-slate-400 mt-0.5 whitespace-nowrap">Paid: {new Date(b.paidAt).toLocaleDateString()}</div>
                            )}
                          </td>
                          <td className="px-3 md:px-8 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => handleBillUpdate(b.id)}
                                    disabled={savingBill}
                                    className="btn bg-blue-600 hover:bg-blue-700 text-white !py-1 !px-2.5 text-xs font-semibold flex items-center gap-1 shrink-0"
                                  >
                                    <Save className="w-3.5 h-3.5" /> {savingBill ? 'Saving...' : 'Save'}
                                  </button>
                                  <button
                                    onClick={() => setEditingBillId(null)}
                                    className="btn-secondary !py-1 !px-2.5 text-xs flex items-center gap-1 shrink-0"
                                  >
                                    <X className="w-3.5 h-3.5" /> Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingBillId(b.id);
                                      setEditBillForm({ usage: b.usage, amount: b.amount, dueDate: b.dueDate });
                                    }}
                                    className="btn-secondary !py-1 !px-2 text-xs flex items-center gap-1 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 shrink-0"
                                    title="Edit Usage & Amount"
                                  >
                                    <Pencil className="w-3.5 h-3.5" /> Edit
                                  </button>
                                  {b.status === 'pending' ? (
                                    <button
                                      onClick={() => handleAdminPayBill(b.id)}
                                      className="btn-secondary !py-1 !px-2 text-xs font-semibold hover:bg-green-50 hover:text-green-700 hover:border-green-300 shrink-0"
                                    >
                                      Mark Paid
                                    </button>
                                  ) : (
                                    <span className="text-xs text-green-600 font-semibold italic shrink-0">Recorded</span>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Public Transport Management */}
      {activeTab === 'transport' && (
        <div className="space-y-6">
          {/* Create / Edit Bus Route Form */}
          <div className="card p-5 h-fit space-y-4">
            <h2 className="font-semibold text-slate-900 text-lg border-b border-slate-100 pb-3 flex items-center gap-2">
              <Bus className="w-5 h-5 text-primary-600" />
              {editingRouteId ? 'Edit Bus Route' : 'Create Bus Route'}
            </h2>
            <form onSubmit={handleCreateRoute} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Route Number</label>
                  <input
                    className="input text-sm"
                    placeholder="e.g. 101 or 402"
                    value={routeForm.number}
                    onChange={(e) => setRouteForm({ ...routeForm, number: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Frequency</label>
                  <input
                    className="input text-sm"
                    placeholder="e.g. Every 15 min"
                    value={routeForm.frequency}
                    onChange={(e) => setRouteForm({ ...routeForm, frequency: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Route Name</label>
                <input
                  className="input text-sm"
                  placeholder="e.g. Central Station - Airport Express"
                  value={routeForm.name}
                  onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Stops (Comma Separated)</label>
                <input
                  className="input text-sm"
                  placeholder="e.g. Stop A, Stop B, Stop C, Stop D"
                  value={routeForm.stops}
                  onChange={(e) => setRouteForm({ ...routeForm, stops: e.target.value })}
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submittingRoute}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 py-2"
                >
                  <Plus className="w-4 h-4" />
                  {submittingRoute ? 'Saving...' : (editingRouteId ? 'Update Route' : 'Create Bus Route')}
                </button>
                {editingRouteId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRouteId(null);
                      setRouteForm({ number: '', name: '', stops: '', frequency: 'Every 15 min' });
                    }}
                    className="btn-secondary px-4 py-2 text-xs"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Bus Routes Directory */}
          <div className="card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-semibold text-slate-900 text-lg">Bus Routes Registry</h2>
                <p className="text-xs text-slate-500">{filteredRoutes.length} of {routes.length} bus routes active</p>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search route number, name, or stop..."
                  value={routeSearch}
                  onChange={(e) => setRouteSearch(e.target.value)}
                  className="input pl-10 !py-1.5 text-xs w-full"
                />
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredRoutes.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm italic">
                  No bus routes match your search criteria.
                </div>
              ) : (
                filteredRoutes.map((r) => {
                  const stopsArray = Array.isArray(r.stops) ? r.stops : (r.stops?.stops || []);
                  const isEditing = editingRouteId === r.id;
                  return (
                    <div key={r.id} className={`p-4 sm:p-5 transition-colors ${isEditing ? 'bg-blue-50/40 rounded-xl' : 'hover:bg-slate-50/50'}`}>
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="bg-primary-100 text-primary-800 text-xs font-bold px-2 py-0.5 rounded">
                              Route {r.number}
                            </span>
                            <h3 className="font-semibold text-slate-900 text-base">{r.name}</h3>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                            <span>Frequency: <strong className="text-slate-700">{r.frequency}</strong></span>
                            {r.price !== undefined && r.price !== null && (
                              <span>Base Fare: <strong className="text-slate-700">₹{r.price}</strong></span>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons: Edit & Delete */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleStartEditRoute(r)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-md transition-colors"
                            title="Edit Bus Route"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteRoute(r.id)}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors"
                            title="Delete Bus Route"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>

                      {/* Route Stops */}
                      <div className="flex flex-wrap gap-1.5 items-center mt-2">
                        <span className="text-xs text-slate-400 font-medium mr-1">Stops:</span>
                        {stopsArray.map((stop, i) => (
                          <span key={`${stop}-${i}`} className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200/60 font-medium">
                            {i > 0 && <span className="text-slate-400 mr-1">→</span>}
                            {stop}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Issued Tickets Directory */}
          <div className="card p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-semibold text-slate-900 text-lg">Issued Bus Tickets Registry</h2>
                <p className="text-xs text-slate-500">{filteredTickets.length} of {tickets.length} bus tickets</p>
              </div>
              <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search citizen or route..."
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                    className="input pl-10 !py-1 text-xs w-full"
                  />
                </div>
                <select
                  value={ticketStatusFilter}
                  onChange={(e) => setTicketStatusFilter(e.target.value)}
                  className="input !py-1 text-xs sm:!w-auto"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="used">Used</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto w-full rounded-xl border border-slate-100 bg-white shadow-sm">
              <table className="min-w-[900px] w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-slate-500 font-semibold text-left">
                  <tr>
                    <th className="px-4 py-3">Citizen</th>
                    <th className="px-4 py-3">Route</th>
                    <th className="px-4 py-3">From → To</th>
                    <th className="px-4 py-3">Price (₹)</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Purchased</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-slate-400 text-sm italic">
                        No issued tickets match your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTickets.map((t) => {
                      const citizen = users.find((u) => u.id === t.userId);
                      const isEditing = editingTicketId === t.id;
                      return (
                        <tr key={t.id} className={`hover:bg-slate-50/50 transition-colors ${isEditing ? 'bg-blue-50/30' : ''}`}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="font-semibold text-slate-800">{citizen?.name || 'User'}</div>
                            <div className="text-[10px] text-slate-400">{citizen?.email || t.userId}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-700">
                            {isEditing ? (
                              <input
                                type="text"
                                className="input !py-1 !px-2 text-xs w-24"
                                value={editTicketForm.route}
                                onChange={(e) => setEditTicketForm({ ...editTicketForm, route: e.target.value })}
                              />
                            ) : (
                              `Route ${t.route}`
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  className="input !py-1 !px-2 text-xs w-24"
                                  value={editTicketForm.from}
                                  onChange={(e) => setEditTicketForm({ ...editTicketForm, from: e.target.value })}
                                  placeholder="From"
                                />
                                <span className="text-slate-400">→</span>
                                <input
                                  type="text"
                                  className="input !py-1 !px-2 text-xs w-24"
                                  value={editTicketForm.to}
                                  onChange={(e) => setEditTicketForm({ ...editTicketForm, to: e.target.value })}
                                  placeholder="To"
                                />
                              </div>
                            ) : (
                              <span className="text-slate-600 font-medium">{t.from} → {t.to}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {isEditing ? (
                              <input
                                type="number"
                                className="input !py-1 !px-2 text-xs w-20"
                                value={editTicketForm.price}
                                onChange={(e) => setEditTicketForm({ ...editTicketForm, price: e.target.value })}
                                min="0"
                              />
                            ) : (
                              <span className="font-bold text-slate-900">₹{t.price}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {isEditing ? (
                              <select
                                className="input !py-1 !px-2 text-xs w-28"
                                value={editTicketForm.status}
                                onChange={(e) => setEditTicketForm({ ...editTicketForm, status: e.target.value })}
                              >
                                <option value="active">Active</option>
                                <option value="used">Used</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            ) : (
                              <StatusBadge status={t.status} />
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-400">
                            {t.purchasedAt ? new Date(t.purchasedAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => handleUpdateTicket(t.id)}
                                    disabled={savingTicket}
                                    className="btn bg-blue-600 hover:bg-blue-700 text-white !py-1 !px-2.5 text-xs font-semibold flex items-center gap-1 shrink-0"
                                  >
                                    <Save className="w-3.5 h-3.5" /> {savingTicket ? 'Saving...' : 'Save'}
                                  </button>
                                  <button
                                    onClick={() => setEditingTicketId(null)}
                                    className="btn-secondary !py-1 !px-2.5 text-xs flex items-center gap-1 shrink-0"
                                  >
                                    <X className="w-3.5 h-3.5" /> Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingTicketId(t.id);
                                      setEditTicketForm({
                                        route: t.route,
                                        from: t.from,
                                        to: t.to,
                                        price: t.price,
                                        status: t.status || 'active'
                                      });
                                    }}
                                    className="btn-secondary !py-1 !px-2.5 text-xs flex items-center gap-1 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 shrink-0"
                                    title="Edit Ticket"
                                  >
                                    <Pencil className="w-3.5 h-3.5" /> Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAdminTicket(t.id)}
                                    className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 rounded-md transition-colors shrink-0"
                                    title="Delete Ticket"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
