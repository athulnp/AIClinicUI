import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { appointmentsApi, patientsApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import type { Appointment, Patient } from '../types';
import { appointmentStatusLabels, formatDate, formatTime } from '../utils/labels';
import { Alert, Badge, Button, Card, CardHeader, EmptyState, Input, PageLoader } from '../components/ui';

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { needsClinicContext } = useAuth();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: '',
    gender: 1,
    phoneNumber: '',
    email: '',
    address: '',
    bloodGroup: '',
    medicalHistory: '',
    allergies: '',
    emergencyContact: '',
    notes: '',
  });

  const load = async () => {
    if (!id || needsClinicContext) return;
    setLoading(true);
    try {
      const p = await patientsApi.get(Number(id));
      setPatient(p);
      setForm({
        fullName: p.fullName,
        gender: p.gender,
        phoneNumber: p.phoneNumber,
        email: p.email || '',
        address: p.address || '',
        bloodGroup: p.bloodGroup || '',
        medicalHistory: p.medicalHistory || '',
        allergies: p.allergies || '',
        emergencyContact: p.emergencyContact || '',
        notes: p.notes || '',
      });

      // Load appointments for this patient
      const appts = await appointmentsApi.list({ pageNumber: 1, pageSize: 50 });
      setAppointments(appts.data.filter((a) => a.patientId === Number(id)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id, needsClinicContext]);

  const save = async () => {
    setError(null);
    try {
      await patientsApi.update(Number(id), {
        ...form,
        gender: Number(form.gender),
      });
      setEditMode(false);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
    }
  };

  if (needsClinicContext) return <EmptyState message="Select a clinic first." />;
  if (loading || !patient) return <PageLoader />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#191c1d]">{patient.fullName}</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-[#404850]">{patient.patientCode}</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/patients')} className="w-full sm:w-auto">
          ← Back
        </Button>
      </div>

      {error && <Alert message={error} />}

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border-0 bg-gradient-to-br from-white to-[#f8f9fa]">
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#191c1d]">Patient Information</h2>
              <p className="mt-1 text-sm text-[#404850]">View and manage patient details</p>
            </div>

            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#707881]">Patient Code</label>
                <p className="text-[#191c1d] font-medium">{patient.patientCode}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#707881]">Gender</label>
                <p className="text-[#191c1d] font-medium">{['', 'Male', 'Female', 'Other'][patient.gender]}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#707881]">Date of Birth</label>
                <p className="text-[#191c1d] font-medium">{formatDate(patient.dateOfBirth)}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#707881]">Blood Group</label>
                <p className="text-[#191c1d] font-medium">{patient.bloodGroup || '—'}</p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 sm:pt-6 grid gap-4 sm:gap-6 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#707881]">Phone</label>
                <p className="text-[#191c1d] font-medium">{patient.phoneNumber}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#707881]">Email</label>
                <p className="text-[#191c1d] font-medium">{patient.email || '—'}</p>
              </div>
            </div>

            {editMode && (
              <form onSubmit={(e) => { e.preventDefault(); save(); }} className="border-t border-slate-100 pt-4 sm:pt-6 space-y-3 sm:space-y-4">
                <Input
                  label="Full name"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />
                <Input
                  label="Phone"
                  value={form.phoneNumber}
                  onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                />
                <Input
                  label="Email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <Input
                  label="Address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
                <Input
                  label="Blood group"
                  value={form.bloodGroup}
                  onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                />
                <Input
                  label="Medical history"
                  value={form.medicalHistory}
                  onChange={(e) => setForm({ ...form, medicalHistory: e.target.value })}
                />
                <Input
                  label="Allergies"
                  value={form.allergies}
                  onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                />
                <Input
                  label="Emergency contact"
                  value={form.emergencyContact}
                  onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })}
                />
                <Input
                  label="Notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1">Save changes</Button>
                  <Button type="button" variant="secondary" onClick={() => setEditMode(false)} className="flex-1">Cancel</Button>
                </div>
              </form>
            )}

            {!editMode && (
              <Button onClick={() => setEditMode(true)} className="w-full">
                Edit Patient
              </Button>
            )}
          </div>
        </Card>

        <Card className="shadow-[0_4px_20px_rgba(0,0,0,0.08)] border-0 bg-gradient-to-br from-white to-[#f8f9fa]">
          <div className="p-4 sm:p-6 space-y-4">
            <h2 className="text-lg sm:text-xl font-bold text-[#191c1d]">Quick Actions</h2>
            <div className="space-y-3">
              {!editMode && (
                <Button onClick={() => setEditMode(true)} className="w-full">
                  Edit Patient
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>

      <Card className="shadow-[0_4px_20px_rgba(0,0,0,0.08)] border-0 bg-gradient-to-br from-white to-[#f8f9fa]">
        <CardHeader title="Appointments" />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Time</th>
                <th className="px-5 py-3">Doctor</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Reason</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((a) => (
                <tr key={a.id} className="border-t border-slate-100">
                  <td className="px-5 py-3">{formatDate(a.appointmentDate)}</td>
                  <td className="px-5 py-3">{formatTime(a.startTime)} – {formatTime(a.endTime)}</td>
                  <td className="px-5 py-3">{a.doctorName}</td>
                  <td className="px-5 py-3">
                    <Badge>{appointmentStatusLabels[a.status]}</Badge>
                  </td>
                  <td className="px-5 py-3">{a.reason || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {appointments.length === 0 && <EmptyState message="No appointments." />}
        </div>
      </Card>
    </div>
  );
}
