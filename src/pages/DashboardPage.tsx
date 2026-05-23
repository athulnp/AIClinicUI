import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { appointmentsApi, billingApi, patientsApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { Card, PageLoader } from '../components/ui';
import { Users, Calendar, FileText, TrendingUp, Activity, Clock } from 'lucide-react';

export function DashboardPage() {
  const { user, needsClinicContext, selectedClinicId } = useAuth();
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
  }, [needsClinicContext, selectedClinicId]);

  if (loading) return <PageLoader />;

  const cards = [
    { 
      label: 'Total Patients', 
      value: stats.patients, 
      to: '/patients', 
      icon: Users,
      color: 'bg-[#005d90]',
      bgColor: 'bg-[#cde5ff]',
      textColor: 'text-[#001d32]',
      description: 'Registered patients'
    },
    { 
      label: 'Appointments', 
      value: stats.appointments, 
      to: '/appointments', 
      icon: Calendar,
      color: 'bg-[#006878]',
      bgColor: 'bg-[#a7edff]',
      textColor: 'text-[#001f25]',
      description: 'Scheduled today'
    },
    { 
      label: 'Invoices', 
      value: stats.billing, 
      to: '/billing', 
      icon: FileText,
      color: 'bg-[#00626f]',
      bgColor: 'bg-[#9feffe]',
      textColor: 'text-[#001f24]',
      description: 'Pending payments'
    },
  ];

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#191c1d] tracking-tight">
          Welcome back, {user?.fullName?.split(' ')[0] ?? 'User'}
        </h1>
        <p className="mt-2 text-[#404850]">
          Here's what's happening with your clinic today.
        </p>
      </div>

      {!needsClinicContext && (
        <>
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-3 mb-6 sm:mb-8">
            {cards.map((t) => (
              <Link key={t.to} to={t.to} className="group">
                <Card className="overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg border-0 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
                  <div className="p-4 sm:p-6">
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className={`p-2 sm:p-3 rounded-lg ${t.bgColor}`}>
                        <t.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${t.textColor}`} />
                      </div>
                      <div className={`h-2 w-2 rounded-full ${t.color}`}></div>
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-[#707881] uppercase tracking-wider">{t.label}</p>
                    <p className="mt-1 sm:mt-2 text-2xl sm:text-4xl font-bold text-[#191c1d] group-hover:text-[#005d90] transition-colors">{t.value}</p>
                    <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-[#404850]">{t.description}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
            <Card className="p-4 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border-0 bg-white">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="p-2 sm:p-3 rounded-lg bg-[#f3f4f5]">
                  <Activity className="h-5 w-5 sm:h-6 sm:w-6 text-[#404850]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-[#191c1d]">Quick Actions</h3>
                  <p className="text-xs sm:text-sm text-[#404850]">Common tasks</p>
                </div>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <Link to="/appointments" className="flex items-center gap-3 p-3 sm:p-4 rounded-lg bg-[#f8f9fa] hover:bg-[#edeeef] transition-colors">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-[#707881]" />
                  <div>
                    <p className="text-sm sm:text-base font-medium text-[#191c1d]">Book Appointment</p>
                    <p className="text-xs sm:text-sm text-[#404850]">Schedule a new appointment</p>
                  </div>
                </Link>
                <Link to="/patients" className="flex items-center gap-3 p-3 sm:p-4 rounded-lg bg-[#f8f9fa] hover:bg-[#edeeef] transition-colors">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-[#707881]" />
                  <div>
                    <p className="text-sm sm:text-base font-medium text-[#191c1d]">Add Patient</p>
                    <p className="text-xs sm:text-sm text-[#404850]">Register a new patient</p>
                  </div>
                </Link>
                <Link to="/doctors" className="flex items-center gap-3 p-3 sm:p-4 rounded-lg bg-[#f8f9fa] hover:bg-[#edeeef] transition-colors">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-[#707881]" />
                  <div>
                    <p className="text-sm sm:text-base font-medium text-[#191c1d]">Manage Doctors</p>
                    <p className="text-xs sm:text-sm text-[#404850]">View doctor profiles</p>
                  </div>
                </Link>
              </div>
            </Card>

            <Card className="p-4 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border-0 bg-white">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="p-2 sm:p-3 rounded-lg bg-[#f3f4f5]">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-[#404850]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-[#191c1d]">Recent Activity</h3>
                  <p className="text-xs sm:text-sm text-[#404850]">Latest updates</p>
                </div>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-3 p-2 sm:p-3 rounded-lg border border-[#e1e3e4]">
                  <div className="h-2 w-2 rounded-full bg-[#00626f]"></div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-medium text-[#191c1d]">New patient registered</p>
                    <p className="text-xs text-[#404850]">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 sm:p-3 rounded-lg border border-[#e1e3e4]">
                  <div className="h-2 w-2 rounded-full bg-[#005d90]"></div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-medium text-[#191c1d]">Appointment completed</p>
                    <p className="text-xs text-[#404850]">15 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 sm:p-3 rounded-lg border border-[#e1e3e4]">
                  <div className="h-2 w-2 rounded-full bg-[#006878]"></div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-medium text-[#191c1d]">Invoice generated</p>
                    <p className="text-xs text-[#404850]">1 hour ago</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
