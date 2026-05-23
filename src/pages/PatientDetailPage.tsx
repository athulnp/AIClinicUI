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
    <div className="max-w-4xl space-y-6">
      <Button variant="secondary" onClick={() => navigate('/patients')}>← Back</Button>

      <Card>
        <CardHeader
          title={patient.fullName}
          action={editMode ? null : <Button onClick={() => setEditMode(true)}>Edit</Button>}
        />
        {error && <Alert message={error} />}

        <div className="grid grid-cols-2 gap-6 border-b border-slate-100 p-5">
          <div>
            <p className="text-xs font-medium text-slate-500">Patient Code</p>
            <p className="mt-1 text-sm font-medium">{patient.patientCode}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Gender</p>
            <p className="mt-1 text-sm font-medium">{['', 'Male', 'Female', 'Other'][patient.gender]}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Date of Birth</p>
            <p className="mt-1 text-sm font-medium">{formatDate(patient.dateOfBirth)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Blood Group</p>
            <p className="mt-1 text-sm font-medium">{patient.bloodGroup || '—'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 border-b border-slate-100 p-5">
          <div>
            <p className="text-xs font-medium text-slate-500">Phone</p>
            <p className="mt-1 text-sm">{patient.phoneNumber}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Email</p>
            <p className="mt-1 text-sm">{patient.email || '—'}</p>
          </div>
        </div>

        {editMode && (
          <div className="space-y-3 p-5">
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
              <Button onClick={save}>Save changes</Button>
              <Button variant="secondary" onClick={() => setEditMode(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title="Appointments" />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
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
