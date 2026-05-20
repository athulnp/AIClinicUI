import { useEffect, useState } from 'react';
import { appointmentsApi, doctorsApi, patientsApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { AppointmentStatus, type Appointment, type Doctor, type Patient } from '../types';
import { appointmentStatusLabels, formatDate, formatTime, toTimeSpan } from '../utils/labels';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Input,
  Modal,
  PageLoader,
  Select,
} from '../components/ui';

export function AppointmentsPage() {
  const { needsClinicContext } = useAuth();
  const [items, setItems] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    patientId: '',
    doctorId: '',
    appointmentDate: '',
    startTime: '09:00',
    endTime: '09:30',
    reason: '',
  });

  const load = async () => {
    if (needsClinicContext) return;
    setLoading(true);
    const [a, p, d] = await Promise.all([
      appointmentsApi.list({ pageNumber: 1, pageSize: 20 }),
      patientsApi.list({ pageNumber: 1, pageSize: 100 }),
      doctorsApi.list(),
    ]);
    setItems(a.data);
    setPatients(p.data);
    setDoctors(d);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [needsClinicContext]);

  const create = async () => {
    await appointmentsApi.create({
      patientId: Number(form.patientId),
      doctorId: Number(form.doctorId),
      appointmentDate: form.appointmentDate,
      startTime: toTimeSpan(form.startTime),
      endTime: toTimeSpan(form.endTime),
      reason: form.reason || undefined,
    });
    setShowCreate(false);
    load();
  };

  const setStatus = async (id: number, status: AppointmentStatus) => {
    await appointmentsApi.updateStatus(id, { status });
    load();
  };

  const cancel = async (id: number) => {
    if (!confirm('Cancel appointment?')) return;
    await appointmentsApi.cancel(id);
    load();
  };

  const statusTone = (s: AppointmentStatus) => {
    if (s === AppointmentStatus.Completed) return 'success';
    if (s === AppointmentStatus.Cancelled || s === AppointmentStatus.NoShow) return 'danger';
    return 'warn';
  };

  if (needsClinicContext) return <EmptyState message="Select a clinic to manage appointments." />;
  if (loading) return <PageLoader />;

  return (
    <div>
      <Card>
        <CardHeader title="Appointments" action={<Button onClick={() => setShowCreate(true)}>Book appointment</Button>} />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Time</th>
                <th className="px-5 py-3">Patient</th>
                <th className="px-5 py-3">Doctor</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id} className="border-t border-slate-100">
                  <td className="px-5 py-3">{formatDate(a.appointmentDate)}</td>
                  <td className="px-5 py-3">{formatTime(a.startTime)} – {formatTime(a.endTime)}</td>
                  <td className="px-5 py-3">{a.patientName}</td>
                  <td className="px-5 py-3">{a.doctorName}</td>
                  <td className="px-5 py-3">
                    <Badge tone={statusTone(a.status)}>{appointmentStatusLabels[a.status]}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right space-x-1">
                    {a.status === AppointmentStatus.Scheduled && (
                      <>
                        <Button variant="ghost" onClick={() => setStatus(a.id, AppointmentStatus.Completed)}>Complete</Button>
                        <Button variant="ghost" onClick={() => cancel(a.id)}>Cancel</Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && <EmptyState message="No appointments." />}
        </div>
      </Card>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Book appointment">
        <div className="space-y-3">
          <Select
            label="Patient"
            value={form.patientId}
            onChange={(e) => setForm({ ...form, patientId: e.target.value })}
            options={[{ value: '', label: 'Select…' }, ...patients.map((p) => ({ value: p.id, label: p.fullName }))]}
          />
          <Select
            label="Doctor (user id)"
            value={form.doctorId}
            onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
            options={[{ value: '', label: 'Select…' }, ...doctors.map((d) => ({ value: d.userId, label: d.fullName }))]}
          />
          <Input label="Date" type="date" value={form.appointmentDate} onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            <Input label="End" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
          </div>
          <Input label="Reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
          <Button onClick={create}>Book</Button>
        </div>
      </Modal>
    </div>
  );
}
