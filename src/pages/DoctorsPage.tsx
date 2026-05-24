import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../api/client';
import { doctorsApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { type Doctor } from '../types';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Modal,
  PageLoader,
} from '../components/ui';
import { SearchFilter, useDebouncedSearch } from '../components/SearchFilter';
import { ConfirmationDialog } from '../components/ConfirmationDialog';

export function DoctorsPage() {
  const { needsClinicContext, isSuperAdmin, selectedClinicId } = useAuth();
  const [items, setItems] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const { searchQuery, setSearchQuery, filteredItems } = useDebouncedSearch(
    items,
    ['fullName' as keyof Doctor, 'specialization' as keyof Doctor]
  );
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; doctorId: number | null }>({
    isOpen: false,
    doctorId: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    // User fields
    username: '',
    password: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    // Doctor fields
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
    // User fields
    username: '',
    password: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    // Doctor fields
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
      const d = await doctorsApi.list();
      setItems(d);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [needsClinicContext, selectedClinicId]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditId(null);
    setError(null);
    setModal('create');
  };

  const openEdit = (doctor: Doctor) => {
    setForm({
      // User fields - not editable in edit mode
      username: '',
      password: '',
      fullName: '',
      email: '',
      phoneNumber: '',
      // Doctor fields
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
      if (modal === 'create') {
        const body: Record<string, unknown> = {
          // User fields
          username: form.username,
          password: form.password,
          fullName: form.fullName,
          email: form.email,
          phoneNumber: form.phoneNumber,
          // Doctor fields
          specialization: form.specialization,
          licenseNumber: form.licenseNumber,
          yearsOfExperience: Number(form.yearsOfExperience),
          consultationFee: Number(form.consultationFee),
          department: form.department || undefined,
          bio: form.bio || undefined,
          isAvailable: form.isAvailable,
        };
        if (isSuperAdmin && selectedClinicId) {
          body.clinicId = selectedClinicId;
        }
        await doctorsApi.create(body);
      } else if (editId) {
        const body: Record<string, unknown> = {
          specialization: form.specialization,
          licenseNumber: form.licenseNumber,
          yearsOfExperience: Number(form.yearsOfExperience),
          consultationFee: Number(form.consultationFee),
          department: form.department || undefined,
          bio: form.bio || undefined,
          isAvailable: form.isAvailable,
        };
        await doctorsApi.update(editId, body);
      }
      setModal(null);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Operation failed');
    }
  };

  const remove = async (id: number) => {
    setConfirmDialog({ isOpen: true, doctorId: id });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDialog.doctorId) return;
    try {
      await doctorsApi.delete(confirmDialog.doctorId);
      setConfirmDialog({ isOpen: false, doctorId: null });
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Delete failed');
    }
  };

  if (needsClinicContext) return <EmptyState message="Select a clinic to view doctors." />;
  if (loading && items.length === 0) return <PageLoader />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="p-4 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border-0 bg-gradient-to-br from-white to-[#f8f9fa]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#191c1d]">Doctors</h2>
            <p className="text-sm text-[#404850]">Manage doctor profiles and medical details</p>
          </div>
          <Button onClick={openCreate} className="w-full sm:w-auto">Add Doctor</Button>
        </div>
      </Card>

      <Card className="shadow-[0_4px_20px_rgba(0,0,0,0.08)] border-0 bg-gradient-to-br from-white to-[#f8f9fa]">
        <div className="p-4 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs sm:text-sm text-[#707881] font-medium">Doctors must be created as Doctor users first. Doctor profiles attach medical details.</p>
            </div>
            <SearchFilter
              placeholder="Search by name or specialization..."
              onSearch={setSearchQuery}
              className="w-full sm:max-w-md"
            />
          </div>
          <p className="text-sm text-slate-500 mt-3">
            {filteredItems.length} doctor{filteredItems.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 sm:px-5 py-3">Name</th>
                <th className="px-3 sm:px-5 py-3">Specialization</th>
                <th className="px-3 sm:px-5 py-3 hidden sm:table-cell">License</th>
                <th className="px-3 sm:px-5 py-3">Fee (₹)</th>
                <th className="px-3 sm:px-5 py-3 hidden sm:table-cell">Experience</th>
                <th className="px-3 sm:px-5 py-3">Status</th>
                <th className="px-3 sm:px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((d) => (
                <tr key={d.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-3 sm:px-5 py-3 font-medium text-[#191c1d]">{d.fullName}</td>
                  <td className="px-3 sm:px-5 py-3 text-[#404850]">{d.specialization}</td>
                  <td className="px-3 sm:px-5 py-3 text-xs hidden sm:table-cell text-[#404850]">{d.licenseNumber}</td>
                  <td className="px-3 sm:px-5 py-3 font-medium text-[#191c1d]">₹{d.consultationFee}</td>
                  <td className="px-3 sm:px-5 py-3 hidden sm:table-cell text-[#404850]">{d.yearsOfExperience} yrs</td>
                  <td className="px-3 sm:px-5 py-3">
                    <Badge tone={d.isAvailable ? 'success' : 'danger'}>
                      {d.isAvailable ? 'Available' : 'Unavailable'}
                    </Badge>
                  </td>
                  <td className="px-3 sm:px-5 py-3 text-right space-x-1">
                    <Link to={`/doctors/${d.id}`}>
                      <Button variant="ghost" className="text-xs">Details</Button>
                    </Link>
                    <Button variant="ghost" onClick={() => openEdit(d)} className="text-xs">Edit</Button>
                    <Button variant="ghost" onClick={() => remove(d.id)} className="text-xs text-red-600">Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredItems.length === 0 && (
            <EmptyState 
              message={searchQuery ? `No doctors found matching "${searchQuery}".` : "No doctor profiles."} 
            />
          )}
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
        <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-3 sm:space-y-4">
          {modal === 'create' && (
            <>
              <p className="text-sm text-[#707881] mb-2">Create doctor account and profile</p>
              <Input
                label="Username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="johndoe"
              />
              <Input
                label="Password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Minimum 6 characters"
              />
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                <Input
                  label="Full name"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="Dr. John Doe"
                />
                <Input
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <Input
                label="Phone number"
                value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                placeholder="1234567890"
              />
            </>
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
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
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
            type="textarea"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isAvailable}
              onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
            />
            <span className="font-medium text-[#191c1d]">Available for appointments</span>
          </label>
          <div className="mt-3 sm:mt-4 flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setModal(null)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1">Save</Button>
          </div>
        </form>
      </Modal>

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, doctorId: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Doctor"
        message="Are you sure you want to delete this doctor profile? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
