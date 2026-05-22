import { useEffect, useState } from 'react';
import { ApiError } from '../api/client';
import { usersApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { UserRole, type User } from '../types';
import { roleLabels } from '../utils/labels';
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

export function UsersPage() {
  const { needsClinicContext, user: currentUser } = useAuth();
  const [items, setItems] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<{
    username: string;
    password?: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    role: UserRole;
  }>({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    role: UserRole.Receptionist,
  });

  const emptyForm = {
    username: '',
    password: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    role: UserRole.Receptionist,
  };

  const load = async () => {
    if (needsClinicContext) return;
    setLoading(true);
    try {
      const res = await usersApi.list({ pageNumber: 1, pageSize: 50 });
      setItems(res.data);
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

  const openEdit = (user: User) => {
    setForm({
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
    });
    setEditId(user.id);
    setError(null);
    setModal('edit');
  };

  const save = async () => {
    setError(null);
    try {
      if (modal === 'create') {
        await usersApi.create({ ...form, password: form.password, role: Number(form.role) });
      } else if (editId) {
        const { password, ...data } = form;
        await usersApi.update(editId, { ...data, role: Number(form.role) });
      }
      setModal(null);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Operation failed');
    }
  };

  const deactivate = async (id: number) => {
    if (!confirm('Deactivate this user?')) return;
    try {
      await usersApi.deactivate(id);
      load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Deactivation failed');
    }
  };

  if (needsClinicContext) return <EmptyState message="Select a clinic to manage users." />;
  if (loading && items.length === 0) return <PageLoader />;

  const roleOptions = Object.entries(roleLabels)
    .filter(([k]) => Number(k) !== UserRole.SuperAdmin)
    .map(([k, v]) => ({ value: k, label: v }));

  return (
    <div>
      <Card>
        <CardHeader title="Staff users" action={<Button onClick={openCreate}>Add user</Button>} />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Username</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="px-5 py-3 font-medium">{u.fullName}</td>
                  <td className="px-5 py-3">{u.username}</td>
                  <td className="px-5 py-3 text-xs">{u.email}</td>
                  <td className="px-5 py-3">{roleLabels[u.role]}</td>
                  <td className="px-5 py-3">
                    <Badge tone={u.isActive ? 'success' : 'danger'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right space-x-1">
                    {u.isActive && u.id !== currentUser?.id && (
                      <>
                        <Button variant="ghost" onClick={() => openEdit(u)}>Edit</Button>
                        <Button variant="ghost" onClick={() => deactivate(u.id)}>Deactivate</Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && <EmptyState message="No users." />}
        </div>
      </Card>

      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal === 'create' ? 'New staff user' : 'Edit user'}>
        {error && <Alert message={error} />}
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} disabled={modal === 'edit'} />
          {modal === 'create' && (
            <Input label="Password" type="password" value={form.password || ''} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          )}
          <Input label="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Phone" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
          <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: Number(e.target.value) as UserRole })} options={roleOptions} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
          <Button onClick={save}>{modal === 'create' ? 'Create' : 'Save changes'}</Button>
        </div>
      </Modal>
    </div>
  );
}
