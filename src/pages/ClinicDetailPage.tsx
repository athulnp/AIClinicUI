import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { clinicsApi } from '../api/services';
import { type Clinic } from '../types';
import { formatDate } from '../utils/labels';
import { Alert, Badge, Button, Card, Input, PageLoader } from '../components/ui';

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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#191c1d]">{clinic.name}</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-[#404850]">Code: {clinic.code}</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/clinics')} className="w-full sm:w-auto">
          ← Back
        </Button>
      </div>

      {error && <Alert message={error} />}

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border-0 bg-gradient-to-br from-white to-[#f8f9fa]">
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#191c1d]">{editMode ? 'Edit Clinic' : 'Clinic Details'}</h2>
              <p className="text-sm text-[#404850]">{editMode ? 'Update clinic information below' : 'View and manage clinic details'}</p>
            </div>
            {editMode ? (
            <div className="space-y-3 sm:space-y-4">
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
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
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
              </div>
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
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#707881]">Name</label>
                <p className="mt-1 text-[#191c1d] font-medium">{clinic.name}</p>
              </div>
              <div>
                <label className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#707881]">Code</label>
                <p className="mt-1 text-[#191c1d] font-medium">{clinic.code}</p>
              </div>
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#707881]">City</label>
                  <p className="mt-1 text-[#191c1d] font-medium">{clinic.city}</p>
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#707881]">Country</label>
                  <p className="mt-1 text-[#191c1d] font-medium">{clinic.country}</p>
                </div>
              </div>
              <div>
                <label className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#707881]">Email</label>
                <p className="mt-1 text-[#191c1d] font-medium">{clinic.email}</p>
              </div>
              <div>
                <label className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#707881]">Phone Number</label>
                <p className="mt-1 text-[#191c1d] font-medium">{clinic.phoneNumber}</p>
              </div>
              <div>
                <label className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#707881]">Status</label>
                <div className="mt-1">
                  <Badge tone={clinic.isActive ? 'success' : 'default'}>
                    {clinic.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              {clinic.createdAt && (
                <div>
                  <label className="text-sm font-medium text-slate-700">Created</label>
                  <p className="mt-1 text-slate-900">{formatDate(clinic.createdAt)}</p>
                </div>
              )}
              <Button onClick={() => setEditMode(true)} className="w-full">
                Edit Clinic
              </Button>
            </div>
            )}
          </div>
        </Card>

        <Card className="shadow-[0_4px_20px_rgba(0,0,0,0.08)] border-0 bg-gradient-to-br from-white to-[#f8f9fa]">
          <div className="p-4 sm:p-6 space-y-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#191c1d]">Actions</h2>
              <p className="text-sm text-[#404850]">Manage this clinic</p>
            </div>
            <div className="space-y-3">
              {!editMode && (
                <Button onClick={() => setEditMode(true)} className="w-full">
                  Edit Clinic
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
