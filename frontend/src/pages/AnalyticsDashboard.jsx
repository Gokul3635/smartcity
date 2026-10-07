import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, BarChart3, CheckCircle, Clock, Download, Users } from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatCard from '../components/StatCard';
import { DashboardSkeleton } from '../components/common/Skeletons';

export default function AnalyticsDashboard() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) { setLoading(false); return; }
    api.analytics.get()
      .then(setData)
      .finally(() => setLoading(false));
  }, [isAdmin]);

  if (!user) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">Please <Link to="/login" className="text-primary-600 font-medium">sign in</Link> as an admin to view analytics.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <p className="text-slate-500">Analytics dashboard is restricted to administrators.</p>
      </div>
    );
  }

  if (loading) return <DashboardSkeleton />;
  if (!data) return null;

  const { overview, monthlyTrend, servicePerformance, complaintsByType, complaintsByStatus } = data;

  const typeData = Object.entries(complaintsByType).map(([name, value]) => ({ name: name.replace('_', ' '), value }));
  const statusData = Object.entries(complaintsByStatus).map(([name, value]) => ({ name: name.replace('_', ' '), count: value }));

  const exportReport = () => {
    const rows = [
      ['Smart City Analytics Report', new Date().toLocaleDateString()],
      [],
      ['Metric', 'Value'],
      ['Total Complaints', overview.totalComplaints],
      ['Resolved', overview.resolvedComplaints],
      ['Pending', overview.pendingComplaints],
      ['Resolution Rate', `${overview.resolutionRate}%`],
      ['Active Workers', overview.activeWorkers],
      [],
      ['Service', 'Score', 'Target'],
      ...servicePerformance.map((s) => [s.service, s.score, s.target])
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartcity-report-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Report exported successfully');
  };

  return (
    <div>
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Analytics Dashboard</h1>
          <p className="page-subtitle">City-wide statistics, resolution rates, and service performance</p>
        </div>
        <button onClick={exportReport} className="btn-primary">
          <Download className="w-4 h-4" /> Export Report
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        <StatCard title="Total Complaints" value={overview.totalComplaints} icon={BarChart3} color="primary" />
        <StatCard title="Resolution Rate" value={`${overview.resolutionRate}%`} icon={CheckCircle} color="green" />
        <StatCard title="Active Workers" value={`${overview.activeWorkers}/${overview.totalWorkers}`} icon={Users} color="cyan" />
        <StatCard title="Pending" value={overview.pendingComplaints} icon={Clock} color="amber" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        <StatCard title="Active Emergencies" value={overview.activeEmergencies} color="red" />
        <StatCard title="Active Buses" value={overview.activeBuses} color="purple" />
        <StatCard title="Waste Vehicles On Route" value={overview.wasteVehiclesOnRoute} color="green" />
        <StatCard title="In Progress" value={overview.inProgressComplaints} color="cyan" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Monthly Complaint Trend</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="complaints" stroke="#2563eb" strokeWidth={2} name="Filed" />
              <Line type="monotone" dataKey="resolved" stroke="#16a34a" strokeWidth={2} name="Resolved" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Complaints by Status</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Complaints by Type</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={typeData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={100} />
              <Tooltip />
              <Bar dataKey="value" fill="#06b6d4" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Service Performance</h2>
          <div className="space-y-4">
            {servicePerformance.map((s) => (
              <div key={s.service}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-700">{s.service}</span>
                  <span className="text-sm font-bold text-slate-900">{s.score}% <span className="text-xs font-normal text-slate-400">/ {s.target}% target</span></span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${s.score >= s.target ? 'bg-green-500' : 'bg-amber-500'}`}
                    style={{ width: `${s.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
