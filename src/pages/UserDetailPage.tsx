import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { usersApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { type User } from '../types';
import { Alert, Badge, Button, Card, Input, PageLoader, Select } from '../components/ui';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { ValidationError } from '../components/ValidationError';
import { updateProfileSchema } from '../validations/authValidation';
import { useFormValidation } from '../hooks/useFormValidation';

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, needsClinicContext } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; action: 'deactivate' | 'activate' | null }>({ isOpen: false, action: null });
  const [form, setForm] = useState({
    username: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    roleId: 0,
  });

  const updateValidation = useFormValidation(
    updateProfileSchema,
    async (data) => {
      if (!id) return;
      await usersApi.update(Number(id), {
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phoneNumber,
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
      const usr = await usersApi.list({ pageNumber: 1, pageSize: 1 });
      const foundUser = usr.data.find((u) => u.id === Number(id));
      if (foundUser) {
        setUser(foundUser);
        setForm({
          username: foundUser.username || '',
          fullName: foundUser.fullName || '',
          email: foundUser.email || '',
          phoneNumber: foundUser.phoneNumber || '',
          roleId: foundUser.roleId,
        });
      }
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

  const handleDeactivate = async () => {
    if (!id) return;
    setConfirmDialog({ isOpen: true, action: 'deactivate' });
  };

  const handleActivate = async () => {
    if (!id) return;
    setConfirmDialog({ isOpen: true, action: 'activate' });
  };

  const handleConfirmAction = async () => {
    if (!id) return;
    setError(null);
    try {
      if (confirmDialog.action === 'deactivate') {
        await usersApi.deactivate(Number(id));
      } else if (confirmDialog.action === 'activate') {
        await usersApi.activate(Number(id));
      }
      setConfirmDialog({ isOpen: false, action: null });
      navigate('/users');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    }
  };

  if (loading) return <PageLoader />;
  if (!user) return <div className="text-center text-slate-500">User not found</div>;

  const canEdit = currentUser?.roleName === 'SuperAdmin' || Number(id) === currentUser?.id;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#191c1d]">{user.fullName}</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-[#404850]">@{user.username}</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/users')} className="w-full sm:w-auto">
          ← Back
        </Button>
      </div>

      {error && <Alert message={error} />}

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border-0 bg-gradient-to-br from-white to-[#f8f9fa]">
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#191c1d]">{editMode ? 'Edit User' : 'User Details'}</h2>
              <p className="text-sm text-[#404850]">{editMode ? 'Update user information below' : 'View and manage user details'}</p>
            </div>
            {editMode ? (
            <form onSubmit={handleUpdate} className="space-y-3 sm:space-y-4">
              <div>
                <Input
                  label="Full Name"
                  value={form.fullName}
                  onChange={(e) => { setForm({ ...form, fullName: e.target.value }); updateValidation.clearFieldError('fullName'); }}
                />
                {updateValidation.getError('fullName') && <ValidationError message={updateValidation.getError('fullName')!} />}
              </div>
              <div>
                <Input
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => { setForm({ ...form, email: e.target.value }); updateValidation.clearFieldError('email'); }}
                />
                {updateValidation.getError('email') && <ValidationError message={updateValidation.getError('email')!} />}
              </div>
              <div>
                <Input
                  label="Phone Number"
                  value={form.phoneNumber}
                  onChange={(e) => { setForm({ ...form, phoneNumber: e.target.value }); updateValidation.clearFieldError('phoneNumber'); }}
                />
                {updateValidation.getError('phoneNumber') && <ValidationError message={updateValidation.getError('phoneNumber')!} />}
              </div>
              <Select
                label="Role"
                value={String(form.roleId)}
                onChange={(e) => setForm({ ...form, roleId: Number(e.target.value) })}
                options={[
                  { value: '3', label: 'Receptionist' },
                  { value: '2', label: 'Doctor' },
                  { value: '1', label: 'Clinic Admin' },
                  { value: '0', label: 'Super Admin' },
                ]}
              />
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
                <label className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#707881]">Username</label>
                <p className="mt-1 text-[#191c1d] font-medium">{user.username}</p>
              </div>
              <div>
                <label className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#707881]">Email</label>
                <p className="mt-1 text-[#191c1d] font-medium">{user.email}</p>
              </div>
              <div>
                <label className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#707881]">Phone Number</label>
                <p className="mt-1 text-[#191c1d] font-medium">{user.phoneNumber}</p>
              </div>
              <div>
                <label className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#707881]">Role</label>
                <Badge tone="default">{user.roleName}</Badge>
              </div>
              <div>
                <label className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#707881]">Status</label>
                <Badge tone={user.isActive ? 'success' : 'danger'}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              {canEdit && (
                <Button onClick={handleEditMode} className="w-full">
                  Edit
                </Button>
              )}
            </div>
            )}
          </div>
        </Card>

        <Card className="shadow-[0_4px_20px_rgba(0,0,0,0.08)] border-0 bg-gradient-to-br from-white to-[#f8f9fa]">
          <div className="p-4 sm:p-6 space-y-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#191c1d]">Actions</h2>
              <p className="text-sm text-[#404850]">Quick actions for this user</p>
            </div>
            <div className="space-y-3">
              {!editMode && canEdit && user.isActive && (
                <>
                  <Button onClick={handleEditMode} className="w-full">
                    Edit User
                  </Button>
                  <Button onClick={handleDeactivate} className="w-full" variant="danger">
                    Deactivate User
                  </Button>
                </>
              )}
              {!editMode && canEdit && !user.isActive && (
                <>
                  <Button onClick={handleActivate} className="w-full" variant="secondary">
                    Activate User
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      </div>

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, action: null })}
        onConfirm={handleConfirmAction}
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
