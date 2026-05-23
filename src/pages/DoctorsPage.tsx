import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../api/client';
import { doctorsApi, usersApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { UserRole, type Doctor, type User } from '../types';
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

export function DoctorsPage() {
  const { needsClinicContext, isSuperAdmin, selectedClinicId } = useAuth();
  const [items, setItems] = useState<Doctor[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    userId: '',
    specialization: '',
    licenseNumber: '',
    yearsOfExperience: '0',
    consultationFee: '',
    department: '',
    bio: '',
    isAvailable: true,
  });

  const emptyForm = {
    userId: '',
    specialization: '',
    licenseNumber: '',
    yearsOfExperience: '0',
    consultationFee: '',
    department: '',
    bio: '',
    isAvailable: true,
  };

  const load = async () => {
    if (needsClinicContext) return;
    setLoading(true);
    try {
      const [d, u] = await Promise.all([
        doctorsApi.list(),
        usersApi.list({ pageNumber: 1, pageSize: 100, role: UserRole.Doctor }),
      ]);
      setItems(d);
      setDoctors(u.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [needsClinicContext]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditId(null);
    setError(null);
    setModal('create');
  };

  const openEdit = (doctor: Doctor) => {
    setForm({
      userId: String(doctor.userId),
      specialization: doctor.specialization,
      licenseNumber: doctor.licenseNumber,
      yearsOfExperience: String(doctor.yearsOfExperience),
      consultationFee: String(doctor.consultationFee),
      department: doctor.department || '',
      bio: doctor.bio || '',
      isAvailable: doctor.isAvailable,
    });
    setEditId(doctor.id);
    setError(null);
    setModal('edit');
  };

  const save = async () => {
    setError(null);
    try {
      const data: Record<string, unknown> = {
        specialization: form.specialization,
        licenseNumber: form.licenseNumber,
        yearsOfExperience: Number(form.yearsOfExperience),
        consultationFee: Number(form.consultationFee),
        department: form.department || undefined,
        bio: form.bio || undefined,
        isAvailable: form.isAvailable,
      };

      if (modal === 'create') {
        const body: Record<string, unknown> = {
          userId: Number(form.userId),
          ...data,
        };
        if (isSuperAdmin && selectedClinicId) {
          body.clinicId = selectedClinicId;
        }
        await doctorsApi.create(body);
      } else if (editId) {
        await doctorsApi.update(editId, data);
      }
      setModal(null);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Operation failed');
    }
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this doctor profile?')) return;
    try {
      await doctorsApi.delete(id);
      load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Delete failed');
    }
  };

  if (needsClinicContext) return <EmptyState message="Select a clinic to view doctors." />;
  if (loading && items.length === 0) return <PageLoader />;

  return (
    <div>
      <Card>
        <CardHeader title="Doctors" action={<Button onClick={openCreate}>Add doctor profile</Button>} />
        <p className="px-5 pb-2 text-xs text-slate-500">
          Doctors must be created as Doctor users first. Doctor profiles attach medical details.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Specialization</th>
                <th className="px-5 py-3">License</th>
                <th className="px-5 py-3">Fee (₹)</th>
                <th className="px-5 py-3">Experience</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((d) => (
                <tr key={d.id} className="border-t border-slate-100">
                  <td className="px-5 py-3 font-medium">{d.fullName}</td>
                  <td className="px-5 py-3">{d.specialization}</td>
                  <td className="px-5 py-3 text-xs">{d.licenseNumber}</td>
                  <td className="px-5 py-3">{d.consultationFee}</td>
                  <td className="px-5 py-3">{d.yearsOfExperience} yrs</td>
                  <td className="px-5 py-3">
                    <Badge tone={d.isAvailable ? 'success' : 'danger'}>
                      {d.isAvailable ? 'Available' : 'Unavailable'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right space-x-1">
                    <Link to={`/doctors/${d.id}`}>
                      <Button variant="ghost">Details</Button>
                    </Link>
                    <Button variant="ghost" onClick={() => openEdit(d)}>Edit</Button>
                    <Button variant="ghost" onClick={() => remove(d.id)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && <EmptyState message="No doctor profiles." />}
        </div>
      </Card>

      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal === 'create' ? 'Add doctor' : 'Edit doctor'}>
        {error && <Alert message={error} />}
        {isSuperAdmin && modal === 'create' && selectedClinicId && (
          <div className="mb-3">
            <label className="text-sm font-medium text-slate-700">Clinic</label>
            <p className="mt-1 text-sm text-slate-600">Creating for currently selected clinic (ID: {selectedClinicId})</p>
          </div>
        )}
        <div className="space-y-3">
          {modal === 'create' && (
            <Select
              label="Doctor user"
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
              options={[
                { value: '', label: 'Select…' },
                ...doctors
                  .filter((d) => !items.some((x) => x.userId === d.id))
                  .map((d) => ({ value: d.id, label: d.fullName })),
              ]}
            />
          )}
          <Input
            label="Specialization"
            value={form.specialization}
            onChange={(e) => setForm({ ...form, specialization: e.target.value })}
            placeholder="Orthodontics, Periodontology, etc."
          />
          <Input
            label="License number"
            value={form.licenseNumber}
            onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Years experience"
              type="number"
              value={form.yearsOfExperience}
              onChange={(e) => setForm({ ...form, yearsOfExperience: e.target.value })}
            />
            <Input
              label="Consultation fee"
              type="number"
              value={form.consultationFee}
              onChange={(e) => setForm({ ...form, consultationFee: e.target.value })}
            />
          </div>
          <Input
            label="Department"
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
          />
          <Input
            label="Bio"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="Professional bio..."
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isAvailable}
              onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
            />
            <span>Available for appointments</span>
          </label>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
          <Button onClick={save}>Save</Button>
        </div>
      </Modal>
    </div>
  );
}
