import { useEffect, useState } from 'react';
import { ApiError } from '../api/client';
import { appointmentsApi, doctorsApi, patientsApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { AppointmentStatus, type Appointment, type Doctor, type Patient } from '../types';
import { appointmentStatusLabels, formatDate, formatTime, toTimeSpan } from '../utils/labels';
import {
  Alert,
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
  const [showReschedule, setShowReschedule] = useState<Appointment | null>(null);
  const [showNotes, setShowNotes] = useState<Appointment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    patientId: '',
    doctorId: '',
    appointmentDate: '',
    startTime: '09:00',
    endTime: '09:30',
    reason: '',
  });
  const [rescheduleForm, setRescheduleForm] = useState({
    newAppointmentDate: '',
    newStartTime: '09:00',
    newEndTime: '09:30',
  });
  const [notesForm, setNotesForm] = useState('');

  const load = async () => {
    if (needsClinicContext) return;
    setLoading(true);
    try {
      const [a, p, d] = await Promise.all([
        appointmentsApi.list({ pageNumber: 1, pageSize: 20 }),
        patientsApi.list({ pageNumber: 1, pageSize: 100 }),
        doctorsApi.list(),
      ]);
      setItems(a.data);
      setPatients(p.data);
      setDoctors(d);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [needsClinicContext]);

  const create = async () => {
    setError(null);
    try {
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
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to book appointment');
    }
  };

  const reschedule = async () => {
    if (!showReschedule) return;
    setError(null);
    try {
      await appointmentsApi.reschedule(showReschedule.id, {
        newAppointmentDate: rescheduleForm.newAppointmentDate,
        newStartTime: toTimeSpan(rescheduleForm.newStartTime),
        newEndTime: toTimeSpan(rescheduleForm.newEndTime),
      });
      setShowReschedule(null);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to reschedule');
    }
  };

  const updateNotes = async () => {
    if (!showNotes) return;
    setError(null);
    try {
      await appointmentsApi.updateStatus(showNotes.id, { status: showNotes.status, notes: notesForm });
      setShowNotes(null);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to update notes');
    }
  };

  const setStatus = async (id: number, status: AppointmentStatus) => {
    try {
      await appointmentsApi.updateStatus(id, { status });
      load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Status update failed');
    }
  };

  const cancel = async (id: number) => {
    if (!confirm('Cancel appointment?')) return;
    try {
      await appointmentsApi.cancel(id);
      load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Cancellation failed');
    }
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
                        <Button variant="ghost" onClick={() => { setShowReschedule(a); setRescheduleForm({ newAppointmentDate: a.appointmentDate.split('T')[0], newStartTime: a.startTime.split(':')[0] + ':' + a.startTime.split(':')[1], newEndTime: a.endTime.split(':')[0] + ':' + a.endTime.split(':')[1] }); }}>Reschedule</Button>
                        <Button variant="ghost" onClick={() => { setShowNotes(a); setNotesForm(a.notes || ''); }}>Notes</Button>
                        <Button variant="ghost" onClick={() => setStatus(a.id, AppointmentStatus.Completed)}>Complete</Button>
                        <Button variant="ghost" onClick={() => cancel(a.id)}>Cancel</Button>
                      </>
                    )}
                    {a.status !== AppointmentStatus.Scheduled && (
                      <Button variant="ghost" onClick={() => { setShowNotes(a); setNotesForm(a.notes || ''); }}>View</Button>
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
        {error && <Alert message={error} />}
        <div className="space-y-3">
          <Select
            label="Patient"
            value={form.patientId}
            onChange={(e) => setForm({ ...form, patientId: e.target.value })}
            options={[{ value: '', label: 'Select…' }, ...patients.map((p) => ({ value: p.id, label: p.fullName }))]}
          />
          <Select
            label="Doctor"
            value={form.doctorId}
            onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
            options={[{ value: '', label: 'Select…' }, ...doctors.map((d) => ({ value: d.id, label: `${d.fullName} - ${d.specialization}` }))]}
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

      <Modal open={!!showReschedule} onClose={() => setShowReschedule(null)} title="Reschedule appointment">
        {error && <Alert message={error} />}
        <div className="space-y-3">
          <Input
            label="New date"
            type="date"
            value={rescheduleForm.newAppointmentDate}
            onChange={(e) => setRescheduleForm({ ...rescheduleForm, newAppointmentDate: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start time"
              type="time"
              value={rescheduleForm.newStartTime}
              onChange={(e) => setRescheduleForm({ ...rescheduleForm, newStartTime: e.target.value })}
            />
            <Input
              label="End time"
              type="time"
              value={rescheduleForm.newEndTime}
              onChange={(e) => setRescheduleForm({ ...rescheduleForm, newEndTime: e.target.value })}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setShowReschedule(null)}>Cancel</Button>
          <Button onClick={reschedule}>Reschedule</Button>
        </div>
      </Modal>

      <Modal open={!!showNotes} onClose={() => setShowNotes(null)} title="Appointment notes">
        {error && <Alert message={error} />}
        {showNotes && (
          <>
            <div className="mb-4 space-y-2 pb-4 border-b text-sm">
              <div>
                <span className="font-medium text-slate-700">Patient:</span> {showNotes.patientName}
              </div>
              <div>
                <span className="font-medium text-slate-700">Doctor:</span> {showNotes.doctorName}
              </div>
              <div>
                <span className="font-medium text-slate-700">Date:</span> {formatDate(showNotes.appointmentDate)} at {formatTime(showNotes.startTime)}
              </div>
              {showNotes.reason && (
                <div>
                  <span className="font-medium text-slate-700">Reason:</span> {showNotes.reason}
                </div>
              )}
            </div>
            <Input
              label="Notes"
              value={notesForm}
              onChange={(e) => setNotesForm(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowNotes(null)}>Close</Button>
              {showNotes.status === AppointmentStatus.Scheduled && <Button onClick={updateNotes}>Save notes</Button>}
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
