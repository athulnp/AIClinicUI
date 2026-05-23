import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../api/client';
import { usersApi, rolesApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { type Role, type User } from '../types';
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
  const { needsClinicContext, isSuperAdmin, selectedClinicId } = useAuth();
  const [items, setItems] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
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
    roleId: number;
  }>({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    roleId: 0,
  });

  const emptyForm = {
    username: '',
    password: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    roleId: 0,
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

  const loadRoles = async () => {
    try {
      const res = await rolesApi.list();
      setRoles(res);
      if (res.length > 0) {
        emptyForm.roleId = res[0].id;
      }
    } catch (e) {
      console.error('Failed to load roles', e);
    }
  };

  useEffect(() => {
    load();
    loadRoles();
  }, [needsClinicContext, selectedClinicId]);

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
      roleId: user.roleId,
    });
    setEditId(user.id);
    setError(null);
    setModal('edit');
  };

  const save = async () => {
    setError(null);
    try {
      if (modal === 'create') {
        const body: Record<string, unknown> = { ...form, password: form.password, roleId: form.roleId };
        if (isSuperAdmin && selectedClinicId) {
          body.clinicId = selectedClinicId;
        }
        await usersApi.create(body);
      } else if (editId) {
        const { password, ...data } = form;
        await usersApi.update(editId, { ...data, roleId: form.roleId });
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

  const roleOptions = roles
    .filter(r => !r.isPlatformRole && r.name !== 'Doctor')
    .map(r => ({ value: String(r.id), label: r.name }));

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
                  <td className="px-5 py-3">{u.roleName}</td>
                  <td className="px-5 py-3">
                    <Badge tone={u.isActive ? 'success' : 'danger'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right space-x-1">
                    <Link to={`/users/${u.id}`}>
                      <Button variant="ghost">Details</Button>
                    </Link>
                    <Button variant="ghost" onClick={() => openEdit(u)}>Edit</Button>
                    {u.isActive && <Button variant="ghost" onClick={() => deactivate(u.id)}>Deactivate</Button>}
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
        {isSuperAdmin && modal === 'create' && selectedClinicId && (
          <div className="mb-3">
            <label className="text-sm font-medium text-slate-700">Clinic</label>
            <p className="mt-1 text-sm text-slate-600">Creating for currently selected clinic (ID: {selectedClinicId})</p>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} disabled={modal === 'edit'} />
          {modal === 'create' && (
            <Input label="Password" type="password" value={form.password || ''} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          )}
          <Input label="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Phone" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
          <Select label="Role" value={String(form.roleId)} onChange={(e) => setForm({ ...form, roleId: Number(e.target.value) })} options={roleOptions} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
          <Button onClick={save}>{modal === 'create' ? 'Create' : 'Save changes'}</Button>
        </div>
      </Modal>
    </div>
  );
}
