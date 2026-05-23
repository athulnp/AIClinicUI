import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Building2,
  Calendar,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Stethoscope,
  UserCircle,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { clinicsApi } from '../api/services';
import { type Clinic } from '../types';
import { Button } from './ui';

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', roles: 'all' },
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
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col bg-brand-800 text-white">
        <div className="border-b border-brand-700 px-5 py-5">
          <p className="text-xs font-medium uppercase tracking-wider text-brand-200">AI Dental OS</p>
          <h1 className="text-lg font-bold">Clinic Portal</h1>
          {user?.clinicName && (
            <p className="mt-1 truncate text-sm text-brand-100">{user.clinicName}</p>
          )}
        </div>

        {isSuperAdmin && (
          <div className="border-b border-brand-700 px-4 py-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-brand-100">Active clinic</span>
              <select
                className="w-full rounded-lg border-0 bg-brand-700 px-3 py-2 text-sm text-white"
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

        <nav className="flex-1 space-y-1 p-3">
          {nav.filter(canSee).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-brand-600 text-white' : 'text-brand-100 hover:bg-brand-700'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-brand-700 p-4">
          <p className="truncate text-sm font-medium">{user?.fullName}</p>
          <p className="truncate text-xs text-brand-200">{user?.username}</p>
          <div className="mt-3 flex gap-2">
            <Button
              variant="ghost"
              className="flex-1 !text-brand-100 hover:!bg-brand-700"
              onClick={() => navigate('/profile')}
            >
              Profile
            </Button>
            <Button
              variant="ghost"
              className="!text-brand-100 hover:!bg-brand-700"
              onClick={() => logout().then(() => navigate('/login'))}
            >
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {needsClinicContext && (
          <div className="border-b border-amber-200 bg-amber-50 px-6 py-3 text-sm text-amber-900">
            Select a clinic in the sidebar to manage patients, appointments, and billing.
          </div>
        )}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
