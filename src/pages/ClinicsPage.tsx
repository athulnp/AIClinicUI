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
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { ValidationError } from '../components/ValidationError';
import { createClinicSchema, updateClinicSchema } from '../validations/clinicValidation';
import { useFormValidation } from '../hooks/useFormValidation';

export function ClinicsPage() {
  const [items, setItems] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; clinicId: number | null }>({
    isOpen: false,
    clinicId: null,
  });
  const [form, setForm] = useState({ code: '', name: '', city: '', email: '', phoneNumber: '', address: '', state: '', postalCode: '', country: '' });

  const createValidation = useFormValidation(
    createClinicSchema,
    async (data) => {
      await clinicsApi.create({
        code: data.code.toLowerCase().replace(/\s+/g, '-'),
        name: data.name,
        city: data.city || undefined,
        email: data.email || undefined,
        phoneNumber: data.phoneNumber || undefined,
        address: data.address || undefined,
        state: data.state || undefined,
        postalCode: data.postalCode || undefined,
        country: data.country || undefined,
      });
      setModal(null);
      setForm({ code: '', name: '', city: '', email: '', phoneNumber: '', address: '', state: '', postalCode: '', country: '' });
      load();
    }
  );

  const updateValidation = useFormValidation(
    updateClinicSchema,
    async (data) => {
      if (!editId) return;
      await clinicsApi.update(editId, {
        name: data.name,
        city: data.city || undefined,
        email: data.email || undefined,
        phoneNumber: data.phoneNumber || undefined,
        address: data.address || undefined,
        state: data.state || undefined,
        postalCode: data.postalCode || undefined,
        country: data.country || undefined,
      });
      setModal(null);
      load();
    }
  );

  const load = async () => {
    setLoading(true);
    const res = await clinicsApi.list({ pageNumber: 1, pageSize: 50 });
    setItems(res.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openEdit = (clinic: Clinic) => {
    setForm({
      code: clinic.code,
      name: clinic.name,
      city: clinic.city || '',
      email: clinic.email || '',
      phoneNumber: clinic.phoneNumber || '',
      address: clinic.address || '',
      state: clinic.state || '',
      postalCode: clinic.postalCode || '',
      country: clinic.country || '',
    });
    setEditId(clinic.id);
    updateValidation.clearErrors();
    setModal('edit');
  };

  const openCreate = () => {
    setForm({ code: '', name: '', city: '', email: '', phoneNumber: '', address: '', state: '', postalCode: '', country: '' });
    setEditId(null);
    createValidation.clearErrors();
    setModal('create');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modal === 'create') {
      const success = await createValidation.handleSubmit(form);
      if (!success) return;
    } else {
      const success = await updateValidation.handleSubmit(form);
      if (!success) return;
    }
  };

  const remove = async (id: number) => {
    setConfirmDialog({ isOpen: true, clinicId: id });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDialog.clinicId) return;
    try {
      await clinicsApi.delete(confirmDialog.clinicId);
      setConfirmDialog({ isOpen: false, clinicId: null });
      load();
    } catch (e) {
      alert('Delete failed');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div>
      <Card>
        <CardHeader title="Clinics (tenants)" action={<Button onClick={openCreate}>Onboard clinic</Button>} />
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
              <th className="px-5 py-3" />
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
                <td className="px-5 py-3 text-right space-x-1">
                  <Button variant="ghost" onClick={() => openEdit(c)}>Edit</Button>
                  <Button variant="ghost" onClick={() => remove(c.id)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <EmptyState message="No clinics onboarded yet." />}
      </Card>

      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal === 'create' ? 'Onboard new clinic' : 'Edit clinic'}>
        <form onSubmit={handleSave}>
          <div>
            <Input label="Code (slug)" placeholder="sunshine-dental" value={form.code} onChange={(e) => { setForm({ ...form, code: e.target.value }); modal === 'create' ? createValidation.clearFieldError('code') : null; }} />
            {modal === 'create' && createValidation.getError('code') && <ValidationError message={createValidation.getError('code')!} />}
          </div>
          <div className="mt-3">
            <Input label="Name" value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); updateValidation.clearFieldError('name'); }} />
            {updateValidation.getError('name') && <ValidationError message={updateValidation.getError('name')!} />}
          </div>
          <div className="mt-3">
            <Input label="City" value={form.city} onChange={(e) => { setForm({ ...form, city: e.target.value }); updateValidation.clearFieldError('city'); }} />
            {updateValidation.getError('city') && <ValidationError message={updateValidation.getError('city')!} />}
          </div>
          <div className="mt-3">
            <Input label="Email" value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); updateValidation.clearFieldError('email'); }} />
            {updateValidation.getError('email') && <ValidationError message={updateValidation.getError('email')!} />}
          </div>
          <div className="mt-3">
            <Input label="Phone" value={form.phoneNumber} onChange={(e) => { setForm({ ...form, phoneNumber: e.target.value }); updateValidation.clearFieldError('phoneNumber'); }} />
            {updateValidation.getError('phoneNumber') && <ValidationError message={updateValidation.getError('phoneNumber')!} />}
          </div>
          <div className="mt-3">
            <Input label="Address" value={form.address} onChange={(e) => { setForm({ ...form, address: e.target.value }); updateValidation.clearFieldError('address'); }} />
            {updateValidation.getError('address') && <ValidationError message={updateValidation.getError('address')!} />}
          </div>
          <div className="mt-3">
            <Input label="State" value={form.state} onChange={(e) => { setForm({ ...form, state: e.target.value }); updateValidation.clearFieldError('state'); }} />
            {updateValidation.getError('state') && <ValidationError message={updateValidation.getError('state')!} />}
          </div>
          <div className="mt-3">
            <Input label="Postal Code" value={form.postalCode} onChange={(e) => { setForm({ ...form, postalCode: e.target.value }); updateValidation.clearFieldError('postalCode'); }} />
            {updateValidation.getError('postalCode') && <ValidationError message={updateValidation.getError('postalCode')!} />}
          </div>
          <div className="mt-3">
            <Input label="Country" value={form.country} onChange={(e) => { setForm({ ...form, country: e.target.value }); updateValidation.clearFieldError('country'); }} />
            {updateValidation.getError('country') && <ValidationError message={updateValidation.getError('country')!} />}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => { setModal(null); createValidation.clearErrors(); updateValidation.clearErrors(); }}>Cancel</Button>
            <Button type="submit" disabled={modal === 'create' ? createValidation.isSubmitting : updateValidation.isSubmitting}>{modal === 'create' ? (createValidation.isSubmitting ? 'Creating...' : 'Create clinic') : (updateValidation.isSubmitting ? 'Saving...' : 'Save changes')}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, clinicId: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Clinic"
        message="Are you sure you want to delete this clinic? This will affect all associated data including users, patients, and appointments. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
