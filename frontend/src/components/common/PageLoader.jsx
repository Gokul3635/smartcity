import { Building2, ShieldCheck, Loader2 } from 'lucide-react';

export default function PageLoader({ message = 'Loading SmartCity Workspace...', subtitle = 'Synchronizing real-time urban services' }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
      <div className="relative mb-6 flex items-center justify-center">
        {/* Glowing Background Aura */}
        <div className="absolute w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-400/30 via-blue-500/30 to-purple-600/30 blur-xl animate-pulse-glow" />
        
        {/* Outer Spinning Ring */}
        <div className="w-20 h-20 rounded-full border-2 border-transparent border-t-primary-600 border-r-cyan-400 animate-spin" />
        
        {/* Inner Pulsing Brand Icon Container */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-xl bg-white/90 backdrop-blur border border-slate-200/80 shadow-md flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary-600 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-base font-bold text-slate-800 tracking-tight flex items-center justify-center gap-2">
          <span>{message}</span>
        </h3>
        {subtitle && (
          <p className="text-xs text-slate-500 font-medium flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>{subtitle}</span>
          </p>
        )}
      </div>

      {/* Progress Dots */}
      <div className="mt-5 flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-primary-600 animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
