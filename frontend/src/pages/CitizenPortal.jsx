import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Bell, CreditCard, FileText, Phone, Plus, Trash2 } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/StatusBadge';
import StatCard from '../components/StatCard';
import { PortalSkeleton } from '../components/common/Skeletons';

export default function CitizenPortal() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [complaints, setComplaints] = useState([]);
  const [bills, setBills] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'pothole', title: '', description: '', location: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    const promises = [
      api.complaints.list().catch(() => []),
      api.announcements.list().catch(() => []),
      api.emergency.contacts().catch(() => [])
    ];
    if (user) {
      promises.push(api.utilities.bills().catch(() => []));
    }
    if (isAdmin) {
      promises.push(api.auth.getUsers().catch(() => []));
    }
    Promise.all(promises)
      .then(([c, a, ct, b, u]) => {
        setComplaints(c);
        setAnnouncements(a);
        setContacts(ct);
        if (b) setBills(b);
        if (u) setUsers(u);
      })
      .finally(() => setLoading(false));
  }, [user, isAdmin]);

  const pendingBills = (bills || []).filter((b) => b.status === 'pending');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    try {
      const created = await api.complaints.create(form);
      setComplaints([created, ...complaints]);
      setForm({ type: 'pothole', title: '', description: '', location: '' });
      setShowForm(false);
      toast('Complaint submitted successfully');
    } catch (err) {
      setError(err.message);
      toast(err.message, 'error');
    }
  };

  const handleDeleteComplaint = async (id) => {
    if (!window.confirm('Are you sure you want to delete this complaint?')) return;
    try {
      await api.complaints.delete(id);
      setComplaints(complaints.filter((c) => c.id !== id));
      toast('Complaint deleted successfully');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  if (loading) return <PortalSkeleton />;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Citizen Portal</h1>
        <p className="page-subtitle">Report issues, track complaints, and view announcements</p>
      </div>

      {!user && (
        <div className="card p-6 mb-6 text-center">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">
            Please <Link to="/login" className="font-semibold underline">sign in</Link> to report issues, track complaints, and pay bills.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        <StatCard title="My Complaints" value={complaints.length} icon={FileText} color="primary" />
        <StatCard title="Pending Bills" value={pendingBills.length} icon={CreditCard} color="amber" />
        <StatCard title="Announcements" value={announcements.length} icon={Bell} color="purple" />
        <StatCard title="Emergency Contacts" value={contacts.length} icon={Phone} color="red" />
      </div>

      <div className={`grid ${(!user || !isAdmin) ? 'lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'} gap-6 mb-6`}>
        {(!user || !isAdmin) ? (
          <>
            <div className="lg:col-span-2 space-y-6">
              <div className="card">
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                  <h2 className="font-semibold text-slate-900">Report an Issue</h2>
                  {user && (
                    <button onClick={() => setShowForm(!showForm)} className="btn-primary !py-2 !px-3">
                      <Plus className="w-4 h-4" /> New Report
                    </button>
                  )}
                </div>

                {showForm && (
                  <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Issue Type</label>
                        <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                          <option value="pothole">Pothole</option>
                          <option value="street_light">Street Light</option>
                          <option value="garbage">Garbage</option>
                          <option value="water_outage">Water Outage</option>
                          <option value="power_outage">Power Outage</option>
                        </select>
                      </div>
                      <div>
                        <label className="label">Location</label>
                        <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required placeholder="Street, area" />
                      </div>
                    </div>
                    <div>
                      <label className="label">Title</label>
                      <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Brief description" />
                    </div>
                    <div>
                      <label className="label">Details</label>
                      <textarea className="input min-h-[80px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required placeholder="Describe the issue..." />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="btn-primary">Submit Report</button>
                      <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="card p-5">
                <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary-600" /> Announcements
                </h2>
                <div className="space-y-3">
                  {announcements.map((a) => (
                    <div key={a.id} className="p-3 rounded-lg bg-slate-50">
                      <p className="font-medium text-sm text-slate-900">{a.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{a.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-5">
                <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-red-600" /> Emergency Contacts
                </h2>
                <div className="space-y-2">
                  {contacts.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-red-50">
                      <span className="text-sm font-medium text-slate-900">{c.name}</span>
                      <a href={`tel:${c.number}`} className="text-sm font-bold text-red-600">{c.number}</a>
                    </div>
                  ))}
                </div>
              </div>

              {user && pendingBills.length > 0 && (
                <div className="card p-5">
                  <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-amber-600" /> Pending Bills
                  </h2>
                  {pendingBills.map((b) => (
                    <Link key={b.id} to="/utilities" className="flex items-center justify-between p-3 rounded-lg bg-amber-50 hover:bg-amber-100/75 hover:shadow-sm transition-all mb-2 block">
                      <div>
                        <p className="text-sm font-medium capitalize text-slate-900">{b.type}</p>
                        <p className="text-xs text-slate-500">Due: {b.dueDate}</p>
                      </div>
                      <span className="font-bold text-amber-700">₹{b.amount}</span>
                    </Link>
                  ))}
                  <Link to="/utilities" className="text-sm text-primary-600 font-medium hover:underline mt-2 inline-block">Pay bills &rarr;</Link>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="card p-5">
              <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary-600" /> Announcements
              </h2>
              <div className="space-y-3">
                {announcements.map((a) => (
                  <div key={a.id} className="p-3 rounded-lg bg-slate-50">
                    <p className="font-medium text-sm text-slate-900">{a.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{a.content}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Phone className="w-4 h-4 text-red-600" /> Emergency Contacts
              </h2>
              <div className="space-y-2">
                {contacts.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-red-50">
                    <span className="text-sm font-medium text-slate-900">{c.name}</span>
                    <a href={`tel:${c.number}`} className="text-sm font-bold text-red-600">{c.number}</a>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-slate-900 mb-4">Track Complaint Status</h3>
        {complaints.length === 0 ? (
          <p className="text-sm text-slate-500">
            {isAdmin ? 'No complaints registered in the system.' : 'No complaints yet. Report an issue above.'}
          </p>
        ) : (
          <div className="space-y-3">
            {complaints.map((c) => {
              const citizen = isAdmin ? users.find((u) => u.id === c.userId) : null;
              return (
                <div key={c.id} className="p-4 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors bg-white">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 break-words">{c.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 capitalize break-words">{c.type.replace('_', ' ')} · {c.location}</p>
                      {isAdmin && citizen && (
                        <p className="text-xs text-slate-400 mt-1 break-words">
                          Reported by: <span className="font-semibold text-slate-600">{citizen.name}</span> ({citizen.email}{citizen.phone ? ` · ${citizen.phone}` : ''})
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <StatusBadge status={c.status} />
                      {c.status === 'pending' && (
                        <button
                          onClick={() => handleDeleteComplaint(c.id)}
                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
                          title="Delete Complaint"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  {c.assignedTo && (
                    <p className="text-xs text-slate-400 mt-2">Assigned to: {c.assignedTo}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
