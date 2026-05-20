import { useEffect, useState } from 'react';
import { doctorsApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import type { Doctor } from '../types';
import { Button, Card, CardHeader, EmptyState, Input, Modal, PageLoader } from '../components/ui';

export function DoctorsPage() {
  const { needsClinicContext } = useAuth();
  const [items, setItems] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    userId: '',
    specialization: '',
    licenseNumber: '',
    yearsOfExperience: '0',
    consultationFee: '',
    department: '',
  });

  const load = async () => {
    if (needsClinicContext) return;
    setLoading(true);
    setItems(await doctorsApi.list());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [needsClinicContext]);

  const create = async () => {
    await doctorsApi.create({
      userId: Number(form.userId),
      specialization: form.specialization,
      licenseNumber: form.licenseNumber,
      yearsOfExperience: Number(form.yearsOfExperience),
      consultationFee: Number(form.consultationFee),
      department: form.department || undefined,
    });
    setShowCreate(false);
    load();
  };

  if (needsClinicContext) return <EmptyState message="Select a clinic to view doctors." />;
  if (loading) return <PageLoader />;

  return (
    <div>
      <Card>
        <CardHeader title="Doctors" action={<Button onClick={() => setShowCreate(true)}>Add doctor profile</Button>} />
        <p className="px-5 pb-2 text-xs text-slate-500">
          Doctors must be users with Doctor role (create user first, then link profile).
        </p>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Specialization</th>
              <th className="px-5 py-3">License</th>
              <th className="px-5 py-3">Fee</th>
              <th className="px-5 py-3">Available</th>
            </tr>
          </thead>
          <tbody>
            {items.map((d) => (
              <tr key={d.id} className="border-t border-slate-100">
                <td className="px-5 py-3 font-medium">{d.fullName}</td>
                <td className="px-5 py-3">{d.specialization}</td>
                <td className="px-5 py-3">{d.licenseNumber}</td>
                <td className="px-5 py-3">₹{d.consultationFee}</td>
                <td className="px-5 py-3">{d.isAvailable ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <EmptyState message="No doctor profiles." />}
      </Card>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Doctor profile">
        <Input label="User ID (doctor user)" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })} />
        <Input label="Specialization" className="mt-3" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
        <Input label="License number" className="mt-3" value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} />
        <Input label="Years experience" type="number" className="mt-3" value={form.yearsOfExperience} onChange={(e) => setForm({ ...form, yearsOfExperience: e.target.value })} />
        <Input label="Consultation fee" type="number" className="mt-3" value={form.consultationFee} onChange={(e) => setForm({ ...form, consultationFee: e.target.value })} />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
          <Button onClick={create}>Save</Button>
        </div>
      </Modal>
    </div>
  );
}
