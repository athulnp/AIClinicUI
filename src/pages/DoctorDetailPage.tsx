import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { doctorsApi, usersApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { type Doctor, type User } from '../types';
import { Alert, Button, Card, CardHeader, Input, PageLoader, Select } from '../components/ui';

export function DoctorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { needsClinicContext } = useAuth();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
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
      if (doc.userId) {
        const usr = await usersApi.list({ pageNumber: 1, pageSize: 1 });
        const foundUser = usr.data.find((u) => u.id === doc.userId);
        if (foundUser) setUser(foundUser);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!id) return;
    setError(null);
    try {
      await doctorsApi.update(Number(id), {
        ...form,
        yearsOfExperience: Number(form.yearsOfExperience),
        consultationFee: Number(form.consultationFee),
      });
      setEditMode(false);
      await load();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this doctor?')) return;
    setError(null);
    try {
      await doctorsApi.delete(Number(id));
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{doctor.userId}</h1>
          <p className="mt-1 text-slate-500">{doctor.specialization}</p>
        </div>
        <button onClick={() => navigate('/doctors')} className="text-slate-600 hover:text-slate-900">
          ← Back
        </button>
      </div>

      {error && <Alert message={error} />}

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader title={editMode ? 'Edit Doctor Details' : 'Doctor Details'} />
          {editMode ? (
            <div className="space-y-4">
              <Input
                label="Specialization"
                value={form.specialization}
                onChange={(e) => setForm({ ...form, specialization: e.target.value })}
              />
              <Input
                label="License Number"
                value={form.licenseNumber}
                onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
              />
              <Input
                label="Years of Experience"
                type="number"
                value={form.yearsOfExperience}
                onChange={(e) => setForm({ ...form, yearsOfExperience: e.target.value })}
              />
              <Input
                label="Consultation Fee"
                type="number"
                value={form.consultationFee}
                onChange={(e) => setForm({ ...form, consultationFee: e.target.value })}
              />
              <Input
                label="Department"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              />
              <Input
                label="Bio"
                type="textarea"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isAvailable}
                  onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
                />
                <span className="text-sm font-medium">Available</span>
              </label>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleUpdate} className="flex-1">
                  Save Changes
                </Button>
                <Button onClick={() => setEditMode(false)} variant="secondary" className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Specialization</label>
                <p className="mt-1 text-slate-900">{doctor.specialization}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">License Number</label>
                <p className="mt-1 text-slate-900">{doctor.licenseNumber}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700">Years of Experience</label>
                  <p className="mt-1 text-slate-900">{doctor.yearsOfExperience}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Consultation Fee</label>
                  <p className="mt-1 text-slate-900">₹{doctor.consultationFee}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Department</label>
                <p className="mt-1 text-slate-900">{doctor.department}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Bio</label>
                <p className="mt-1 text-slate-900">{doctor.bio}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Status</label>
                <p className="mt-1 text-slate-900">{doctor.isAvailable ? 'Available' : 'Unavailable'}</p>
              </div>
              <Button onClick={() => setEditMode(true)} className="w-full">
                Edit
              </Button>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Actions" />
          <div className="space-y-3">
            {!editMode && (
              <>
                <Button onClick={() => setEditMode(true)} className="w-full">
                  Edit
                </Button>
                <Button onClick={handleDelete} className="w-full" variant="danger">
                  Delete Doctor
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
