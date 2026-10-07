import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Building2, Bus, Droplets, LayoutDashboard, LogOut, Menu, Shield,
  Settings, ClipboardList, User, UserCircle, X, Zap, Bell, Home
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import TopProgressBar from './common/TopProgressBar';

const navItems = [
  { path: '/citizen', label: 'Citizen Portal', shortLabel: 'Citizen', icon: User },
  { path: '/government', label: 'Government', shortLabel: 'Gov', icon: Building2, admin: true },
  { path: '/egov', label: 'E-Governance', shortLabel: 'E-Gov', icon: ClipboardList },
  { path: '/utilities', label: 'Water & Power', shortLabel: 'Utilities', icon: Droplets },
  { path: '/transport', label: 'Public Transport', shortLabel: 'Transit', icon: Bus },
  { path: '/emergency', label: 'Emergency', shortLabel: 'SOS', icon: Shield },
  { path: '/admin', label: 'Admin', shortLabel: 'Admin', icon: Settings, admin: true }
];

export default function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { complaintsCount, egovCount, markComplaintsSeen, markEgovSeen } = useNotifications();

  const filteredNav = navItems.filter((item) => !item.admin || isAdmin);

  return (
    <div className="h-screen h-[100dvh] flex flex-col overflow-hidden">
      <TopProgressBar />
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-none w-full px-2.5 sm:px-4 md:px-12">
          <div className="flex items-center justify-between h-16 flex-nowrap">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <img src="/logo.png" className="w-8 h-8 sm:w-10 h-10 object-contain rounded-lg" alt="SmartCity Logo" />
              <div className="min-w-0">
                <span className="font-extrabold text-xs sm:text-base md:text-lg leading-tight block bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">SmartCity</span>
                <span className="hidden lg:block text-[10px] sm:text-xs text-slate-500 leading-tight">Management System</span>
              </div>
            </Link>

            <nav className="hidden">
              {filteredNav.map(({ path, label, shortLabel, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-1 px-1 py-1 md:px-1.5 md:py-1.5 lg:px-3 lg:py-2 rounded-lg text-[10px] md:text-xs lg:text-sm font-medium transition-colors ${
                    location.pathname === path
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3 h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4" />
                  <span className="hidden lg:inline">{label}</span>
                  <span className="lg:hidden inline">{shortLabel || label}</span>
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {/* Complaint Notification Bell (admin only) */}
              {isAdmin && (
                <button
                  onClick={() => { markComplaintsSeen(); navigate('/government'); }}
                  title={complaintsCount > 0 ? `${complaintsCount} new complaint(s) — Go to Government Portal` : 'No new complaints'}
                  className="relative p-1.5 sm:p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors inline-block"
                >
                  <Bell className={`w-5 h-5 ${complaintsCount > 0 ? 'text-amber-600 animate-pulse' : ''}`} />
                  {complaintsCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 shadow-sm">
                      {complaintsCount > 99 ? '99+' : complaintsCount}
                    </span>
                  )}
                </button>
              )}

              {/* E-Governance Notification Bell (admin only) */}
              {isAdmin && (
                <button
                  onClick={() => { markEgovSeen(); navigate('/egov'); }}
                  title={egovCount > 0 ? `${egovCount} new E-Governance request(s) — Go to E-Governance` : 'No new E-Governance requests'}
                  className="relative p-1.5 sm:p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors inline-block"
                >
                  <ClipboardList className={`w-5 h-5 ${egovCount > 0 ? 'text-blue-600 animate-pulse' : ''}`} />
                  {egovCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-blue-500 text-white text-[10px] font-bold px-1 shadow-sm">
                      {egovCount > 99 ? '99+' : egovCount}
                    </span>
                  )}
                </button>
              )}

              {user ? (
                <>
                  <Link to="/profile" className="hidden sm:flex items-center gap-0.5 md:gap-1 text-[10px] md:text-xs lg:text-sm text-slate-600 hover:text-primary-600 transition-colors">
                    <UserCircle className="w-3.5 h-3.5 md:w-4 md:h-4 lg:w-5 lg:h-5 text-slate-500" />
                    <span className="font-semibold max-w-[45px] md:max-w-[60px] lg:max-w-none truncate">{user.name}</span>
                    <span className="hidden lg:inline-block badge bg-primary-100 text-primary-700 capitalize text-[10px]">{user.role}</span>
                  </Link>
                  <button onClick={logout} className="flex items-center justify-center btn-secondary !p-1 md:!py-1 md:!px-2 text-[10px] md:text-xs lg:!py-1.5 lg:!px-2.5 lg:text-sm" title="Logout">
                    <LogOut className="w-3 h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4" />
                    <span className="hidden lg:inline ml-1">Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="inline-flex items-center btn-secondary !py-1 !px-1.5 text-[9px] sm:text-xs lg:text-sm lg:!py-1.5 lg:!px-2.5 whitespace-nowrap">Login</Link>
                  <Link to="/register" className="inline-flex items-center btn-primary !py-1 !px-1.5 text-[9px] sm:text-xs lg:text-sm lg:!py-1.5 lg:!px-2.5 whitespace-nowrap">Register</Link>
                </>
              )}
              <button
                className="p-2 rounded-lg hover:bg-slate-100"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <nav className="border-t border-slate-200 px-4 py-3 space-y-1 bg-white">
            {filteredNav.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  location.pathname === path ? 'bg-primary-50 text-primary-700' : 'text-slate-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}

            {/* Logged in user info & actions */}
            {user && (
              <div className="pt-4 mt-3 border-t border-slate-200 space-y-3 sm:hidden">
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors text-slate-700"
                >
                  <UserCircle className="w-8 h-8 text-slate-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate leading-tight">{user.name}</div>
                    <div className="text-[11px] text-slate-500 capitalize leading-tight mt-0.5">{user.role}</div>
                  </div>
                  <span className="badge bg-primary-100 text-primary-700 capitalize text-[10px] py-0.5 px-2">
                    Active
                  </span>
                </Link>

                {/* Notifications for Admin */}
                {isAdmin && (
                  <div className="grid grid-cols-2 gap-2 px-1">
                    <button
                      onClick={() => { setMobileOpen(false); markComplaintsSeen(); navigate('/government'); }}
                      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl text-xs font-semibold transition-all duration-200 ${
                        complaintsCount > 0
                          ? 'bg-amber-50 text-amber-700 hover:bg-amber-100/80 ring-1 ring-amber-200/60 shadow-sm'
                          : 'bg-slate-50/50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                      }`}
                    >
                      <div className="relative">
                        <Bell className={`w-5 h-5 ${complaintsCount > 0 ? 'text-amber-600 animate-pulse' : 'text-slate-400'}`} />
                        {complaintsCount > 0 && (
                          <span className="absolute -top-1 -right-1 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-center font-medium">
                        Complaints ({complaintsCount})
                      </span>
                    </button>

                    <button
                      onClick={() => { setMobileOpen(false); markEgovSeen(); navigate('/egov'); }}
                      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl text-xs font-semibold transition-all duration-200 ${
                        egovCount > 0
                          ? 'bg-blue-50 text-blue-700 hover:bg-blue-100/80 ring-1 ring-blue-200/60 shadow-sm'
                          : 'bg-slate-50/50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                      }`}
                    >
                      <div className="relative">
                        <ClipboardList className={`w-5 h-5 ${egovCount > 0 ? 'text-blue-600 animate-pulse' : 'text-slate-400'}`} />
                        {egovCount > 0 && (
                          <span className="absolute -top-1 -right-1 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-center font-medium">
                        E-Gov ({egovCount})
                      </span>
                    </button>
                  </div>
                )}

                <button
                  onClick={() => { setMobileOpen(false); logout(); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors mt-1"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </nav>
        )}
      </header>

      <main className="flex-1 overflow-y-auto overflow-x-hidden max-w-none w-full px-3 sm:px-4 md:px-12 py-6 pb-20 sm:pb-8">
        {children}
      </main>

      <footer className="hidden sm:block border-t border-slate-200 bg-white py-6">
        <div className="max-w-none w-full px-4 md:px-12 text-center text-sm text-slate-500">
          Smart City Management System &copy; {new Date().getFullYear()} — Digital governance for modern cities
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-t border-slate-200 sm:hidden flex justify-around items-center h-16 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] px-4">
        <Link 
          to="/" 
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold w-14 h-12 transition-colors ${
            location.pathname === '/' ? 'text-primary-600' : 'text-slate-500'
          }`}
        >
          <Home className="w-5 h-5 shrink-0" />
          <span className="whitespace-nowrap">Home</span>
        </Link>
        <Link 
          to="/citizen" 
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold w-14 h-12 relative transition-colors ${
            location.pathname === '/citizen' ? 'text-primary-600' : 'text-slate-500'
          }`}
        >
          <User className="w-5 h-5 shrink-0" />
          <span className="whitespace-nowrap">Citizen</span>
          {complaintsCount > 0 && (
            <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-red-500" />
          )}
        </Link>
        <Link 
          to="/utilities" 
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold w-14 h-12 transition-colors ${
            location.pathname === '/utilities' ? 'text-primary-600' : 'text-slate-500'
          }`}
        >
          <Droplets className="w-5 h-5 shrink-0" />
          <span className="whitespace-nowrap">Utilities</span>
        </Link>
        <Link 
          to="/transport" 
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold w-14 h-12 transition-colors ${
            location.pathname === '/transport' ? 'text-primary-600' : 'text-slate-500'
          }`}
        >
          <Bus className="w-5 h-5 shrink-0" />
          <span className="whitespace-nowrap">Transit</span>
        </Link>
        {isAdmin ? (
          <Link 
            to="/admin" 
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold w-14 h-12 transition-colors ${
              location.pathname === '/admin' ? 'text-primary-600' : 'text-slate-500'
            }`}
          >
            <Settings className="w-5 h-5 shrink-0" />
            <span className="whitespace-nowrap">Admin</span>
          </Link>
        ) : (
          <Link 
            to="/emergency" 
            className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold w-14 h-12 transition-colors ${
              location.pathname === '/emergency' ? 'text-primary-600' : 'text-slate-500'
            }`}
          >
            <Shield className="w-5 h-5 shrink-0" />
            <span className="whitespace-nowrap">Emergency</span>
          </Link>
        )}
      </nav>
    </div>
  );
}
