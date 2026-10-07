import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Building2, Bus, Droplets, LayoutDashboard, Shield,
  Settings, ClipboardList, User, Zap, Star, Activity, CheckCircle2,
  AlertCircle, ShieldAlert, Cpu, Heart, Check, Users, MessageSquare,
  Sparkles, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppUpdate } from '../hooks/useAppUpdate';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';

const portals = [
  {
    path: '/government',
    title: 'Government Portal',
    icon: Building2,
    color: 'from-indigo-600 to-violet-600',
    tagline: 'Manage operations & staff duty logs',
    features: ['Manage complaints', 'Assign workers', 'Monitor services']
  },
  {
    path: '/egov',
    title: 'E-Governance',
    icon: ClipboardList,
    color: 'from-emerald-500 to-teal-600',
    tagline: 'Apply online for certificates & permits',
    features: ['Apply for licenses', 'Request certificates', 'Track documents']
  },
  {
    path: '/utilities',
    title: 'Water & Electricity',
    icon: Droplets,
    color: 'from-cyan-500 to-blue-600',
    tagline: 'Monitor daily utility consumption',
    features: ['Usage monitoring', 'Bill generation', 'Payment history']
  },
  {
    path: '/transport',
    title: 'Public Transport',
    icon: Bus,
    color: 'from-purple-500 to-pink-600',
    tagline: 'Live transit routing & ticket bookings',
    features: ['Bus tracking', 'Route info', 'Ticket management']
  },
  {
    path: '/emergency',
    title: 'Emergency Services',
    icon: Shield,
    color: 'from-rose-500 to-red-600',
    tagline: 'SOS dispatch system operational 24/7',
    features: ['Ambulance requests', 'Fire service', 'Police alerts']
  },
  {
    path: '/admin',
    title: 'Admin & Analytics',
    icon: LayoutDashboard,
    color: 'from-slate-700 to-slate-900',
    tagline: 'Admin panel with city-wide analytics & metrics',
    features: ['System management', 'Analytics dashboard', 'Service reports']
  }
];

export default function Home() {
  const { user, isAdmin } = useAuth();
  const { checking, updateAvailable, currentVersion, remoteVersion, applyUpdate, isNative, checkNow } = useAppUpdate();
  const [systemLogs, setSystemLogs] = useState([]);
  const [deploying, setDeploying] = useState(false);
  const { toast } = useToast();
  
  const visiblePortals = portals.filter((p) => p.path !== '/admin' || isAdmin);
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  const handleDeploy = async () => {
    setDeploying(true);
    toast('Deploying to Vercel… This takes about 30–90 seconds, please wait.', 'info');
    try {
      const res = await fetch('/api/deploy', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        const msg = data.deployUrl
          ? `✅ Deployed! Installing new version…`
          : '✅ Deployed! Installing new version…';
        toast(msg, 'success');
        // Auto-install: clear cache and reload to get the freshly deployed version
        setTimeout(async () => {
          await applyUpdate();
        }, 3000);
      } else {
        const errMsg = data.details || data.error || 'Vercel deployment failed.';
        toast(`Deploy failed: ${errMsg.slice(0, 120)}`, 'error');
        setDeploying(false);
      }
    } catch (err) {
      toast('Failed to reach local deployment API. Make sure the backend is running.', 'error');
      setDeploying(false);
    }
  };

  const handleUpdate = async () => {
    if (checking) return;

    if (updateAvailable) {
      if (isNative) {
        const confirmInstall = window.confirm(
          `Install New Version?\n\nA new version (v${remoteVersion}) is available. Would you like to download and install the new APK?`
        );
        if (!confirmInstall) return;
      }
      await applyUpdate();
    } else {
      toast('Checking for updates…', 'info');
      try {
        const result = await checkNow();
        if (result && result.available) {
          toast(`New version v${result.remoteVersion?.version || ''} available!`, 'success');
          if (isNative) {
            const confirmInstall = window.confirm(
              `Install New Version?\n\nA new version (v${result.remoteVersion?.version}) is available. Would you like to download and install the new APK?`
            );
            if (confirmInstall) {
              await applyUpdate();
            }
          } else {
            await applyUpdate();
          }
        } else {
          toast('You are on the latest version!', 'success');
        }
      } catch (err) {
        toast('Failed to check for updates. Please try again.', 'error');
      }
    }
  };

  const updateButton = (isLocal && !isNative) ? (
    <button
      onClick={handleDeploy}
      disabled={deploying}
      className={`btn border-0 flex items-center gap-2 px-5 ${
        deploying
          ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20'
          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20'
      }`}
      title={deploying ? 'Deploying to Vercel, please wait…' : 'Deploy current code to Vercel production'}
    >
      {deploying ? (
        <RefreshCw className="w-4 h-4 animate-spin" />
      ) : (
        <Sparkles className="w-4 h-4" />
      )}
      {deploying ? 'Updating…' : 'Update'}
    </button>
  ) : (
    <button
      onClick={handleUpdate}
      disabled={checking}
      className={`btn border-0 flex items-center gap-2 px-5 ${
        updateAvailable
          ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 animate-pulse-once'
          : 'bg-slate-800 hover:bg-slate-700 text-white shadow-lg shadow-slate-800/20'
      }`}
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
      {checking
        ? 'Checking…'
        : updateAvailable
        ? isNative
          ? `Install v${remoteVersion}`
          : `Update v${remoteVersion}`
        : 'Update'}
      {updateAvailable && !checking && (
        <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold">NEW</span>
      )}
    </button>
  );

  // Real-time simulated logs to make the page feel alive
  useEffect(() => {
    const initialLogs = [
      'Traffic light optimization active on Route 4',
      'Water pressure normalization complete in Sector 7',
      'Solar grid feed running at 94% efficiency',
      'Garbage collector dispatch completed for Area B'
    ];
    setSystemLogs(initialLogs);

    const interval = setInterval(() => {
      const activities = [
        'New complaint resolved in Ward 3',
        'Bus Route 102 ETA updated in transit map',
        'E-Governance certificate successfully processed',
        'Emergency response center heartbeat OK',
        'Utility bill generated for Sector 4 citizens',
        'Smart streetlights transitioned to power-save mode'
      ];
      const randomActivity = activities[Math.floor(Math.random() * activities.length)];
      setSystemLogs(prev => [randomActivity, ...prev.slice(0, 3)]);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-16 py-4">
      {/* Split Interactive Hero Section */}
      <div className="grid grid-cols-12 gap-8 items-center">
        {/* Left Info Panel */}
        <div className="col-span-12 lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 rounded-full border border-primary-100 text-primary-700 text-xs font-semibold">
            <Cpu className="w-3.5 h-3.5 text-primary-600 animate-spin-slow" />
            Next-Gen Urban Infrastructure
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-none">
            Digital Control for <br />
            <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">Smart City Operations</span>
          </h1>

          <p className="text-slate-500 text-base sm:text-lg max-w-xl leading-relaxed">
            Unifying emergency dispatches, document governance, utility billing tracking, and public transportation routing into a single, responsive layout.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            {user ? (
              <Link to="/egov" className="btn bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/20 border-0 flex items-center gap-2 px-6">
                E-Governance Portal
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-600/20 border-0 flex items-center gap-2 px-6">
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/login" className="btn btn-secondary px-6">
                  Sign In
                </Link>
                {updateButton}
              </>
            )}
            {user && updateButton}
          </div>

          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-100">
            <div>
              <p className="text-2xl font-black text-slate-800">99.8%</p>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mt-0.5">System Uptime</p>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-800">12 Mins</p>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mt-0.5">SLA Dispatch</p>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-800">100%</p>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mt-0.5">Online Permits</p>
            </div>
          </div>
        </div>

        {/* Right Smart City Graphic */}
        <div className="hidden lg:flex lg:col-span-5 justify-center">
          <div className="relative overflow-hidden rounded-3xl border border-slate-800 shadow-xl max-w-md w-full bg-[#050508] flex items-center justify-center group">
            <img 
              src="/logo.png" 
              alt="Smart City Logo" 
              className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>
      </div>

      {/* Modern Grid Navigation Directory */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Municipal Operation Centers</h2>
          <p className="text-slate-550 text-sm mt-1">Access secure service centers designed for citizens and workers</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visiblePortals.map(({ path, title, icon: Icon, color, tagline, features }) => (
            <Link 
              key={path} 
              to={path} 
              className="group relative bg-white border border-slate-200/80 rounded-2xl p-4 md:p-6 hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-white mb-3 md:mb-4 shadow-sm`}>
                  <Icon className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm md:text-base whitespace-nowrap group-hover:text-primary-600 transition-colors">
                  {title}
                </h3>
                <p className="text-[10px] md:text-xs text-slate-500 mt-1 mb-3 md:mb-4 leading-relaxed">
                  {tagline}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-3 md:pt-4 mt-1 md:mt-2">
                <div className="flex flex-wrap gap-1 md:gap-1.5">
                  {features.map((f) => (
                    <span key={f} className="text-[9px] md:text-[10px] bg-slate-50 border border-slate-100 text-slate-600 px-1.5 md:px-2 py-0.5 rounded-full font-medium">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Interactive Platform Highlights */}
      <section className="grid lg:grid-cols-2 gap-8 bg-slate-50 rounded-3xl p-8 border border-slate-200/50">
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-800">Designed for Citizens and Administrators</h3>
          <p className="text-slate-550 text-sm leading-relaxed">
            SmartCity integrates cross-departmental operations into a single shared database. Citizens can raise outage alerts, make immediate utility payments, and receive certificates, while admins assign worker dispatches and monitor incident logs.
          </p>
          <div className="space-y-2 pt-2">
            {[
              'Direct-to-citizen email notification dispatches',
              'Integrated utility billing tracking & payments flow',
              'SLA task assignments logs for service workers',
              'Centralized emergency Sos dispatch network center'
            ].map(item => (
              <div key={item} className="flex items-center gap-2 text-xs text-slate-655 font-medium">
                <CheckCircle2 className="w-4 h-4 text-primary-500 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary-600 font-bold text-sm">
              <MessageSquare className="w-4 h-4" /> Live Announcement Feed
            </div>
            <h4 className="font-extrabold text-slate-800 text-base mt-2">Water supply pressure optimization scheduled</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Pressure levels in sector 4 through 7 will experience transient decreases between 02:00 and 04:00 AM for filter maintenance operations.
            </p>
          </div>
          <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-4 mt-2">
            <span className="text-slate-450">Posted 1 hour ago · Municipal Office</span>
            <Link to="/utilities" className="text-primary-600 hover:text-primary-700 font-bold flex items-center gap-1">
              Read all news <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
