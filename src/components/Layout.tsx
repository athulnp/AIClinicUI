import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Building2,
  Calendar,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Stethoscope,
  UserCircle,
  Users,
  X,
  Bell,
  Settings,
  AlertCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { clinicsApi } from '../api/services';
import { type Clinic } from '../types';
import { Button } from './ui';

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Overview', roles: 'all' },
  { to: '/patients', icon: Users, label: 'Patients', roles: 'staff' },
  { to: '/appointments', icon: Calendar, label: 'Appointments', roles: 'staff' },
  { to: '/doctors', icon: Stethoscope, label: 'Doctors', roles: 'staff' },
  { to: '/billing', icon: CreditCard, label: 'Billing', roles: 'staff' },
  { to: '/users', icon: UserCircle, label: 'Users', roles: 'admin' },
  { to: '/clinics', icon: Building2, label: 'Clinics', roles: 'super' },
];

export function Layout() {
  const { user, logout, isSuperAdmin, needsClinicContext, selectedClinicId, setSelectedClinicId } =
    useAuth();
  const navigate = useNavigate();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isSuperAdmin) {
      clinicsApi.list({ pageNumber: 1, pageSize: 100 }).then((r) => setClinics(r.data));
    }
  }, [isSuperAdmin]);

  const canSee = (item: (typeof nav)[0]) => {
    if (item.roles === 'super') return isSuperAdmin;
    if (item.roles === 'admin')
      return isSuperAdmin || user?.roleName === 'Admin';
    if (item.roles === 'staff') return !isSuperAdmin || !!selectedClinicId;
    return true;
  };

  return (
    <div className="flex min-h-screen bg-[#f8f9fa]">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-[#191c1d]/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-full max-w-xs flex flex-col bg-gradient-to-b from-white to-[#f8f9fa] border-r border-[#e1e3e4] shadow-2xl transition-transform duration-300 lg:w-72 lg:static lg:transform-none lg:max-w-none ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-6 border-b border-[#e1e3e4] bg-white/50 backdrop-blur-sm">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#005d90] to-[#006878] flex items-center justify-center">
                <Stethoscope size={16} className="text-white" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#005d90] hidden sm:block">AI Dental OS</p>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-[#191c1d] mt-1 sm:mt-2">Clinic Portal</h1>
            {user?.clinicName && (
              <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-[#404850] truncate font-medium">{user.clinicName}</p>
            )}
          </div>
          <button
            className="rounded-lg p-2 hover:bg-[#f3f4f5] transition-colors text-[#707881]"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-3 sm:p-4 overflow-y-auto">
          <p className="px-3 sm:px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#707881] hidden sm:block">Main Menu</p>
          {nav.filter(canSee).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 sm:px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-gradient-to-r from-[#005d90] to-[#006878] text-white shadow-lg shadow-[#005d90]/20' 
                    : 'text-[#404850] hover:bg-white hover:text-[#005d90] hover:shadow-md'
                }`
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-[#e1e3e4] bg-white/50 backdrop-blur-sm">
          {isSuperAdmin && (
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-[#e1e3e4]">
              <label className="block text-sm">
                <span className="mb-2 flex items-center gap-2 font-semibold text-[#191c1d] text-xs sm:text-sm">
                  <Building2 size={14} className="text-[#005d90]" />
                  <span className="hidden sm:inline">Active Clinic</span>
                  <span className="sm:hidden">Clinic</span>
                </span>
                <select
                  className="w-full rounded-lg border border-[#bfc7d1] bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-[#191c1d] outline-none focus:border-[#005d90] focus:bg-white focus:ring-2 focus:ring-[#005d90]/20 transition-all shadow-sm"
                  value={selectedClinicId ?? ''}
                  onChange={(e) =>
                    setSelectedClinicId(e.target.value ? Number(e.target.value) : null)
                  }
                >
                  <option value="">— Select —</option>
                  {clinics.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          <div className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 px-2 p-2 sm:p-3 rounded-lg bg-gradient-to-r from-[#f8f9fa] to-white border border-[#e1e3e4]">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-[#005d90] to-[#006878] flex items-center justify-center shadow-md flex-shrink-0">
                <UserCircle size={18} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-[#191c1d] truncate">{user?.fullName}</p>
                <p className="text-xs text-[#404850] truncate hidden sm:block">{user?.roleName}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="flex-1 text-xs hover:bg-[#f3f4f5]"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/profile');
                }}
              >
                Profile
              </Button>
              <Button
                variant="ghost"
                className="hover:bg-[#f3f4f5] hover:text-[#ba1a1a]"
                onClick={() => logout().then(() => {
                  setMobileMenuOpen(false);
                  navigate('/login');
                })}
              >
                <LogOut size={18} />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-[#bfc7d1]/30 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden rounded-lg p-2 hover:bg-[#f3f4f5] transition-colors text-[#707881]"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu size={24} />
              </button>
              <h1 className="text-lg font-semibold text-[#191c1d] hidden sm:block">AI Dental OS</h1>
            </div>
            <div className="flex items-center gap-3">
              <button className="rounded-lg p-2 hover:bg-[#f3f4f5] transition-colors relative text-[#707881]">
                <Bell size={20} />
                <span className="absolute top-1 right-1 h-2 w-2 bg-[#ba1a1a] rounded-full"></span>
              </button>
              <button className="rounded-lg p-2 hover:bg-[#f3f4f5] transition-colors text-[#707881]">
                <Settings size={20} />
              </button>
            </div>
          </div>
        </header>

        {needsClinicContext && (
          <div className="mx-4 sm:mx-6 mt-6 rounded-lg border border-[#ffdad6] bg-[#ffdad6] px-4 sm:px-6 py-4 text-sm text-[#93000a]">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} />
              <span>Select a clinic in the sidebar to manage patients, appointments, and billing.</span>
            </div>
          </div>
        )}
        <div className="p-4 sm:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
