import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { appointmentsApi, doctorsApi, patientsApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { AppointmentStatus, type Appointment, type Doctor, type Patient } from '../types';
import { appointmentStatusLabels, formatDate, formatTime } from '../utils/labels';
import { Alert, Badge, Button, Card, CardHeader, EmptyState, Input, PageLoader } from '../components/ui';

export function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { needsClinicContext } = useAuth();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [rescheduleMode, setRescheduleMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    newAppointmentDate: '',
    newStartTime: '09:00',
    newEndTime: '09:30',
  });
  const [notesForm, setNotesForm] = useState('');

  useEffect(() => {
    if (needsClinicContext || !id) return;
    load();
  }, [id, needsClinicContext]);

  const load = async () => {
    setLoading(true);
    try {
      const [app, p, d] = await Promise.all([
        appointmentsApi.get(Number(id)),
        patientsApi.list({ pageNumber: 1, pageSize: 100 }),
        doctorsApi.list(),
      ]);
      setAppointment(app);
      setPatients(p.data);
      setDoctors(d);
      setNotesForm('');
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!id) return;
    setError(null);
    try {
      await appointmentsApi.reschedule(Number(id), {
        newAppointmentDate: form.newAppointmentDate,
        newStartTime: form.newStartTime,
        newEndTime: form.newEndTime,
      });
      setRescheduleMode(false);
      await load();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    }
  };

  const handleUpdateStatus = async (status: AppointmentStatus) => {
    if (!id) return;
    setError(null);
    try {
      await appointmentsApi.updateStatus(Number(id), {
        status,
        notes: notesForm || undefined,
      });
      await load();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    setError(null);
    try {
      await appointmentsApi.cancel(Number(id));
      navigate('/appointments');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    }
  };

  if (loading) return <PageLoader />;
  if (!appointment) return <EmptyState message="Appointment not found" />;

  const patient = patients.find((p) => p.id === appointment.patientId);
  const doctor = doctors.find((d) => d.id === appointment.doctorId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Appointment #{appointment.id}</h1>
          <p className="mt-1 text-slate-500">
            {formatDate(appointment.appointmentDate)} at {formatTime(appointment.startTime)}
          </p>
        </div>
        <button onClick={() => navigate('/appointments')} className="text-slate-600 hover:text-slate-900">
          ← Back
        </button>
      </div>

      {error && <Alert message={error} />}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader title="Appointment Details" />
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Status</label>
              <Badge tone="default">{appointmentStatusLabels[appointment.status]}</Badge>
            </div>
            {patient && (
              <div>
                <label className="text-sm font-medium text-slate-700">Patient</label>
                <p className="mt-1 text-slate-900">{patient.fullName}</p>
              </div>
            )}
            {doctor && (
              <div>
                <label className="text-sm font-medium text-slate-700">Doctor</label>
                <p className="mt-1 text-slate-900">{doctor.userId}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-slate-700">Date & Time</label>
              <p className="mt-1 text-slate-900">
                {formatDate(appointment.appointmentDate)} {formatTime(appointment.startTime)} -{' '}
                {formatTime(appointment.endTime)}
              </p>
            </div>
            {appointment.reason && (
              <div>
                <label className="text-sm font-medium text-slate-700">Reason</label>
                <p className="mt-1 text-slate-900">{appointment.reason}</p>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Actions" />
          <div className="space-y-3">
            {appointment.status === AppointmentStatus.Scheduled && (
              <>
                <Button onClick={() => setRescheduleMode(!rescheduleMode)} className="w-full" variant={rescheduleMode ? 'secondary' : 'primary'}>
                  {rescheduleMode ? 'Cancel Reschedule' : 'Reschedule'}
                </Button>
                <Button onClick={handleCancel} className="w-full" variant="danger">
                  Cancel Appointment
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>

      {rescheduleMode && (
        <Card>
          <CardHeader title="Reschedule Appointment" />
          <div className="space-y-4">
            <Input
              label="New Date"
              type="date"
              value={form.newAppointmentDate}
              onChange={(e) => setForm({ ...form, newAppointmentDate: e.target.value })}
              required
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Start Time"
                type="time"
                value={form.newStartTime}
                onChange={(e) => setForm({ ...form, newStartTime: e.target.value })}
              />
              <Input
                label="End Time"
                type="time"
                value={form.newEndTime}
                onChange={(e) => setForm({ ...form, newEndTime: e.target.value })}
              />
            </div>
            <Button onClick={handleReschedule} className="w-full">
              Confirm Reschedule
            </Button>
          </div>
        </Card>
      )}

            {appointment.status === AppointmentStatus.Completed && (
        <Card>
          <CardHeader title="Complete Appointment" />
          <div className="space-y-4">
            <Input
              label="Notes"
              type="textarea"
              value={notesForm}
              onChange={(e) => setNotesForm(e.target.value)}
              placeholder="Add notes before completing..."
            />
            <Button onClick={() => handleUpdateStatus(AppointmentStatus.Completed)} className="w-full">
              Complete with Notes
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
