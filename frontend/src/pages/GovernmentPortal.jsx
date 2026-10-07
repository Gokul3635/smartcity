import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ClipboardList, Search, Users, Wrench } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/StatusBadge';
import StatCard from '../components/StatCard';
import { PortalSkeleton } from '../components/common/Skeletons';

export default function GovernmentPortal() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [complaints, setComplaints] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    if (!isAdmin) { setLoading(false); return; }
    Promise.all([api.complaints.list(), api.workers.list(), api.auth.getUsers().catch(() => [])])
      .then(([c, w, u]) => { setComplaints(c); setWorkers(w); setUsers(u); })
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const updateComplaint = async (id, updates) => {
    try {
      const updated = await api.complaints.update(id, updates);
      setComplaints(complaints.map((c) => (c.id === id ? updated : c)));
      toast('Complaint updated');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      const matchesSearch = !search ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.location.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchesType = typeFilter === 'all' || c.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [complaints, search, statusFilter, typeFilter]);

  if (!user) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">Please <Link to="/login" className="text-primary-600 font-medium">sign in</Link> as an admin to access the government portal.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <p className="text-slate-500">Access restricted to government administrators.</p>
      </div>
    );
  }

  if (loading) return <PortalSkeleton />;

  const pending = complaints.filter((c) => c.status === 'pending').length;
  const active = complaints.filter((c) => c.status === 'in_progress').length;
  const resolved = complaints.filter((c) => c.status === 'resolved').length;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Government Portal</h1>
        <p className="page-subtitle">Manage complaints, assign workers, and monitor city services</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        <StatCard title="Total Complaints" value={complaints.length} icon={ClipboardList} color="primary" />
        <StatCard title="Pending" value={pending} icon={AlertCircle} color="amber" />
        <StatCard title="In Progress" value={active} icon={Wrench} color="cyan" />
        <StatCard title="Resolved" value={resolved} icon={Users} color="green" />
      </div>

      <div className="space-y-6">
        <div className="card">
          <div className="p-5 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="font-semibold text-slate-900">Complaints</h2>
              <span className="text-sm text-slate-500">{filtered.length} of {complaints.length}</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  className="input pl-10"
                  placeholder="Search by title or location..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select className="input sm:w-36" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
              <select className="input sm:w-36" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="all">All Types</option>
                <option value="pothole">Pothole</option>
                <option value="street_light">Street Light</option>
                <option value="garbage">Garbage</option>
                <option value="water_outage">Water Outage</option>
                <option value="power_outage">Power Outage</option>
              </select>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <p className="p-5 text-sm text-slate-500">No complaints match your filters.</p>
            ) : filtered.map((c) => {
              const citizen = users.find((u) => u.id === c.userId);
              return (
                <div key={c.id} className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 break-words">{c.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 capitalize break-words">{c.type.replace('_', ' ')} · {c.location}</p>
                      {citizen && (
                        <p className="text-xs text-slate-400 mt-1 break-words">
                          Reported by: <span className="font-semibold text-slate-600">{citizen.name}</span> ({citizen.email}{citizen.phone ? ` · ${citizen.phone}` : ''})
                        </p>
                      )}
                      <p className="text-sm text-slate-600 mt-2 break-words">{c.description}</p>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <select
                    className="input !w-auto !py-1.5 text-xs"
                    value={c.status}
                    onChange={(e) => updateComplaint(c.id, { status: e.target.value })}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  <select
                    className="input !w-auto !py-1.5 text-xs"
                    value={c.assignedTo || ''}
                    onChange={(e) => updateComplaint(c.id, { assignedTo: e.target.value || null, status: e.target.value ? 'in_progress' : c.status })}
                  >
                    <option value="">Assign worker...</option>
                    {workers.map((w) => (
                      <option key={w.id} value={w.name}>{w.name} ({w.department})</option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
          </div>
        </div>

        <div className="card p-5">
            <h2 className="font-semibold text-slate-900 mb-4">Field Workers</h2>
            <div className="space-y-3">
              {workers.map((w) => (
                <div key={w.id} className="p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{w.name}</p>
                    <StatusBadge status={w.status} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1 capitalize">{w.department} dept.</p>
                  {w.currentTask && <p className="text-xs text-slate-400 mt-1">{w.currentTask}</p>}
                </div>
              ))}
            </div>
          </div>

          <Link to="/admin" className="card p-5 block hover:shadow-md transition-shadow">
            <h2 className="font-semibold text-slate-900 mb-1">Admin & Analytics</h2>
            <p className="text-sm text-slate-500">Admin control panel with city-wide analytics, system management, and performance reports.</p>
            <span className="text-sm text-primary-600 font-medium mt-2 inline-block">Open Admin Panel &rarr;</span>
          </Link>
      </div>
    </div>
  );
}
