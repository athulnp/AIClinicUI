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
  Search,
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
      <aside className={`fixed inset-y-0 left-0 z-50 w-80 flex-col bg-white border-r border-[#bfc7d1]/30 shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-transform duration-300 lg:w-72 lg:static lg:transform-none ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between px-6 py-6 border-b border-[#e1e3e4]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#707881]">AI Dental OS</p>
            <h1 className="text-xl font-bold text-[#005d90] mt-1">Clinic Portal</h1>
            {user?.clinicName && (
              <p className="mt-2 text-sm text-[#404850] truncate">{user.clinicName}</p>
            )}
          </div>
          <button
            className="lg:hidden rounded-lg p-2 hover:bg-[#f3f4f5] transition-colors text-[#707881]"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {isSuperAdmin && (
          <div className="px-6 py-4 border-b border-[#e1e3e4]">
            <label className="block text-sm">
              <span className="mb-2 block font-semibold text-[#191c1d]">Active clinic</span>
              <select
                className="w-full rounded-lg border border-[#bfc7d1] bg-white px-4 py-2.5 text-sm text-[#191c1d] outline-none focus:border-[#005d90] focus:bg-white focus:ring-2 focus:ring-[#005d90]/20 transition-all"
                value={selectedClinicId ?? ''}
                onChange={(e) =>
                  setSelectedClinicId(e.target.value ? Number(e.target.value) : null)
                }
              >
                <option value="">— Select clinic —</option>
                {clinics.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          {nav.filter(canSee).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-[#005d90] text-white shadow-md' 
                    : 'text-[#404850] hover:bg-[#f3f4f5] hover:text-[#005d90]'
                }`
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-[#e1e3e4] p-4">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-10 w-10 rounded-full bg-[#f3f4f5] flex items-center justify-center">
              <UserCircle size={20} className="text-[#707881]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#191c1d] truncate">{user?.fullName}</p>
              <p className="text-xs text-[#404850] truncate">{user?.username}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/profile');
              }}
            >
              Profile
            </Button>
            <Button
              variant="ghost"
              onClick={() => logout().then(() => {
                setMobileMenuOpen(false);
                navigate('/login');
              })}
            >
              <LogOut size={18} />
            </Button>
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
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#707881]" />
                <input
                  type="search"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 w-64 rounded-lg border border-[#bfc7d1] bg-white text-sm outline-none focus:border-[#005d90] focus:bg-white focus:ring-2 focus:ring-[#005d90]/20 transition-all lg:w-64"
                />
              </div>
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
