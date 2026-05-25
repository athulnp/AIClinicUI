import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { doctorsApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { type Doctor } from '../types';
import { Alert, Button, Card, Input, PageLoader } from '../components/ui';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { ValidationError } from '../components/ValidationError';
import { updateDoctorSchema } from '../validations/doctorValidation';
import { useFormValidation } from '../hooks/useFormValidation';

export function DoctorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { needsClinicContext } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean }>({ isOpen: false });
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    specialization: '',
    licenseNumber: '',
    yearsOfExperience: '0',
    consultationFee: '',
    department: '',
    bio: '',
    isAvailable: true,
  });

  const updateValidation = useFormValidation(
    updateDoctorSchema,
    async (data) => {
      if (!id) return;
      await doctorsApi.update(Number(id), {
        ...data,
        yearsOfExperience: Number(data.yearsOfExperience),
        consultationFee: Number(data.consultationFee),
      });
      setEditMode(false);
      await load();
    }
  );

  useEffect(() => {
    if (needsClinicContext || !id) return;
    load();
  }, [id, needsClinicContext]);

  const load = async () => {
    setLoading(true);
    try {
      const doc = await doctorsApi.get(Number(id));
      setDoctor(doc);
      setForm({
        specialization: doc.specialization || '',
        licenseNumber: doc.licenseNumber || '',
        yearsOfExperience: String(doc.yearsOfExperience || 0),
        consultationFee: String(doc.consultationFee || ''),
        department: doc.department || '',
        bio: doc.bio || '',
        isAvailable: doc.isAvailable ?? true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setError(null);
    const success = await updateValidation.handleSubmit(form);
    if (!success) return;
  };

  const handleEditMode = () => {
    setEditMode(true);
    updateValidation.clearErrors();
  };

  const handleDelete = async () => {
    if (!id) return;
    setConfirmDialog({ isOpen: true });
  };

  const handleConfirmDelete = async () => {
    if (!id) return;
    setError(null);
    try {
      await doctorsApi.delete(Number(id));
      setConfirmDialog({ isOpen: false });
      navigate('/doctors');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    }
  };

  if (loading) return <PageLoader />;
  if (!doctor) return <div className="text-center text-slate-500">Doctor not found</div>;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#191c1d]">{doctor.fullName}</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-[#404850]">{doctor.specialization}</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/doctors')} className="w-full sm:w-auto">
          ← Back
        </Button>
      </div>

      {error && <Alert message={error} />}

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border-0 bg-gradient-to-br from-white to-[#f8f9fa]">
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#191c1d]">{editMode ? 'Edit Doctor Details' : 'Doctor Details'}</h2>
              <p className="text-sm text-[#404850]">{editMode ? 'Update doctor information below' : 'View and manage doctor details'}</p>
            </div>
            {editMode ? (
            <form onSubmit={handleUpdate} className="space-y-3 sm:space-y-4">
              <div>
                <Input
                  label="Specialization"
                  value={form.specialization}
                  onChange={(e) => { setForm({ ...form, specialization: e.target.value }); updateValidation.clearFieldError('specialization'); }}
                />
                {updateValidation.getError('specialization') && <ValidationError message={updateValidation.getError('specialization')!} />}
              </div>
              <div>
                <Input
                  label="License Number"
                  value={form.licenseNumber}
                  onChange={(e) => { setForm({ ...form, licenseNumber: e.target.value }); updateValidation.clearFieldError('licenseNumber'); }}
                />
                {updateValidation.getError('licenseNumber') && <ValidationError message={updateValidation.getError('licenseNumber')!} />}
              </div>
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                <div>
                  <Input
                    label="Years of Experience"
                    type="number"
                    value={form.yearsOfExperience}
                    onChange={(e) => { setForm({ ...form, yearsOfExperience: e.target.value }); updateValidation.clearFieldError('yearsOfExperience'); }}
                  />
                  {updateValidation.getError('yearsOfExperience') && <ValidationError message={updateValidation.getError('yearsOfExperience')!} />}
                </div>
                <div>
                  <Input
                    label="Consultation Fee"
                    type="number"
                    value={form.consultationFee}
                    onChange={(e) => { setForm({ ...form, consultationFee: e.target.value }); updateValidation.clearFieldError('consultationFee'); }}
                  />
                  {updateValidation.getError('consultationFee') && <ValidationError message={updateValidation.getError('consultationFee')!} />}
                </div>
              </div>
              <div>
                <Input
                  label="Department"
                  value={form.department}
                  onChange={(e) => { setForm({ ...form, department: e.target.value }); updateValidation.clearFieldError('department'); }}
                />
                {updateValidation.getError('department') && <ValidationError message={updateValidation.getError('department')!} />}
              </div>
              <div>
                <Input
                  label="Bio"
                  type="textarea"
                  value={form.bio}
                  onChange={(e) => { setForm({ ...form, bio: e.target.value }); updateValidation.clearFieldError('bio'); }}
                />
                {updateValidation.getError('bio') && <ValidationError message={updateValidation.getError('bio')!} />}
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isAvailable}
                  onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
                />
                <span className="font-medium text-[#191c1d]">Available</span>
              </label>
              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={updateValidation.isSubmitting} className="flex-1">
                  {updateValidation.isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button type="button" onClick={() => { setEditMode(false); updateValidation.clearErrors(); }} variant="secondary" className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#707881]">Specialization</label>
                <p className="mt-1 text-[#191c1d] font-medium">{doctor.specialization}</p>
              </div>
              <div>
                <label className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#707881]">License Number</label>
                <p className="mt-1 text-[#191c1d] font-medium">{doctor.licenseNumber}</p>
              </div>
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#707881]">Years of Experience</label>
                  <p className="mt-1 text-[#191c1d] font-medium">{doctor.yearsOfExperience}</p>
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#707881]">Consultation Fee</label>
                  <p className="mt-1 text-[#191c1d] font-medium">₹{doctor.consultationFee}</p>
                </div>
              </div>
              <div>
                <label className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#707881]">Department</label>
                <p className="mt-1 text-[#191c1d] font-medium">{doctor.department}</p>
              </div>
              <div>
                <label className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#707881]">Bio</label>
                <p className="mt-1 text-[#191c1d] font-medium whitespace-pre-wrap">{doctor.bio}</p>
              </div>
              <div>
                <label className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#707881]">Status</label>
                <p className="mt-1 text-[#191c1d] font-medium">{doctor.isAvailable ? 'Available' : 'Unavailable'}</p>
              </div>
              <Button onClick={handleEditMode} className="w-full">
                Edit Doctor
              </Button>
            </div>
            )}
          </div>
        </Card>

        <Card className="shadow-[0_4px_20px_rgba(0,0,0,0.08)] border-0 bg-gradient-to-br from-white to-[#f8f9fa]">
          <div className="p-4 sm:p-6 space-y-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#191c1d]">Actions</h2>
              <p className="text-sm text-[#404850]">Quick actions for this doctor</p>
            </div>
            <div className="space-y-3">
              {!editMode && (
                <>
                  <Button onClick={handleEditMode} className="w-full">
                    Edit Doctor
                  </Button>
                  <Button onClick={handleDelete} className="w-full" variant="danger">
                    Delete Doctor
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      </div>

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false })}
        onConfirm={handleConfirmDelete}
        title="Delete Doctor"
        message="Are you sure you want to delete this doctor profile? This action cannot be undone and will remove all associated data."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
