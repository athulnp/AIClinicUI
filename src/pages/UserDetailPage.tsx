import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { usersApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { type User } from '../types';
import { Alert, Badge, Button, Card, CardHeader, Input, PageLoader, Select } from '../components/ui';

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, needsClinicContext } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    username: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    roleId: 0,
  });

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

  const handleUpdate = async () => {
    if (!id) return;
    setError(null);
    try {
      await usersApi.update(Number(id), form);
      setEditMode(false);
      await load();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    }
  };

  const handleDeactivate = async () => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to deactivate this user?')) return;
    setError(null);
    try {
      await usersApi.deactivate(Number(id));
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{user.fullName}</h1>
          <p className="mt-1 text-slate-500">@{user.username}</p>
        </div>
        <button onClick={() => navigate('/users')} className="text-slate-600 hover:text-slate-900">
          ← Back
        </button>
      </div>

      {error && <Alert message={error} />}

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader title={editMode ? 'Edit User' : 'User Details'} />
          {editMode ? (
            <div className="space-y-4">
              <Input
                label="Full Name"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <Input
                label="Phone Number"
                value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              />
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
                <label className="text-sm font-medium text-slate-700">Username</label>
                <p className="mt-1 text-slate-900">{user.username}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Email</label>
                <p className="mt-1 text-slate-900">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Phone Number</label>
                <p className="mt-1 text-slate-900">{user.phoneNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Role</label>
                <Badge tone="default">{user.roleName}</Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Status</label>
                <Badge tone={user.isActive ? 'success' : 'danger'}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              {canEdit && (
                <Button onClick={() => setEditMode(true)} className="w-full">
                  Edit
                </Button>
              )}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Actions" />
          <div className="space-y-3">
            {!editMode && canEdit && user.isActive && (
              <>
                <Button onClick={() => setEditMode(true)} className="w-full">
                  Edit
                </Button>
                <Button onClick={handleDeactivate} className="w-full" variant="danger">
                  Deactivate User
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
