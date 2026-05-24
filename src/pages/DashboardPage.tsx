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
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#191c1d] tracking-tight">
          Welcome back, {user?.fullName?.split(' ')[0] ?? 'User'}
        </h1>
        <p className="mt-1 sm:mt-2 text-sm sm:text-base text-[#404850]">
          Here's what's happening with your clinic today.
        </p>
      </div>

      {!needsClinicContext && (
        <>
          <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-3 mb-4 sm:mb-6 lg:mb-8">
            {cards.map((t) => (
              <Link key={t.to} to={t.to} className="group">
                <Card className="overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border-0 bg-gradient-to-br from-white to-[#f8f9fa] shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
                  <div className="p-3 sm:p-4 lg:p-6">
                    <div className="flex items-start justify-between mb-2 sm:mb-3 lg:mb-4">
                      <div className={`p-1.5 sm:p-2 lg:p-3 rounded-xl ${t.bgColor} shadow-sm`}>
                        <t.icon className={`h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 ${t.textColor}`} />
                      </div>
                      <div className={`h-2 w-2 rounded-full ${t.color} shadow-sm`}></div>
                    </div>
                    <p className="text-xs sm:text-xs font-semibold uppercase tracking-wider text-[#707881]">{t.label}</p>
                    <p className="mt-0.5 sm:mt-1 lg:mt-2 text-xl sm:text-2xl lg:text-4xl font-bold text-[#191c1d] group-hover:text-[#005d90] transition-colors">{t.value}</p>
                    <p className="mt-0.5 sm:mt-1 lg:mt-2 text-xs sm:text-sm text-[#404850]">{t.description}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2">
            <Card className="p-3 sm:p-4 lg:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border-0 bg-gradient-to-br from-white to-[#f8f9fa]">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 lg:mb-6">
                <div className="p-1.5 sm:p-2 lg:p-3 rounded-xl bg-gradient-to-br from-[#005d90] to-[#006878] shadow-md">
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base lg:text-lg font-bold text-[#191c1d]">Quick Actions</h3>
                  <p className="text-xs sm:text-xs lg:text-sm text-[#404850]">Common tasks</p>
                </div>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <Link to="/appointments" className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 lg:p-4 rounded-xl bg-white border border-[#e1e3e4] hover:border-[#005d90] hover:shadow-md transition-all">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-[#cde5ff]">
                    <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-[#005d90]" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm lg:text-base font-semibold text-[#191c1d]">Book Appointment</p>
                    <p className="text-xs sm:text-xs lg:text-sm text-[#404850]">Schedule a new appointment</p>
                  </div>
                </Link>
                <Link to="/patients" className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 lg:p-4 rounded-xl bg-white border border-[#e1e3e4] hover:border-[#005d90] hover:shadow-md transition-all">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-[#a7edff]">
                    <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-[#006878]" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm lg:text-base font-semibold text-[#191c1d]">Add Patient</p>
                    <p className="text-xs sm:text-xs lg:text-sm text-[#404850]">Register a new patient</p>
                  </div>
                </Link>
                <Link to="/doctors" className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 lg:p-4 rounded-xl bg-white border border-[#e1e3e4] hover:border-[#005d90] hover:shadow-md transition-all">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-[#9feffe]">
                    <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-[#00626f]" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm lg:text-base font-semibold text-[#191c1d]">Manage Doctors</p>
                    <p className="text-xs sm:text-xs lg:text-sm text-[#404850]">View doctor profiles</p>
                  </div>
                </Link>
              </div>
            </Card>

            <Card className="p-3 sm:p-4 lg:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border-0 bg-gradient-to-br from-white to-[#f8f9fa]">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 lg:mb-6">
                <div className="p-1.5 sm:p-2 lg:p-3 rounded-xl bg-gradient-to-br from-[#006878] to-[#005d90] shadow-md">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base lg:text-lg font-bold text-[#191c1d]">Recent Activity</h3>
                  <p className="text-xs sm:text-xs lg:text-sm text-[#404850]">Latest updates</p>
                </div>
              </div>
              <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl border border-[#e1e3e4] bg-white">
                  <div className="h-2 w-2 rounded-full bg-[#00626f] shadow-sm"></div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-xs lg:text-sm font-semibold text-[#191c1d]">New patient registered</p>
                    <p className="text-xs text-[#404850]">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl border border-[#e1e3e4] bg-white">
                  <div className="h-2 w-2 rounded-full bg-[#005d90] shadow-sm"></div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-xs lg:text-sm font-semibold text-[#191c1d]">Appointment completed</p>
                    <p className="text-xs text-[#404850]">15 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl border border-[#e1e3e4] bg-white">
                  <div className="h-2 w-2 rounded-full bg-[#006878] shadow-sm"></div>
                  <div className="flex-1">
                    <p className="text-xs sm:text-xs lg:text-sm font-semibold text-[#191c1d]">Invoice generated</p>
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
