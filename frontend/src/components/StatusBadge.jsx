const statusStyles = {
  pending: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  under_review: 'bg-indigo-100 text-indigo-800',
  dispatched: 'bg-purple-100 text-purple-800',
  active: 'bg-green-100 text-green-800',
  cleared: 'bg-slate-100 text-slate-700',
  paid: 'bg-green-100 text-green-800',
  confirmed: 'bg-green-100 text-green-800',
  idle: 'bg-slate-100 text-slate-600',
  on_route: 'bg-blue-100 text-blue-800',
  maintenance: 'bg-orange-100 text-orange-800',
  heavy: 'bg-red-100 text-red-800',
  moderate: 'bg-amber-100 text-amber-800',
  clear: 'bg-green-100 text-green-800',
  minor: 'bg-yellow-100 text-yellow-800'
};

export default function StatusBadge({ status }) {
  const label = status?.replace(/_/g, ' ') || 'unknown';
  return (
    <span className={`badge capitalize whitespace-nowrap ${statusStyles[status] || 'bg-slate-100 text-slate-600'}`}>
      {label}
    </span>
  );
}
