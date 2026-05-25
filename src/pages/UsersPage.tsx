import { useEffect, useState, useCallback, useRef } from 'react';
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
  EmptyState,
  Input,
  Modal,
  PageLoader,
  Select,
} from '../components/ui';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { SearchFilter } from '../components/SearchFilter';
import { ValidationError } from '../components/ValidationError';
import { createUserSchema, updateUserSchema } from '../validations/authValidation';
import { useFormValidation } from '../hooks/useFormValidation';

export function UsersPage() {
  const { needsClinicContext, isSuperAdmin, selectedClinicId } = useAuth();
  const [items, setItems] = useState<User[]>([]);
  const [filteredItems, setFilteredItems] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; userId: number | null; action: 'deactivate' | 'activate' | null }>({
    isOpen: false,
    userId: null,
    action: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<{
    username: string;
    password?: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    roleId: number;
    isActive: boolean;
  }>({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    roleId: 0,
    isActive: true,
  });

  // Use refs for mutable values that validation callbacks need
  const isSuperAdminRef = useRef(isSuperAdmin);
  const selectedClinicIdRef = useRef(selectedClinicId);
  const editIdRef = useRef(editId);
  const loadRef = useRef<((search?: string) => Promise<void>) | null>(null);

  useEffect(() => {
    isSuperAdminRef.current = isSuperAdmin;
    selectedClinicIdRef.current = selectedClinicId;
    editIdRef.current = editId;
  }, [isSuperAdmin, selectedClinicId, editId]);

  const emptyForm = {
    username: '',
    password: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    roleId: 0,
    isActive: true,
  };

  const load = useCallback(async (search?: string) => {
    if (needsClinicContext) return;
    setLoading(true);
    try {
      const res = await usersApi.list({ pageNumber: 1, pageSize: 50, search });
      setItems(res.data);
      setFilteredItems(res.data);
    } finally {
      setLoading(false);
    }
  }, [needsClinicContext]);

  loadRef.current = load;

  const createValidationRef = useRef<ReturnType<typeof useFormValidation> | null>(null);
  const updateValidationRef = useRef<ReturnType<typeof useFormValidation> | null>(null);

  if (!createValidationRef.current) {
    createValidationRef.current = useFormValidation(
      createUserSchema,
      async (data) => {
        const body: Record<string, unknown> = {
          username: data.username,
          password: data.password,
          fullName: data.fullName,
          email: data.email || undefined,
          phoneNumber: data.phoneNumber || undefined,
          roleId: Number(data.roleId),
        };
        if (isSuperAdminRef.current && selectedClinicIdRef.current) {
          body.clinicId = selectedClinicIdRef.current;
        }
        await usersApi.create(body);
        setModal(null);
        setForm(emptyForm);
        loadRef.current?.();
      }
    );
  }

  if (!updateValidationRef.current) {
    updateValidationRef.current = useFormValidation(
      updateUserSchema,
      async (data) => {
        const currentEditId = editIdRef.current;
        if (!currentEditId) return;
        await usersApi.update(currentEditId, {
          fullName: data.fullName,
          email: data.email || undefined,
          phoneNumber: data.phoneNumber || undefined,
          roleId: Number(data.roleId),
          isActive: data.isActive,
        });
        setModal(null);
        loadRef.current?.();
      }
    );
  }

  const createValidation = createValidationRef.current;
  const updateValidation = updateValidationRef.current;

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    load(query);
  };

  const loadRoles = useCallback(async () => {
    try {
      const res = await rolesApi.list();
      setRoles(res);
      if (res.length > 0) {
        emptyForm.roleId = res[0].id;
      }
    } catch (e) {
      console.error('Failed to load roles', e);
    }
  }, []);

  useEffect(() => {
    load();
    loadRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsClinicContext]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditId(null);
    setError(null);
    createValidation.clearErrors();
    setModal('create');
  };

  const openEdit = (user: User) => {
    setForm({
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      roleId: user.roleId,
      isActive: user.isActive,
    });
    setEditId(user.id);
    setError(null);
    updateValidation.clearErrors();
    setModal('edit');
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modal === 'create') {
      const success = await createValidation.handleSubmit(form);
      if (!success) return;
    } else {
      const success = await updateValidation.handleSubmit(form);
      if (!success) return;
    }
  };

  const deactivate = async (id: number) => {
    setConfirmDialog({ isOpen: true, userId: id, action: 'deactivate' });
  };

  const activate = async (id: number) => {
    setConfirmDialog({ isOpen: true, userId: id, action: 'activate' });
  };

  const handleConfirmDeactivate = async () => {
    if (!confirmDialog.userId) return;
    try {
      if (confirmDialog.action === 'deactivate') {
        await usersApi.deactivate(confirmDialog.userId);
      } else if (confirmDialog.action === 'activate') {
        await usersApi.activate(confirmDialog.userId);
      }
      setConfirmDialog({ isOpen: false, userId: null, action: null });
      load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Operation failed');
    }
  };

  if (needsClinicContext) return <EmptyState message="Select a clinic to manage users." />;
  if (loading && items.length === 0) return <PageLoader />;

  const roleOptions = roles
    .filter(r => !r.isPlatformRole && r.name !== 'Doctor')
    .map(r => ({ value: String(r.id), label: r.name }));

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="p-4 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border-0 bg-gradient-to-br from-white to-[#f8f9fa]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#191c1d]">Staff Users</h2>
            <p className="text-sm text-[#404850]">Manage clinic staff and their roles</p>
          </div>
          <Button onClick={openCreate} className="w-full sm:w-auto">Add User</Button>
        </div>
      </Card>

      <Card className="shadow-[0_4px_20px_rgba(0,0,0,0.08)] border-0 bg-gradient-to-br from-white to-[#f8f9fa]">
        <div className="p-4 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <SearchFilter
              placeholder="Search by name, username, or email..."
              onSearch={handleSearch}
              className="w-full sm:max-w-md"
            />
            <p className="text-sm text-slate-500">
              {filteredItems.length} user{filteredItems.length !== 1 ? 's' : ''} found
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 sm:px-5 py-3">Name</th>
                <th className="px-3 sm:px-5 py-3">Username</th>
                <th className="px-3 sm:px-5 py-3 hidden sm:table-cell">Email</th>
                <th className="px-3 sm:px-5 py-3">Role</th>
                <th className="px-3 sm:px-5 py-3">Status</th>
                <th className="px-3 sm:px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((u) => (
                <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-3 sm:px-5 py-3 font-medium text-[#191c1d]">{u.fullName}</td>
                  <td className="px-3 sm:px-5 py-3 text-[#404850]">{u.username}</td>
                  <td className="px-3 sm:px-5 py-3 text-xs hidden sm:table-cell text-[#404850]">{u.email}</td>
                  <td className="px-3 sm:px-5 py-3">{u.roleName}</td>
                  <td className="px-3 sm:px-5 py-3">
                    <Badge tone={u.isActive ? 'success' : 'danger'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>
                  </td>
                  <td className="px-3 sm:px-5 py-3 text-right space-x-1">
                    <Link to={`/users/${u.id}`}>
                      <Button variant="ghost" className="text-xs">Details</Button>
                    </Link>
                    <Button variant="ghost" onClick={() => openEdit(u)} className="text-xs">Edit</Button>
                    {u.isActive && <Button variant="ghost" onClick={() => deactivate(u.id)} className="text-xs text-red-600">Deactivate</Button>}
                    {!u.isActive && <Button variant="ghost" onClick={() => activate(u.id)} className="text-xs text-green-600">Activate</Button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredItems.length === 0 && (
            <EmptyState 
              message={searchQuery ? `No users found matching "${searchQuery}".` : "No users found."} 
            />
          )}
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
        <form onSubmit={save} className="space-y-3 sm:space-y-4">
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            <div>
              <Input label="Username" value={form.username} onChange={(e) => { setForm({ ...form, username: e.target.value }); modal === 'create' ? createValidation.clearFieldError('username') : null; }} disabled={modal === 'edit'} />
              {modal === 'create' && createValidation.getError('username') && <ValidationError message={createValidation.getError('username')!} />}
            </div>
            {modal === 'create' && (
              <div>
                <Input label="Password" type="password" value={form.password || ''} onChange={(e) => { setForm({ ...form, password: e.target.value }); createValidation.clearFieldError('password'); }} />
                {createValidation.getError('password') && <ValidationError message={createValidation.getError('password')!} />}
              </div>
            )}
          </div>
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            <div>
              <Input label="Full name" value={form.fullName} onChange={(e) => { setForm({ ...form, fullName: e.target.value }); modal === 'create' ? createValidation.clearFieldError('fullName') : updateValidation.clearFieldError('fullName'); }} />
              {modal === 'create' && createValidation.getError('fullName') && <ValidationError message={createValidation.getError('fullName')!} />}
              {modal === 'edit' && updateValidation.getError('fullName') && <ValidationError message={updateValidation.getError('fullName')!} />}
            </div>
            <div>
              <Input label="Email" value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); modal === 'create' ? createValidation.clearFieldError('email') : updateValidation.clearFieldError('email'); }} />
              {modal === 'create' && createValidation.getError('email') && <ValidationError message={createValidation.getError('email')!} />}
              {modal === 'edit' && updateValidation.getError('email') && <ValidationError message={updateValidation.getError('email')!} />}
            </div>
          </div>
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            <div>
              <Input label="Phone" value={form.phoneNumber} onChange={(e) => { setForm({ ...form, phoneNumber: e.target.value }); modal === 'create' ? createValidation.clearFieldError('phoneNumber') : updateValidation.clearFieldError('phoneNumber'); }} />
              {modal === 'create' && createValidation.getError('phoneNumber') && <ValidationError message={createValidation.getError('phoneNumber')!} />}
              {modal === 'edit' && updateValidation.getError('phoneNumber') && <ValidationError message={updateValidation.getError('phoneNumber')!} />}
            </div>
            <div>
              <Select label="Role" value={String(form.roleId)} onChange={(e) => { setForm({ ...form, roleId: Number(e.target.value) }); modal === 'create' ? createValidation.clearFieldError('roleId') : updateValidation.clearFieldError('roleId'); }} options={roleOptions} />
              {modal === 'create' && createValidation.getError('roleId') && <ValidationError message={createValidation.getError('roleId')!} />}
              {modal === 'edit' && updateValidation.getError('roleId') && <ValidationError message={updateValidation.getError('roleId')!} />}
            </div>
          </div>
          <div className="mt-3 sm:mt-4 flex gap-2">
            <Button type="button" variant="secondary" onClick={() => { setModal(null); createValidation.clearErrors(); updateValidation.clearErrors(); }} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={modal === 'create' ? createValidation.isSubmitting : updateValidation.isSubmitting} className="flex-1">{modal === 'create' ? (createValidation.isSubmitting ? 'Creating...' : 'Create') : (updateValidation.isSubmitting ? 'Saving...' : 'Save changes')}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, userId: null, action: null })}
        onConfirm={handleConfirmDeactivate}
        title={confirmDialog.action === 'deactivate' ? 'Deactivate User' : 'Activate User'}
        message={confirmDialog.action === 'deactivate' 
          ? "Are you sure you want to deactivate this user? They will no longer be able to access the system."
          : "Are you sure you want to activate this user? They will be able to access the system again."}
        confirmText={confirmDialog.action === 'deactivate' ? 'Deactivate' : 'Activate'}
        cancelText="Cancel"
        variant={confirmDialog.action === 'deactivate' ? 'danger' : 'warning'}
      />
    </div>
  );
}
