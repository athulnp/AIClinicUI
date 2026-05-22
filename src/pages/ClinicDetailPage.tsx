import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { clinicsApi } from '../api/services';
import { type Clinic } from '../types';
import { formatDate } from '../utils/labels';
import { Alert, Badge, Button, Card, CardHeader, Input, PageLoader } from '../components/ui';

export function ClinicDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    code: '',
    city: '',
    country: '',
    email: '',
    phoneNumber: '',
  });

  useEffect(() => {
    if (!id) return;
    load();
  }, [id]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await clinicsApi.list({ pageNumber: 1, pageSize: 50 });
      const foundClinic = res.data.find((c) => c.id === Number(id));
      if (foundClinic) {
        setClinic(foundClinic);
        setForm({
          name: foundClinic.name || '',
          code: foundClinic.code || '',
          city: foundClinic.city || '',
          country: foundClinic.country || '',
          email: foundClinic.email || '',
          phoneNumber: foundClinic.phoneNumber || '',
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
      await clinicsApi.update(Number(id), form);
      setEditMode(false);
      await load();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    }
  };

  if (loading) return <PageLoader />;
  if (!clinic) return <div className="text-center text-slate-500">Clinic not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{clinic.name}</h1>
          <p className="mt-1 text-slate-500">Code: {clinic.code}</p>
        </div>
        <button onClick={() => navigate('/clinics')} className="text-slate-600 hover:text-slate-900">
          ← Back
        </button>
      </div>

      {error && <Alert message={error} />}

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader title={editMode ? 'Edit Clinic' : 'Clinic Details'} />
          {editMode ? (
            <div className="space-y-4">
              <Input
                label="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <Input
                label="Code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                disabled
              />
              <Input
                label="City"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
              <Input
                label="Country"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
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
                <label className="text-sm font-medium text-slate-700">Name</label>
                <p className="mt-1 text-slate-900">{clinic.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Code</label>
                <p className="mt-1 text-slate-900">{clinic.code}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700">City</label>
                  <p className="mt-1 text-slate-900">{clinic.city}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Country</label>
                  <p className="mt-1 text-slate-900">{clinic.country}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Email</label>
                <p className="mt-1 text-slate-900">{clinic.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Phone Number</label>
                <p className="mt-1 text-slate-900">{clinic.phoneNumber}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Status</label>
                <Badge className="mt-1" variant={clinic.isActive ? 'success' : 'secondary'}>
                  {clinic.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              {clinic.createdAt && (
                <div>
                  <label className="text-sm font-medium text-slate-700">Created</label>
                  <p className="mt-1 text-slate-900">{formatDate(clinic.createdAt)}</p>
                </div>
              )}
              <Button onClick={() => setEditMode(true)} className="w-full">
                Edit
              </Button>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Actions" />
          <div className="space-y-3">
            {!editMode && (
              <Button onClick={() => setEditMode(true)} className="w-full">
                Edit
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
