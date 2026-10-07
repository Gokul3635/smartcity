import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  AlertCircle, FileText, Plus, CheckCircle2, Clock, AlertTriangle, 
  FileCheck, RefreshCw, FileSignature, XCircle, Eye, Mail
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/StatusBadge';
import StatCard from '../components/StatCard';
import { EGovSkeleton } from '../components/common/Skeletons';

const permitTypes = [
  { value: 'egov_birth_cert', label: 'Birth Certificate', desc: 'Apply for official birth records' },
  { value: 'egov_building_permit', label: 'Building Permit', desc: 'Request authorization for residential or commercial construction' },
  { value: 'egov_trade_license', label: 'Trade License', desc: 'Acquire local permit for commercial business operations' },
  { value: 'egov_pet_reg', label: 'Pet Registration', desc: 'Register local domestic animals' },
  { value: 'egov_event_noc', label: 'Event NOC Permit', desc: 'No-Objection Certificate for public gatherings & events' }
];

export default function EGovernance() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  
  // Form State
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'egov_birth_cert', title: '', description: '', location: '' });
  const [formError, setFormError] = useState('');

  // Selected request for details modal
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Email Certificate Modal State
  const [users, setUsers] = useState([]);
  const [emailModalRequest, setEmailModalRequest] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailForm, setEmailForm] = useState({
    dateOfBirth: '',
    placeOfBirth: '',
    parentsNames: '',
    certificateNo: ''
  });

  const fetchRequests = async () => {
    try {
      const data = await api.egov.requests();
      setRequests(data);
      if (isAdmin) {
        const u = await api.auth.getUsers().catch(() => []);
        setUsers(u);
      }
    } catch (err) {
      toast(err.message || 'Failed to load requests log', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRequests();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleApplyRequest = async (e) => {
    e.preventDefault();
    if (!user) return;
    setFormError('');
    setSubmitting(true);
    
    // Automatically construct title from permit name
    const typeLabel = permitTypes.find(t => t.value === form.type)?.label || 'Document Request';
    const finalForm = {
      ...form,
      title: `${typeLabel} - ${user.name}`
    };

    try {
      const created = await api.egov.createRequest(finalForm);
      setRequests([created, ...requests]);
      setForm({ type: 'egov_birth_cert', title: '', description: '', location: '' });
      setShowForm(false);
      toast('Document application submitted successfully');
    } catch (err) {
      setFormError(err.message);
      toast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id, nextStatus) => {
    setUpdatingId(id);
    try {
      const updated = await api.egov.updateRequestStatus(id, nextStatus);
      setRequests(requests.map((r) => (r.id === id ? updated : r)));
      if (selectedRequest && selectedRequest.id === id) {
        setSelectedRequest(updated);
      }
      toast(`Application status updated to ${nextStatus.replace('_', ' ')}`);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSendCertificateEmail = async (e) => {
    e.preventDefault();
    if (!emailModalRequest) return;
    setSendingEmail(true);
    try {
      const result = await api.egov.sendEmail(emailModalRequest.id, emailForm);
      setRequests(requests.map((r) => (r.id === emailModalRequest.id ? result.request : r)));
      if (selectedRequest && selectedRequest.id === emailModalRequest.id) {
        setSelectedRequest(result.request);
      }
      toast(`Birth Certificate emailed to ${result.email} successfully`);
      setEmailModalRequest(null);
      setEmailForm({ dateOfBirth: '', placeOfBirth: '', parentsNames: '', certificateNo: '' });
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">Please <Link to="/login" className="text-primary-600 font-medium">sign in</Link> to access document & permit services.</p>
      </div>
    );
  }

  if (loading) return <EGovSkeleton />;

  // Stats calculation
  const total = requests.length;
  const pending = requests.filter(r => r.status === 'pending').length;
  const underReview = requests.filter(r => r.status === 'under_review').length;
  const approved = requests.filter(r => r.status === 'approved').length;

  return (
    <div className="w-full space-y-6">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">E-Governance & Document Portal</h1>
          <p className="page-subtitle">Submit permit applications, request civil certificates, and track administrative approvals</p>
        </div>
        {!isAdmin && (
          <button 
            onClick={() => setShowForm(!showForm)} 
            className="btn-primary flex items-center gap-1.5 self-start sm:self-auto bg-gradient-to-br from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-md"
          >
            <Plus className="w-4.5 h-4.5" /> Apply for Permit / Document
          </button>
        )}
      </div>

      {/* Overview StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        <StatCard title="Total Applications" value={total} icon={FileText} color="primary" />
        <StatCard title="Pending Validation" value={pending} icon={Clock} color="amber" />
        <StatCard title="Under Review" value={underReview} icon={RefreshCw} color="cyan" />
        <StatCard title="Approved / Issued" value={approved} icon={FileCheck} color="green" />
      </div>


        {/* E-Gov Control Center or Citizen Form / Available Services */}
        {!isAdmin ? (
          showForm ? (
            <div className="card p-5 space-y-4 bg-white shadow-sm border border-slate-100 w-full max-w-full overflow-hidden">
              <h2 className="font-semibold text-slate-900 text-base flex items-center gap-1.5">
                <FileSignature className="w-5 h-5 text-primary-600" />
                New Application
              </h2>
              <form onSubmit={handleApplyRequest} className="space-y-3.5">
                {formError && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs">{formError}</div>}
                
                <div>
                  <label className="label text-xs">Permit / Certificate Type</label>
                  <select 
                    className="input text-sm" 
                    value={form.type} 
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    {permitTypes.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label text-xs">Applicant Address / Area</label>
                  <input 
                    className="input text-sm" 
                    value={form.location} 
                    onChange={(e) => setForm({ ...form, location: e.target.value })} 
                    required 
                    placeholder="E.g., Sector 15, Block B"
                  />
                </div>

                <div>
                  <label className="label text-xs">Supporting Details & Purpose</label>
                  <textarea 
                    className="input text-sm min-h-[100px] resize-none" 
                    value={form.description} 
                    onChange={(e) => setForm({ ...form, description: e.target.value })} 
                    required 
                    placeholder="E.g., Requesting building permit for residential villa renovation. Built-up area: 2400 sq.ft."
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    type="submit" 
                    className="btn-primary flex-1 justify-center py-2" 
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowForm(false)} 
                    className="btn-secondary py-2"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="card p-5 space-y-4 w-full max-w-full overflow-hidden">
              <h2 className="font-semibold text-slate-900 text-sm">Available Services & Permits</h2>
              <div className="space-y-3 text-xs">
                {permitTypes.map((t) => (
                  <div key={t.value} className="p-3 rounded-lg border border-slate-50 hover:bg-slate-50 transition-colors">
                    <p className="font-semibold text-slate-800 text-sm">{t.label}</p>
                    <p className="text-slate-500 mt-1 leading-relaxed">{t.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        ) : (
          <div className="card p-5 space-y-4 h-fit w-full max-w-full overflow-hidden">
            <h2 className="font-semibold text-slate-900 text-sm">E-Gov Control Center</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Review citizen requests for local permits and records. Maintain strict validation guidelines before changing status to <strong>Approved</strong>.
            </p>
            <div className="text-xs space-y-2 pt-2">
              <div className="flex justify-between items-center p-2 rounded bg-slate-50 border border-slate-100">
                <span className="text-slate-500">Awaiting Dispatch</span>
                <span className="font-bold text-slate-700">{pending}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-indigo-50 border border-indigo-100 text-indigo-700">
                <span className="font-medium">Under Active Review</span>
                <span className="font-bold">{underReview}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-green-50 border border-green-100 text-green-700">
                <span className="font-medium">Approved Permits</span>
                <span className="font-bold">{approved}</span>
              </div>
            </div>
          </div>
        )}

        {/* Requests Table & Logs */}
        <div className="card w-full max-w-full overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 text-base">
              {isAdmin ? 'Citizen Applications Registry' : 'My Application Log'}
            </h2>
            <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              {requests.length} Requests
            </span>
          </div>

          {/* Unified Responsive List View */}
          <div className="divide-y divide-slate-100">
            {requests.length === 0 ? (
              <p className="text-center py-8 text-slate-400 text-xs italic p-4">
                {isAdmin ? 'No document applications recorded in the system.' : 'No active permit or certificate applications yet.'}
              </p>
            ) : (
              requests.map((r) => {
                const typeLabel = permitTypes.find(t => t.value === r.type)?.label || 'Document Request';
                const citizen = isAdmin ? users.find((u) => u.id === r.userId) : null;
                return (
                  <div key={r.id} className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-start justify-between gap-4 w-full">
                    {/* Details section */}
                    <div className="w-full lg:flex-1 min-w-0 space-y-2.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-semibold text-slate-800 flex items-center gap-1.5 flex-wrap leading-snug">
                          {typeLabel}
                          {r.type === 'egov_birth_cert' && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-full">
                              <Mail className="w-2.5 h-2.5" /> Cert
                            </span>
                          )}
                        </span>
                        <StatusBadge status={r.status} />
                      </div>
                      
                      <div className="text-[10px] text-slate-400 font-mono">ID: {r.id}</div>
                      
                      {isAdmin && citizen && (
                        <div className="bg-slate-50 border border-slate-100/50 rounded-lg p-3 space-y-0.5 text-xs text-slate-600 max-w-md w-full">
                          <p className="font-semibold text-slate-700">Applicant: {citizen.name}</p>
                          <p className="break-all">{citizen.email}</p>
                          {citizen.phone && <p className="break-all">{citizen.phone}</p>}
                        </div>
                      )}

                      <p className="text-[10px] text-slate-400">
                        Submitted: {new Date(r.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto w-full lg:w-auto pt-2 lg:pt-0">
                      <button 
                        onClick={() => setSelectedRequest(r)}
                        className="p-2 text-slate-500 hover:text-primary-600 rounded bg-slate-50 border border-slate-100 hover:border-primary-100 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {isAdmin && (
                        <>
                          {r.status === 'pending' && (
                            <button 
                              onClick={() => handleStatusUpdate(r.id, 'under_review')}
                              disabled={updatingId === r.id}
                              className="btn bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 !py-1.5 !px-2.5 text-[10px] font-semibold"
                            >
                              Review
                            </button>
                          )}
                          {r.status !== 'approved' && (
                            <button 
                              onClick={() => handleStatusUpdate(r.id, 'approved')}
                              disabled={updatingId === r.id}
                              className="btn bg-green-50 hover:bg-green-100 text-green-700 border-green-200 !py-1.5 !px-2.5 text-[10px] font-semibold"
                            >
                              Approve
                            </button>
                          )}
                          {r.status !== 'rejected' && (
                            <button 
                              onClick={() => handleStatusUpdate(r.id, 'rejected')}
                              disabled={updatingId === r.id}
                              className="btn bg-red-50 hover:bg-red-100 text-red-700 border-red-200 !py-1.5 !px-2.5 text-[10px] font-semibold"
                            >
                              Reject
                            </button>
                          )}
                          {r.type === 'egov_birth_cert' && (
                            <button
                              onClick={() => {
                                setEmailModalRequest(r);
                                setEmailForm({ dateOfBirth: '', placeOfBirth: '', parentsNames: '', certificateNo: '' });
                              }}
                              title="Send Birth Certificate via Email"
                              className="btn bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 !py-1.5 !px-2.5 text-[10px] font-semibold flex items-center gap-1"
                            >
                              <Mail className="w-3.5 h-3.5" /> Send Email
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>


        </div>


      {/* Details Dialog Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card w-full max-w-lg p-6 space-y-4 bg-white relative animate-in fade-in zoom-in-95 duration-150">
            <button 
              onClick={() => setSelectedRequest(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-transparent transition-colors"
            >
              <span className="sr-only">Close</span>
              &times;
            </button>

            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                Application Detail
              </span>
              <h3 className="font-bold text-slate-900 text-lg mt-2">
                {permitTypes.find(t => t.value === selectedRequest.type)?.label || 'Document Request'}
              </h3>
            </div>

            <div className="space-y-3.5 text-sm pt-2">
              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-slate-50">
                <span className="text-slate-400 text-xs font-semibold">Request ID</span>
                <span className="col-span-2 text-slate-800 font-mono text-xs">{selectedRequest.id}</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-slate-50">
                <span className="text-slate-400 text-xs font-semibold">Status</span>
                <span className="col-span-2"><StatusBadge status={selectedRequest.status} /></span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-slate-50">
                <span className="text-slate-400 text-xs font-semibold">Date Submitted</span>
                <span className="col-span-2 text-slate-700">{new Date(selectedRequest.createdAt).toLocaleString()}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-slate-50">
                <span className="text-slate-400 text-xs font-semibold">Area Location</span>
                <span className="col-span-2 text-slate-700">{selectedRequest.location}</span>
              </div>

              {isAdmin && (() => {
                const citizen = users.find(u => u.id === selectedRequest.userId);
                return citizen ? (
                  <div className="grid grid-cols-3 gap-2 py-1.5 border-b border-slate-50">
                    <span className="text-slate-400 text-xs font-semibold">Applicant</span>
                    <div className="col-span-2">
                      <p className="text-slate-800 text-xs font-semibold">{citizen.name}</p>
                      <p className="text-slate-500 text-xs">{citizen.email}{citizen.phone ? ` · ${citizen.phone}` : ''}</p>
                    </div>
                  </div>
                ) : null;
              })()}

              <div className="space-y-1">
                <span className="text-slate-400 text-xs font-semibold block">Details / Justification</span>
                <div className="p-3 bg-slate-50 rounded-lg text-xs leading-relaxed text-slate-600 border border-slate-100 max-h-40 overflow-y-auto whitespace-pre-wrap">
                  {selectedRequest.description}
                </div>
              </div>
            </div>

            {isAdmin && (
              <div className="flex flex-wrap gap-2 justify-end pt-4 border-t border-slate-100">
                {selectedRequest.status === 'pending' && (
                  <button 
                    onClick={() => handleStatusUpdate(selectedRequest.id, 'under_review')}
                    disabled={updatingId === selectedRequest.id}
                    className="btn bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 !py-1.5 !px-3 text-xs font-semibold"
                  >
                    Move to Review
                  </button>
                )}
                {selectedRequest.status !== 'approved' && (
                  <button 
                    onClick={() => handleStatusUpdate(selectedRequest.id, 'approved')}
                    disabled={updatingId === selectedRequest.id}
                    className="btn bg-green-600 hover:bg-green-700 text-white !py-1.5 !px-3 text-xs font-semibold"
                  >
                    Approve Request
                  </button>
                )}
                {selectedRequest.status !== 'rejected' && (
                  <button 
                    onClick={() => handleStatusUpdate(selectedRequest.id, 'rejected')}
                    disabled={updatingId === selectedRequest.id}
                    className="btn bg-red-600 hover:bg-red-700 text-white !py-1.5 !px-3 text-xs font-semibold"
                  >
                    Reject Request
                  </button>
                )}
                {selectedRequest.type === 'egov_birth_cert' && (
                  <button
                    onClick={() => {
                      setEmailModalRequest(selectedRequest);
                      setEmailForm({ dateOfBirth: '', placeOfBirth: '', parentsNames: '', certificateNo: '' });
                      setSelectedRequest(null);
                    }}
                    className="btn bg-blue-600 hover:bg-blue-700 text-white !py-1.5 !px-3 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5" /> Send Certificate Email
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Email Birth Certificate Modal */}
      {emailModalRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card w-full max-w-md p-6 space-y-5 bg-white relative">
            <button
              type="button"
              onClick={() => setEmailModalRequest(null)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-transparent transition-colors"
            >
              <span className="sr-only">Close</span>
              &times;
            </button>

            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-500 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                Send Certificate via Email
              </span>
              <h3 className="font-bold text-slate-900 text-base mt-2 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                Birth Certificate Dispatch
              </h3>
              {(() => {
                const citizen = users.find(u => u.id === emailModalRequest.userId);
                return citizen ? (
                  <p className="text-xs text-slate-500 mt-1">
                    Will be emailed to: <span className="font-semibold text-slate-700">{citizen.name}</span> at <span className="font-semibold text-blue-600">{citizen.email}</span>
                  </p>
                ) : null;
              })()}
            </div>

            <form onSubmit={handleSendCertificateEmail} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs">Date of Birth</label>
                  <input
                    type="date"
                    className="input text-sm"
                    value={emailForm.dateOfBirth}
                    onChange={(e) => setEmailForm({ ...emailForm, dateOfBirth: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="label text-xs">Certificate No.</label>
                  <input
                    type="text"
                    className="input text-sm"
                    value={emailForm.certificateNo}
                    onChange={(e) => setEmailForm({ ...emailForm, certificateNo: e.target.value })}
                    required
                    placeholder="e.g. BC-2024-00123"
                  />
                </div>
              </div>
              <div>
                <label className="label text-xs">Place of Birth</label>
                <input
                  type="text"
                  className="input text-sm"
                  value={emailForm.placeOfBirth}
                  onChange={(e) => setEmailForm({ ...emailForm, placeOfBirth: e.target.value })}
                  required
                  placeholder="e.g. City General Hospital, Chennai"
                />
              </div>
              <div>
                <label className="label text-xs">Parent(s) Name</label>
                <input
                  type="text"
                  className="input text-sm"
                  value={emailForm.parentsNames}
                  onChange={(e) => setEmailForm({ ...emailForm, parentsNames: e.target.value })}
                  required
                  placeholder="e.g. Ravi Kumar & Priya Kumar"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="btn bg-blue-600 hover:bg-blue-700 text-white flex-1 justify-center !py-2 text-sm font-semibold flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  {sendingEmail ? 'Sending...' : 'Send Certificate'}
                </button>
                <button
                  type="button"
                  onClick={() => setEmailModalRequest(null)}
                  className="btn-secondary !py-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
