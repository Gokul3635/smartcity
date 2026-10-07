import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Droplets, Receipt, TrendingUp, Zap, Megaphone, Plus, CheckCircle2, AlertTriangle, Clock, MapPin, Activity, Trash2 } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/StatusBadge';
import StatCard from '../components/StatCard';
import { UtilitySkeleton } from '../components/common/Skeletons';

export default function WaterElectricity() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [form, setForm] = useState({ type: 'water_outage', title: '', description: '', location: '' });
  const [submittingOutage, setSubmittingOutage] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const promises = [
      isAdmin ? api.utilities.adminListBills().catch(() => []) : api.utilities.bills(),
      api.announcements.list().catch(() => []),
      api.complaints.list().catch(() => [])
    ];
    if (isAdmin) {
      promises.push(api.auth.getUsers().catch(() => []));
    }
    Promise.all(promises)
      .then(([b, a, c, usrs]) => {
        setBills(b);
        setAnnouncements(a.filter((ann) => ann.category === 'utilities'));
        setComplaints(c.filter((comp) => comp.type === 'water_outage' || comp.type === 'power_outage'));
        if (isAdmin && usrs) {
          setUsers(usrs);
          const firstCitizen = usrs.find((u) => u.role === 'citizen');
          if (firstCitizen) {
            setSelectedUserId(firstCitizen.id);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [user, isAdmin]);

  const payBill = async (id) => {
    setPaying(id);
    try {
      const updated = await api.utilities.payBill(id);
      setBills(bills.map((b) => (b.id === id ? updated : b)));
      toast('Bill paid successfully');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setPaying(null);
    }
  };

  const handleReportOutage = async (e) => {
    e.preventDefault();
    if (!user) return;
    setFormError('');
    setSubmittingOutage(true);
    try {
      const created = await api.complaints.create(form);
      setComplaints([created, ...complaints]);
      setForm({ type: 'water_outage', title: '', description: '', location: '' });
      setShowForm(false);
      toast('Outage reported successfully');
    } catch (err) {
      setFormError(err.message);
      toast(err.message, 'error');
    } finally {
      setSubmittingOutage(false);
    }
  };

  const handleDeleteOutage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this outage report?')) return;
    try {
      await api.complaints.delete(id);
      setComplaints(complaints.filter((c) => c.id !== id));
      toast('Outage report deleted successfully');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  if (!user) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">Please <Link to="/login" className="text-primary-600 font-medium">sign in</Link> to view and pay utility bills.</p>
      </div>
    );
  }

  if (loading) return <UtilitySkeleton />;

  const userBills = isAdmin
    ? bills.filter((b) => b.userId === selectedUserId)
    : bills;

  const pending = userBills.filter((b) => b.status === 'pending');
  const paid = userBills.filter((b) => b.status === 'paid');

  // Derive live usage from actual bills (most recent of each type)
  const allBillsSorted = [...userBills].sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
  const latestWaterBill = allBillsSorted.find((b) => b.type === 'water');
  const latestElecBill = allBillsSorted.find((b) => b.type === 'electricity');
  const derivedUsage = {
    water: {
      current: latestWaterBill ? latestWaterBill.usage : 'N/A',
      amount: latestWaterBill ? `₹${latestWaterBill.amount}` : '—',
      status: latestWaterBill?.status || null
    },
    electricity: {
      current: latestElecBill ? latestElecBill.usage : 'N/A',
      amount: latestElecBill ? `₹${latestElecBill.amount}` : '—',
      status: latestElecBill?.status || null
    }
  };

  // Check grid health based on active complaints
  const activeWaterOutages = complaints.filter((c) => c.type === 'water_outage' && c.status !== 'resolved');
  const activePowerOutages = complaints.filter((c) => c.type === 'power_outage' && c.status !== 'resolved');

  const waterGridStatus = activeWaterOutages.length > 0 ? 'outage' : 'healthy';
  const powerGridStatus = activePowerOutages.length > 0 ? 'outage' : 'healthy';

  const selectedCitizen = users.find((u) => u.id === selectedUserId);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Water & Electricity</h1>
        <p className="page-subtitle">Monitor usage, view bills, and manage payments</p>
      </div>

      {isAdmin && (
        <div className="mb-6 p-4 bg-primary-50 rounded-xl border border-primary-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-primary-900 text-sm">Admin Monitor Mode</h2>
            <p className="text-primary-700 text-xs mt-0.5">Select a citizen to view their live utility stats and billing history.</p>
          </div>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="input !w-auto text-sm bg-white"
          >
            <option value="">Select Citizen...</option>
            {users.filter(u => u.role === 'citizen').map(u => (
              <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-8">
          <StatCard
            title={isAdmin ? `Water Usage (${selectedCitizen?.name || 'No Citizen Selected'})` : "Water Usage (Latest Bill)"}
            value={derivedUsage.water.current}
            subtitle={latestWaterBill ? `Amount: ${derivedUsage.water.amount} · ${latestWaterBill.status === 'paid' ? 'Paid' : 'Pending'}` : 'No bill generated yet'}
            icon={Droplets}
            color="cyan"
          />
          <StatCard
            title={isAdmin ? `Electricity Usage (${selectedCitizen?.name || 'No Citizen Selected'})` : "Electricity Usage (Latest Bill)"}
            value={derivedUsage.electricity.current}
            subtitle={latestElecBill ? `Amount: ${derivedUsage.electricity.amount} · ${latestElecBill.status === 'paid' ? 'Paid' : 'Pending'}` : 'No bill generated yet'}
            icon={Zap}
            color="amber"
          />
        </div>

      {/* Grid status indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-8">
        <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
          waterGridStatus === 'healthy' 
            ? 'bg-emerald-50/50 border-emerald-100' 
            : 'bg-rose-50/50 border-rose-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              waterGridStatus === 'healthy' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}>
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Water Supply Grid</p>
              <h3 className="font-bold text-slate-800 mt-0.5">
                {waterGridStatus === 'healthy' ? 'Fully Operational' : 'Reported Outage'}
              </h3>
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            waterGridStatus === 'healthy' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
          }`}>
            {waterGridStatus === 'healthy' ? 'Active' : `${activeWaterOutages.length} Issue(s)`}
          </span>
        </div>

        <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
          powerGridStatus === 'healthy' 
            ? 'bg-emerald-50/50 border-emerald-100' 
            : 'bg-rose-50/50 border-rose-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              powerGridStatus === 'healthy' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}>
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Power Grid Network</p>
              <h3 className="font-bold text-slate-800 mt-0.5">
                {powerGridStatus === 'healthy' ? 'Fully Operational' : 'Reported Outage'}
              </h3>
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            powerGridStatus === 'healthy' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
          }`}>
            {powerGridStatus === 'healthy' ? 'Active' : `${activePowerOutages.length} Issue(s)`}
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <div className="p-5 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-600" /> {isAdmin ? "Citizen's Pending Bills" : "Pending Bills"}
            </h2>
          </div>
          {pending.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">
              {isAdmin ? "No pending bills for this citizen." : "No pending bills. You're all caught up!"}
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {pending.map((b) => (
                <div key={b.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium capitalize text-slate-900">{b.type} Bill</p>
                    <p className="text-sm text-slate-500 break-words">Usage: {b.usage} · Due: {b.dueDate}</p>
                    <p className="text-lg font-bold text-slate-900 mt-1">₹{b.amount}</p>
                  </div>
                  <div className="shrink-0 self-start sm:self-auto">
                    {isAdmin ? (
                      <span className="badge bg-amber-100 text-amber-800 font-semibold text-xs">Unpaid</span>
                    ) : (
                      <button onClick={() => payBill(b.id)} className="btn-primary !py-2" disabled={paying === b.id}>
                        {paying === b.id ? 'Processing...' : 'Pay Now'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="p-5 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" /> Payment History
            </h2>
          </div>
          {paid.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">No payment history found.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {paid.map((b) => (
                <div key={b.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium capitalize text-slate-900">{b.type} Bill</p>
                    <p className="text-sm text-slate-500 break-words">Usage: {b.usage}</p>
                    <p className="text-xs text-slate-400 mt-1">Paid: {new Date(b.paidAt).toLocaleDateString()}</p>
                  </div>
                  <div className="shrink-0 self-start sm:self-auto text-right">
                    <p className="font-bold text-slate-900">₹{b.amount}</p>
                    <StatusBadge status="paid" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Outage status section */}
      <div className="space-y-6">
        <div className="card">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500" /> Outage Reports
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isAdmin ? 'Track city-wide water or electricity outages' : 'Track and report local water or electricity outages'}
                </p>
              </div>
              {!isAdmin && (
                <button onClick={() => setShowForm(!showForm)} className="btn-primary !py-2 !px-3 text-xs flex items-center gap-1 bg-gradient-to-r from-rose-500 to-rose-600 border-rose-500 hover:from-rose-600 hover:to-rose-700 shadow-sm transition-all duration-200">
                  <Plus className="w-4 h-4" /> Report Outage
                </button>
              )}
            </div>

            {showForm && !isAdmin && (
              <form onSubmit={handleReportOutage} className="p-5 border-b border-slate-100 space-y-4 bg-slate-50/50">
                {formError && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{formError}</div>}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label text-xs">Outage Type</label>
                    <select className="input text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                      <option value="water_outage">Water Outage</option>
                      <option value="power_outage">Power Outage (Electricity)</option>
                    </select>
                  </div>
                  <div>
                    <label className="label text-xs">Location</label>
                    <input className="input text-sm" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required placeholder="E.g., Flat 4B, Block C, Green Valley" />
                  </div>
                </div>
                <div>
                  <label className="label text-xs">Summary Title</label>
                  <input className="input text-sm" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Brief title, e.g., Low water pressure / Full power outage" />
                </div>
                <div>
                  <label className="label text-xs">Details & Description</label>
                  <textarea className="input text-sm min-h-[80px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required placeholder="Provide detail like when it started, area affected..." />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary !py-2 bg-gradient-to-r from-rose-500 to-rose-600 border-rose-500 hover:from-rose-600 hover:to-rose-700 transition-all duration-200" disabled={submittingOutage}>
                    {submittingOutage ? 'Submitting...' : 'Submit Outage Report'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary !py-2">Cancel</button>
                </div>
              </form>
            )}

            <div className="p-5">
              <h3 className="font-medium text-slate-800 text-sm mb-4">
                {isAdmin ? 'Active Outages (City-Wide)' : 'My Outage Reports'}
              </h3>
              {complaints.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs flex flex-col items-center gap-1">
                  <CheckCircle2 className="w-8 h-8 text-slate-300" />
                  <p>{isAdmin ? 'No utility outages reported in the city.' : "You haven't reported any utility outages."}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {complaints.map((c) => {
                    const citizen = users.find((u) => u.id === c.userId);
                    return (
                      <div key={c.id} className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-all duration-200 hover:shadow-sm bg-white">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 text-sm break-words">{c.title}</p>
                            <p className="text-[11px] text-slate-500 mt-1 capitalize flex items-center gap-1.5 break-words">
                              {c.type === 'water_outage' ? <Droplets className="w-3.5 h-3.5 text-cyan-600" /> : <Zap className="w-3.5 h-3.5 text-amber-600" />}
                              <span>{c.type.replace('_', ' ')} · {c.location}</span>
                            </p>
                            {isAdmin && citizen && (
                              <p className="text-[11px] text-slate-400 mt-1 break-words">
                                Reported by: <span className="font-semibold text-slate-600">{citizen.name}</span> ({citizen.email}{citizen.phone ? ` · ${citizen.phone}` : ''})
                              </p>
                            )}
                            <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100/50 break-words">{c.description}</p>
                          </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <StatusBadge status={c.status} />
                          {(!isAdmin || c.userId === user.id) && c.status === 'pending' && (
                            <button
                              onClick={() => handleDeleteOutage(c.id)}
                              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
                              title="Delete Outage Report"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-50 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Reported: {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                        {c.assignedTo && (
                          <span className="font-medium text-primary-600">Assigned: {c.assignedTo}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                </div>
              )}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-cyan-600" /> Utility Alerts & Notices
            </h2>
            <div className="space-y-3">
              {announcements.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No scheduled maintenance or utility alerts at this time.</p>
              ) : (
                announcements.map((a) => (
                  <div key={a.id} className="p-3.5 rounded-xl bg-cyan-50/50 border border-cyan-100/50 hover:bg-cyan-50 hover:border-cyan-200 transition-all duration-200">
                    <p className="font-bold text-xs text-cyan-800 flex items-center gap-1.5">
                      <Megaphone className="w-3.5 h-3.5 text-cyan-600" /> {a.title}
                    </p>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">{a.content}</p>
                    <p className="text-[9px] text-slate-400 mt-2.5">
                      Posted: {new Date(a.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
  );
}
