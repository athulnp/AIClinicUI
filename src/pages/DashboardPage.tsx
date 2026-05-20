import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { appointmentsApi, billingApi, patientsApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { Card, PageLoader } from '../components/ui';

export function DashboardPage() {
  const { user, needsClinicContext } = useAuth();
  const [stats, setStats] = useState({ patients: 0, appointments: 0, billing: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (needsClinicContext) {
      setLoading(false);
      return;
    }
    Promise.all([
      patientsApi.list({ pageNumber: 1, pageSize: 1 }),
      appointmentsApi.list({ pageNumber: 1, pageSize: 1 }),
      billingApi.list({ pageNumber: 1, pageSize: 1 }),
    ])
      .then(([p, a, b]) =>
        setStats({
          patients: p.totalRecords,
          appointments: a.totalRecords,
          billing: b.totalRecords,
        }),
      )
      .finally(() => setLoading(false));
  }, [needsClinicContext]);

  if (loading) return <PageLoader />;

  const tiles = [
    { label: 'Patients', value: stats.patients, to: '/patients', color: 'bg-teal-500' },
    { label: 'Appointments', value: stats.appointments, to: '/appointments', color: 'bg-blue-500' },
    { label: 'Invoices', value: stats.billing, to: '/billing', color: 'bg-violet-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">
        Welcome, {user?.fullName?.split(' ')[0] ?? 'User'}
      </h1>
      <p className="mt-1 text-slate-500">
        {user?.clinicName ?? 'Platform'} — {needsClinicContext ? 'select a clinic to view data' : 'overview'}
      </p>

      {!needsClinicContext && (
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {tiles.map((t) => (
            <Link key={t.to} to={t.to}>
              <Card className="overflow-hidden transition hover:shadow-md">
                <div className={`h-1 ${t.color}`} />
                <div className="p-5">
                  <p className="text-sm text-slate-500">{t.label}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{t.value}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
