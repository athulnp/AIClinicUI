import { useEffect, useState } from 'react';
import { clinicsApi } from '../api/services';
import { type Clinic } from '../types';
import { formatDate } from '../utils/labels';
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Input,
  Modal,
  PageLoader,
} from '../components/ui';

export function ClinicsPage() {
  const [items, setItems] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', city: '', email: '', phoneNumber: '' });

  const load = async () => {
    setLoading(true);
    const res = await clinicsApi.list({ pageNumber: 1, pageSize: 50 });
    setItems(res.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    await clinicsApi.create({
      code: form.code.toLowerCase().replace(/\s+/g, '-'),
      name: form.name,
      city: form.city || undefined,
      email: form.email || undefined,
      phoneNumber: form.phoneNumber || undefined,
      country: 'India',
    });
    setShowCreate(false);
    load();
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <Card>
        <CardHeader title="Clinics (tenants)" action={<Button onClick={() => setShowCreate(true)}>Onboard clinic</Button>} />
        <p className="px-5 pb-2 text-sm text-slate-500">
          Each clinic is an isolated tenant. Staff log in with the clinic code or ID.
        </p>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-5 py-3">Code</th>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">City</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="px-5 py-3 font-mono text-xs">{c.code}</td>
                <td className="px-5 py-3 font-medium">{c.name}</td>
                <td className="px-5 py-3">{c.city ?? '—'}</td>
                <td className="px-5 py-3">
                  <Badge tone={c.isActive ? 'success' : 'danger'}>{c.isActive ? 'Active' : 'Inactive'}</Badge>
                </td>
                <td className="px-5 py-3">{formatDate(c.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <EmptyState message="No clinics onboarded yet." />}
      </Card>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Onboard new clinic">
        <Input label="Code (slug)" placeholder="sunshine-dental" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        <Input label="Name" className="mt-3" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label="City" className="mt-3" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        <Input label="Email" className="mt-3" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input label="Phone" className="mt-3" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
          <Button onClick={create}>Create clinic</Button>
        </div>
      </Modal>
    </div>
  );
}
