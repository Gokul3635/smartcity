import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Flame, Phone, Shield, Siren, Trash2 } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/StatusBadge';
import { EmergencySkeleton } from '../components/common/Skeletons';

const emergencyTypes = [
  { value: 'ambulance', label: 'Ambulance', icon: Siren, color: 'bg-red-500' },
  { value: 'fire', label: 'Fire Service', icon: Flame, color: 'bg-orange-500' },
  { value: 'police', label: 'Police Alert', icon: Shield, color: 'bg-blue-500' }
];

export default function EmergencyServices() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [contacts, setContacts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ type: 'ambulance', location: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const promises = [api.emergency.contacts()];
    if (user) promises.push(api.emergency.requests().catch(() => []));
    if (isAdmin) promises.push(api.auth.getUsers().catch(() => []));
    Promise.all(promises)
      .then(([c, r, u]) => {
        setContacts(c);
        if (r) setRequests(r);
        if (isAdmin && u) setUsers(u);
      })
      .finally(() => setLoading(false));
  }, [user, isAdmin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    setSuccess(false);
    try {
      const req = await api.emergency.create(form);
      setRequests([req, ...requests]);
      setForm({ type: 'ambulance', location: '', description: '' });
      setSuccess(true);
      toast('Emergency request dispatched');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmergencyDelete = async (emergencyId) => {
    if (!window.confirm('Are you sure you want to permanently delete this emergency request record?')) return;
    try {
      await api.emergency.delete(emergencyId);
      setRequests(requests.filter((r) => r.id !== emergencyId));
      toast('Emergency request record successfully deleted');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  if (loading) return <EmergencySkeleton />;

  return (
    <div className="w-full">
      {/* Req 16: Responsive page header */}
      <div className="page-header">
        <h1 className="page-title text-2xl sm:text-3xl">Emergency Services</h1>
        <p className="page-subtitle text-sm sm:text-base">Ambulance requests, fire service, and police emergency alerts</p>
      </div>

      {/* Req 1: Emergency type selector grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full mb-6 overflow-hidden">
        {emergencyTypes.map(({ value, label, icon: Icon, color }) => (
          <button
            key={value}
            onClick={() => setForm({ ...form, type: value })}
            className={`card p-4 sm:p-5 w-full text-left transition-all ${form.type === value ? 'ring-2 ring-primary-500 border-primary-300' : 'hover:shadow-md'}`}
          >
            {/* Req 2: Each service card */}
            <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <p className="font-semibold text-slate-900">{label}</p>
          </button>
        ))}
      </div>

      {/* Req 3: Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 w-full overflow-hidden">
        <div className="lg:col-span-2 space-y-4 lg:space-y-6 w-full min-w-0">
          {isAdmin ? (
            /* Render emergency requests log directly here for admins */
            requests.length > 0 ? (
              <div className="card w-full overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-100">
                  <h2 className="font-semibold text-slate-900">Emergency Requests Log</h2>
                </div>
                <div className="divide-y divide-slate-100">
                  {requests.map((r) => {
                    const citizen = users.find((u) => u.id === r.userId);
                    return (
                      <div key={r.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-start justify-between gap-4 w-full">
                        <div className="w-full md:flex-1 min-w-0 space-y-2">
                          <p className="font-semibold capitalize text-slate-900 break-words">{r.type} Request</p>
                          {r.location && <p className="text-xs text-slate-500 break-all">{r.location}</p>}
                          {r.description && (
                            <p className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700 break-words whitespace-pre-wrap word-break-break-word">
                              {r.description}
                            </p>
                          )}
                          {citizen && (
                            <div className="border-t border-slate-100 pt-2 mt-1 text-xs text-slate-500 space-y-0.5 w-full">
                              <p className="font-semibold text-slate-600 break-words">Requested by: {citizen.name}</p>
                              <p className="break-all">{citizen.email}</p>
                              {citizen.phone && <p className="break-all">{citizen.phone}</p>}
                            </div>
                          )}
                          <p className="text-[10px] text-slate-400">{new Date(r.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="flex flex-row items-center gap-3 shrink-0 self-start md:self-auto w-fit">
                          <StatusBadge status={r.status} />
                          <button
                            onClick={() => handleEmergencyDelete(r.id)}
                            className="p-2 border border-slate-100 hover:border-red-100 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shadow-sm shrink-0"
                            title="Delete Emergency Request"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="card p-5 sm:p-8 w-full text-center">
                <p className="text-slate-500">No active or historical emergency records.</p>
              </div>
            )
          ) : user ? (
            /* Req 4: Request form card for citizens */
            <div className="card p-4 sm:p-6 w-full">
              <h2 className="font-semibold text-slate-900 mb-4">Request Emergency Service</h2>
              {success && (
                <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm">
                  Emergency request dispatched successfully. Help is on the way.
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Service Type</label>
                  <select
                    className="input w-full text-sm sm:text-base"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    {emergencyTypes.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Location</label>
                  <input
                    className="input w-full text-sm sm:text-base"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    required
                    placeholder="Your current address or landmark"
                  />
                </div>
                <div>
                  <label className="label">Description</label>
                  <textarea
                    className="input w-full text-sm sm:text-base min-h-[80px]"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe the emergency..."
                  />
                </div>
                <button type="submit" className="btn-danger w-full sm:w-auto py-3" disabled={submitting}>
                  {submitting ? 'Dispatching...' : 'Send Emergency Request'}
                </button>
              </form>
            </div>
          ) : (
            <div className="card p-5 sm:p-8 w-full text-center">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500"><Link to="/login" className="text-primary-600 font-medium">Sign in</Link> to submit emergency requests.</p>
            </div>
          )}
        </div>

        <div className="space-y-4 lg:space-y-6 w-full min-w-0">
          {/* Req 7: Hotline card */}
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

      {user && !isAdmin && requests.length > 0 && (
        /* Req 9: Request history card for citizens */
        <div className="card w-full overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">My Requests</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {requests.map((r) => (
              <div key={r.id} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-start justify-between gap-4 w-full">
                <div className="w-full md:flex-1 min-w-0 space-y-2">
                  <p className="font-semibold capitalize text-slate-900 break-words">{r.type} Request</p>
                  {r.location && <p className="text-xs text-slate-500 break-all">{r.location}</p>}
                  {r.description && (
                    <p className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700 break-words whitespace-pre-wrap word-break-break-word">
                      {r.description}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-400">{new Date(r.createdAt).toLocaleString()}</p>
                </div>
                <div className="shrink-0 self-start md:self-auto w-fit">
                  <StatusBadge status={r.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
