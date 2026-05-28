import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { appointmentsApi, doctorsApi, patientsApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { AppointmentStatus, type Appointment, type AppointmentNote, type Doctor, type Patient } from '../types';
import { appointmentStatusLabels, formatDate, formatTime } from '../utils/labels';
import { Alert, Badge, Button, Card, EmptyState, Input, Modal, PageLoader } from '../components/ui';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { TreatmentNoteGenerator } from '../components/TreatmentNoteGenerator';

export function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { needsClinicContext } = useAuth();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [notes, setNotes] = useState<AppointmentNote[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showCancel, setShowCancel] = useState(false);
  const [rescheduleMode, setRescheduleMode] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; noteId: number | null }>({
    isOpen: false,
    noteId: null,
  });
  const [form, setForm] = useState({
    newAppointmentDate: '',
    newStartTime: '09:00',
    newEndTime: '09:30',
  });
  const [notesForm, setNotesForm] = useState({
    content: '',
    noteType: 'Clinical',
  });

  useEffect(() => {
    if (needsClinicContext || !id) return;
    load();
  }, [id, needsClinicContext]);

  const load = async () => {
    setLoading(true);
    try {
      const [app, p, d, n] = await Promise.all([
        appointmentsApi.get(Number(id)),
        patientsApi.list({ pageNumber: 1, pageSize: 100 }),
        doctorsApi.list(),
        appointmentsApi.notes(Number(id)),
      ]);
      setAppointment(app);
      setPatients(p.data);
      setDoctors(d);
      setNotes(n.data || []);
      setNotesForm({ content: '', noteType: 'Clinical' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!id) return;
    setError(null);
    try {
      await appointmentsApi.addNote(Number(id), {
        content: notesForm.content,
        noteType: notesForm.noteType,
      });
      setShowAddNote(false);
      setNotesForm({ content: '', noteType: 'Clinical' });
      await load();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    setConfirmDialog({ isOpen: true, noteId });
  };

  const handleConfirmDeleteNote = async () => {
    if (!id || !confirmDialog.noteId) return;
    setError(null);
    try {
      await appointmentsApi.deleteNote(Number(id), confirmDialog.noteId);
      setConfirmDialog({ isOpen: false, noteId: null });
      await load();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    }
  };

  const handleComplete = async () => {
    if (!id) return;
    setError(null);
    try {
      // First add a note if content is provided
      if (notesForm.content.trim()) {
        await appointmentsApi.addNote(Number(id), {
          content: notesForm.content,
          noteType: 'Clinical',
        });
      }
      // Then update the appointment status to Completed
      await appointmentsApi.updateStatus(Number(id), {
        status: AppointmentStatus.Completed,
      });
      setShowComplete(false);
      setNotesForm({ content: '', noteType: 'Clinical' });
      await load();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
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

  const statusTone = (s: AppointmentStatus) => {
    if (s === AppointmentStatus.Completed) return 'success';
    if (s === AppointmentStatus.Cancelled || s === AppointmentStatus.NoShow) return 'danger';
    return 'warn';
  };

  if (loading) return <PageLoader />;
  if (!appointment) return <EmptyState message="Appointment not found" />;

  const patient = patients.find((p) => p.id === appointment.patientId);
  const doctor = doctors.find((d) => d.id === appointment.doctorId);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#191c1d]">Appointment Details</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-[#404850]">
            #{appointment.id} • {formatDate(appointment.appointmentDate)} at {formatTime(appointment.startTime)}
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/appointments')} className="w-full sm:w-auto">
          ← Back
        </Button>
      </div>

      {error && <Alert message={error} />}

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <Card className="shadow-[0_4px_20px_rgba(0,0,0,0.08)] border-0 bg-gradient-to-br from-white to-[#f8f9fa]">
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#191c1d]">Appointment Information</h2>
                  <p className="mt-1 text-sm text-[#404850]">Key details about this appointment</p>
                </div>
                <Badge tone={statusTone(appointment.status)}>
                  {appointmentStatusLabels[appointment.status]}
                </Badge>
              </div>

              <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-500 uppercase tracking-wide">Date & Time</label>
                  <div className="flex items-center gap-2 text-slate-900">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">{formatDate(appointment.appointmentDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{formatTime(appointment.startTime)} – {formatTime(appointment.endTime)}</span>
                  </div>
                </div>

                {patient && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-500 uppercase tracking-wide">Patient</label>
                    <div className="flex items-center gap-2 text-slate-900">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="font-medium">{patient.fullName}</span>
                    </div>
                    {patient.phoneNumber && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span>{patient.phoneNumber}</span>
                      </div>
                    )}
                  </div>
                )}

                {doctor && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-500 uppercase tracking-wide">Doctor</label>
                    <div className="flex items-center gap-2 text-slate-900">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">{doctor.fullName}</span>
                    </div>
                    {doctor.specialization && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                        <span>{doctor.specialization}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {(appointment.reason || appointment.description) && (
                <div className="pt-6 border-t border-slate-100 space-y-4">
                  {appointment.reason && (
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-500 uppercase tracking-wide">Reason</label>
                      <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">{appointment.reason}</p>
                    </div>
                  )}
                  {appointment.description && (
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-500 uppercase tracking-wide">Description</label>
                      <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">{appointment.description}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          <Card className="shadow-[0_4px_20px_rgba(0,0,0,0.08)] border-0 bg-gradient-to-br from-white to-[#f8f9fa]">
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h2 className="text-lg sm:text-xl font-bold text-[#191c1d]">Notes</h2>
                <Button onClick={() => setShowAddNote(true)} className="w-full sm:w-auto text-sm">
                  + Add Note
                </Button>
              </div>
              {notes.length === 0 ? (
                <p className="text-slate-500 text-sm">No notes added yet.</p>
              ) : (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="bg-slate-50 p-4 rounded-lg space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {note.noteType && (
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide bg-white px-2 py-1 rounded">
                              {note.noteType}
                            </span>
                          )}
                          <span className="text-xs text-slate-400">{formatDate(note.createdAt)}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-slate-400 hover:text-red-600 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                      <p className="text-slate-900 whitespace-pre-wrap">{note.content}</p>
                      <p className="text-xs text-slate-500">By {note.createdByUser}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <TreatmentNoteGenerator
            patientId={appointment.patientId}
            appointmentId={appointment.id}
            onSave={load}
          />
        </div>

        <div className="space-y-4 sm:space-y-6">
          <Card className="shadow-[0_4px_20px_rgba(0,0,0,0.08)] border-0 bg-gradient-to-br from-white to-[#f8f9fa]">
            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[#191c1d]">Actions</h2>
                <p className="text-sm text-[#404850]">Manage this appointment</p>
              </div>
              <div className="space-y-3">
                {appointment.status === AppointmentStatus.Scheduled && (
                  <>
                    <Button onClick={() => setShowComplete(true)} className="w-full" variant="primary">
                      Complete Appointment
                    </Button>
                    <Button onClick={() => setRescheduleMode(!rescheduleMode)} className="w-full" variant={rescheduleMode ? 'secondary' : 'primary'}>
                      {rescheduleMode ? 'Cancel Reschedule' : 'Reschedule Appointment'}
                    </Button>
                    <Button onClick={() => setShowCancel(true)} className="w-full" variant="danger">
                      Cancel Appointment
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>

          {rescheduleMode && (
            <Card className="shadow-[0_4px_20px_rgba(0,0,0,0.08)] border-0 bg-gradient-to-br from-white to-[#f8f9fa]">
              <div className="p-4 sm:p-6 space-y-4">
                <h2 className="text-lg sm:text-xl font-bold text-[#191c1d]">Reschedule Appointment</h2>
                <div className="space-y-4">
                  <Input
                    label="New Date"
                    type="date"
                    value={form.newAppointmentDate}
                    onChange={(e) => setForm({ ...form, newAppointmentDate: e.target.value })}
                    required
                  />
                  <div className="grid gap-4 grid-cols-2">
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
              </div>
            </Card>
          )}
        </div>
      </div>

      <Modal open={showCancel} onClose={() => setShowCancel(false)} title="Cancel appointment">
        {error && <Alert message={error} />}
        <form onSubmit={(e) => { e.preventDefault(); handleCancel(); }} className="space-y-4">
          <div className="space-y-2 pb-4 border-b text-sm">
            <div>
              <span className="font-medium text-slate-700">Patient:</span> {patient?.fullName}
            </div>
            <div>
              <span className="font-medium text-slate-700">Doctor:</span> {doctor?.fullName}
            </div>
            <div>
              <span className="font-medium text-slate-700">Date:</span> {formatDate(appointment.appointmentDate)} at {formatTime(appointment.startTime)}
            </div>
          </div>
          <p className="text-slate-600">Are you sure you want to cancel this appointment? This action cannot be undone.</p>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowCancel(false)} className="flex-1">No, keep it</Button>
            <Button type="submit" variant="danger" className="flex-1">Yes, cancel appointment</Button>
          </div>
        </form>
      </Modal>

      <Modal open={showAddNote} onClose={() => setShowAddNote(false)} title="Add note">
        {error && <Alert message={error} />}
        <form onSubmit={(e) => { e.preventDefault(); handleAddNote(); }} className="space-y-3 sm:space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Note Type</label>
            <select
              value={notesForm.noteType}
              onChange={(e) => setNotesForm({ ...notesForm, noteType: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 sm:px-4 py-2.5 sm:py-3 text-slate-900 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-900/5 text-sm"
            >
              <option value="Clinical">Clinical</option>
              <option value="Administrative">Administrative</option>
              <option value="PatientCommunication">Patient Communication</option>
            </select>
          </div>
          <Input
            label="Content"
            type="textarea"
            value={notesForm.content}
            onChange={(e) => setNotesForm({ ...notesForm, content: e.target.value })}
            placeholder="Enter note content..."
          />
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowAddNote(false)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">Add Note</Button>
          </div>
        </form>
      </Modal>

      <Modal open={showComplete} onClose={() => setShowComplete(false)} title="Complete appointment">
        {error && <Alert message={error} />}
        <form onSubmit={(e) => { e.preventDefault(); handleComplete(); }} className="space-y-3 sm:space-y-4">
          <p className="text-slate-600">Add any notes before completing this appointment (optional).</p>
          <Input
            label="Notes"
            type="textarea"
            value={notesForm.content}
            onChange={(e) => setNotesForm({ ...notesForm, content: e.target.value })}
            placeholder="Enter completion notes..."
          />
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowComplete(false)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">Complete Appointment</Button>
          </div>
        </form>
      </Modal>

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, noteId: null })}
        onConfirm={handleConfirmDeleteNote}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
