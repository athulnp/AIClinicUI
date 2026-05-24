import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
import { SearchFilter, useDebouncedSearch } from '../components/SearchFilter';

export function AppointmentsPage() {
  const { needsClinicContext, isSuperAdmin, selectedClinicId } = useAuth();
  const [items, setItems] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const { searchQuery, setSearchQuery, filteredItems } = useDebouncedSearch(
    items,
    ['patientName' as keyof Appointment, 'doctorName' as keyof Appointment, 'reason' as keyof Appointment]
  );
  const [showCreate, setShowCreate] = useState(false);
  const [showReschedule, setShowReschedule] = useState<Appointment | null>(null);
  const [showEdit, setShowEdit] = useState<Appointment | null>(null);
  const [showCancel, setShowCancel] = useState<Appointment | null>(null);
  const [showComplete, setShowComplete] = useState<Appointment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    patientId: '',
    doctorId: '',
    appointmentDate: '',
    startTime: '09:00',
    endTime: '09:30',
    reason: '',
    description: '',
  });
  const [rescheduleForm, setRescheduleForm] = useState({
    newAppointmentDate: '',
    newStartTime: '09:00',
    newEndTime: '09:30',
  });
  const [completionNotesForm, setCompletionNotesForm] = useState('');
  const [editForm, setEditForm] = useState({
    reason: '',
    description: '',
    notes: '',
  });

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
    } catch (err) {
      console.error('Error loading appointments:', err);
      setError(err instanceof ApiError ? err.message : 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [needsClinicContext, selectedClinicId]);

  const create = async () => {
    setError(null);
    try {
      const body: Record<string, unknown> = {
        patientId: Number(form.patientId),
        doctorId: Number(form.doctorId),
        appointmentDate: form.appointmentDate,
        startTime: toTimeSpan(form.startTime),
        endTime: toTimeSpan(form.endTime),
        reason: form.reason || undefined,
        description: form.description || undefined,
      };
      if (isSuperAdmin && selectedClinicId) {
        body.clinicId = selectedClinicId;
      }
      await appointmentsApi.create(body);
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

  const cancel = async () => {
    if (!showCancel) return;
    setError(null);
    try {
      await appointmentsApi.cancel(showCancel.id);
      setShowCancel(null);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Cancellation failed');
    }
  };

  const edit = async () => {
    if (!showEdit) return;
    setError(null);
    try {
      await appointmentsApi.update(showEdit.id, {
        reason: editForm.reason || undefined,
        description: editForm.description || undefined,
        notes: editForm.notes || undefined,
      });
      setShowEdit(null);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to update appointment');
    }
  };

  const complete = async () => {
    if (!showComplete) return;
    setError(null);
    try {
      // First add a note if content is provided
      if (completionNotesForm.trim()) {
        await appointmentsApi.addNote(showComplete.id, {
          content: completionNotesForm,
          noteType: 'Clinical',
        });
      }
      // Then update the appointment status to Completed
      await appointmentsApi.updateStatus(showComplete.id, {
        status: AppointmentStatus.Completed,
      });
      setShowComplete(null);
      setCompletionNotesForm('');
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Completion failed');
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
      {error && <Alert message={error} />}
      <Card>
        <CardHeader title="Appointments" action={<Button onClick={() => setShowCreate(true)}>Book appointment</Button>} />
        <div className="p-4 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <SearchFilter
              placeholder="Search by patient, doctor, or reason..."
              onSearch={setSearchQuery}
              className="w-full sm:max-w-md"
            />
            <p className="text-sm text-slate-500">
              {filteredItems.length} appointment{filteredItems.length !== 1 ? 's' : ''} found
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Time</th>
                <th className="px-5 py-3">Patient</th>
                <th className="px-5 py-3">Doctor</th>
                <th className="px-5 py-3">Description</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((a) => (
                <tr key={a.id} className="border-t border-slate-100">
                  <td className="px-5 py-3">{formatDate(a.appointmentDate)}</td>
                  <td className="px-5 py-3">{formatTime(a.startTime)} – {formatTime(a.endTime)}</td>
                  <td className="px-5 py-3">{a.patientName}</td>
                  <td className="px-5 py-3">{a.doctorName}</td>
                  <td className="px-5 py-3 text-slate-600">{a.description || '-'}</td>
                  <td className="px-5 py-3">
                    <Badge tone={statusTone(a.status)}>{appointmentStatusLabels[a.status]}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right space-x-1">
                    <Link to={`/appointments/${a.id}`}>
                      <Button variant="ghost">Details</Button>
                    </Link>
                    <Button variant="ghost" onClick={() => { setShowEdit(a); setEditForm({ reason: a.reason || '', description: a.description || '', notes: a.notes || '' }); }}>Edit</Button>
                    {a.status === AppointmentStatus.Scheduled && (
                      <>
                        <Button variant="ghost" onClick={() => { setShowReschedule(a); setRescheduleForm({ newAppointmentDate: a.appointmentDate.split('T')[0], newStartTime: a.startTime.split(':')[0] + ':' + a.startTime.split(':')[1], newEndTime: a.endTime.split(':')[0] + ':' + a.endTime.split(':')[1] }); }}>Reschedule</Button>
                        <Button variant="ghost" onClick={() => setShowComplete(a)}>Complete</Button>
                        <Button variant="ghost" onClick={() => setShowCancel(a)}>Cancel</Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredItems.length === 0 && (
            <EmptyState 
              message={searchQuery ? `No appointments found matching "${searchQuery}".` : "No appointments."} 
            />
          )}
        </div>
      </Card>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Book appointment">
        {error && <Alert message={error} />}
        {isSuperAdmin && selectedClinicId && (
          <div className="mb-3">
            <label className="text-sm font-medium text-slate-700">Clinic</label>
            <p className="mt-1 text-sm text-slate-600">Creating for currently selected clinic (ID: {selectedClinicId})</p>
          </div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); create(); }} className="space-y-3">
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
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="mt-3 sm:mt-4 flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowCreate(false)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">Book</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!showReschedule} onClose={() => setShowReschedule(null)} title="Reschedule appointment">
        {error && <Alert message={error} />}
        <form onSubmit={(e) => { e.preventDefault(); reschedule(); }} className="space-y-3">
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
          <div className="mt-3 sm:mt-4 flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowReschedule(null)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">Reschedule</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!showEdit} onClose={() => setShowEdit(null)} title="Edit appointment">
        {error && <Alert message={error} />}
        {showEdit && (
          <form onSubmit={(e) => { e.preventDefault(); edit(); }}>
            <div className="mb-3 sm:mb-4 space-y-2 pb-4 border-b text-xs sm:text-sm">
              <div>
                <span className="font-medium text-slate-700">Patient:</span> {showEdit.patientName}
              </div>
              <div>
                <span className="font-medium text-slate-700">Doctor:</span> {showEdit.doctorName}
              </div>
              <div>
                <span className="font-medium text-slate-700">Date:</span> {formatDate(showEdit.appointmentDate)} at {formatTime(showEdit.startTime)}
              </div>
            </div>
            <div className="space-y-3">
              <Input
                label="Reason"
                value={editForm.reason}
                onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
              />
              <Input
                label="Description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
              <Input
                label="Notes"
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              />
            </div>
            <div className="mt-3 sm:mt-4 flex gap-2">
              <Button type="button" variant="secondary" onClick={() => setShowEdit(null)} className="flex-1">Cancel</Button>
              <Button type="submit" className="flex-1">Save</Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={!!showCancel} onClose={() => setShowCancel(null)} title="Cancel appointment">
        {error && <Alert message={error} />}
        {showCancel && (
          <form onSubmit={(e) => { e.preventDefault(); cancel(); }}>
            <div className="mb-4 space-y-2 pb-4 border-b text-sm">
              <div>
                <span className="font-medium text-slate-700">Patient:</span> {showCancel.patientName}
              </div>
              <div>
                <span className="font-medium text-slate-700">Doctor:</span> {showCancel.doctorName}
              </div>
              <div>
                <span className="font-medium text-slate-700">Date:</span> {formatDate(showCancel.appointmentDate)} at {formatTime(showCancel.startTime)}
              </div>
            </div>
            <p className="text-slate-600 mb-6">Are you sure you want to cancel this appointment? This action cannot be undone.</p>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => setShowCancel(null)} className="flex-1">No, keep it</Button>
              <Button type="submit" variant="danger" className="flex-1">Yes, cancel appointment</Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={!!showComplete} onClose={() => setShowComplete(null)} title="Complete appointment">
        {error && <Alert message={error} />}
        {showComplete && (
          <form onSubmit={(e) => { e.preventDefault(); complete(); }}>
            <div className="mb-3 sm:mb-4 space-y-2 pb-4 border-b text-xs sm:text-sm">
              <div>
                <span className="font-medium text-slate-700">Patient:</span> {showComplete.patientName}
              </div>
              <div>
                <span className="font-medium text-slate-700">Doctor:</span> {showComplete.doctorName}
              </div>
              <div>
                <span className="font-medium text-slate-700">Date:</span> {formatDate(showComplete.appointmentDate)} at {formatTime(showComplete.startTime)}
              </div>
            </div>
            <p className="text-slate-600 mb-3 sm:mb-4 text-sm">Add any notes before completing this appointment (optional).</p>
            <Input
              label="Notes"
              type="textarea"
              value={completionNotesForm}
              onChange={(e) => setCompletionNotesForm(e.target.value)}
              placeholder="Enter completion notes..."
            />
            <div className="mt-3 sm:mt-4 flex gap-2">
              <Button type="button" variant="secondary" onClick={() => setShowComplete(null)} className="flex-1">Cancel</Button>
              <Button type="submit" className="flex-1">Complete Appointment</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
