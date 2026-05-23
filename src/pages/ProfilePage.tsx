import { useState } from 'react';
import { ApiError } from '../api/client';
import { usersApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { Alert, Button, Card, CardHeader, Input } from '../components/ui';

export function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    fullName: user?.fullName ?? '',
    email: user?.email ?? '',
    phoneNumber: user?.phoneNumber ?? '',
  });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const saveProfile = async () => {
    setErr(null);
    setMsg(null);
    try {
      await usersApi.updateProfile(profile);
      setMsg('Profile updated');
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Update failed');
    }
  };

  const savePassword = async () => {
    setErr(null);
    setMsg(null);
    try {
      await usersApi.changePassword(passwords);
      setPasswords({ currentPassword: '', newPassword: '' });
      setMsg('Password changed');
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Password change failed');
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
      {msg && <p className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{msg}</p>}
      {err && <Alert message={err} />}

      <Card>
        <CardHeader title="Account" />
        <div className="space-y-2 p-5 text-sm text-slate-600">
          <p>
            <span className="font-medium text-slate-800">Username:</span> {user?.username}
          </p>
          <p>
            <span className="font-medium text-slate-800">Role:</span> {user?.roleName}
          </p>
          {user?.clinicName && (
            <p>
              <span className="font-medium text-slate-800">Clinic:</span> {user.clinicName}
            </p>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Edit profile" />
        <div className="space-y-3 p-5">
          <Input label="Full name" value={profile.fullName} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} />
          <Input label="Email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
          <Input label="Phone" value={profile.phoneNumber} onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })} />
          <Button onClick={saveProfile}>Save profile</Button>
        </div>
      </Card>

      <Card>
        <CardHeader title="Change password" />
        <div className="space-y-3 p-5">
          <Input
            label="Current password"
            type="password"
            value={passwords.currentPassword}
            onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
          />
          <Input
            label="New password"
            type="password"
            value={passwords.newPassword}
            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
          />
          <Button onClick={savePassword}>Update password</Button>
        </div>
      </Card>
    </div>
  );
}
