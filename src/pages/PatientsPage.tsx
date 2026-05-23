import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../api/client';
import { patientsApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { Gender, type Patient } from '../types';
import { formatDate, genderLabels } from '../utils/labels';
import {
  Alert,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Input,
  Modal,
  PageLoader,
  Select,
} from '../components/ui';

const emptyForm: {
  fullName: string;
  gender: Gender;
  dateOfBirth: string;
  phoneNumber: string;
  email: string;
  address: string;
  bloodGroup: string;
  medicalHistory: string;
  allergies: string;
  emergencyContact: string;
  notes: string;
} = {
  fullName: '',
  gender: Gender.Male,
  dateOfBirth: '',
  phoneNumber: '',
  email: '',
  address: '',
  bloodGroup: '',
  medicalHistory: '',
  allergies: '',
  emergencyContact: '',
  notes: '',
};

export function PatientsPage() {
  const { needsClinicContext, selectedClinicId, isSuperAdmin } = useAuth();
  const [items, setItems] = useState<Patient[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (needsClinicContext) return;
    setLoading(true);
    try {
      const res = search
        ? await patientsApi.search(search, { pageNumber: page, pageSize: 10 })
        : await patientsApi.list({ pageNumber: page, pageSize: 10 });
      setItems(res.data);
      setTotal(res.totalRecords);
    } finally {
      setLoading(false);
    }
  }, [page, search, needsClinicContext, selectedClinicId]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setForm(emptyForm);
    setEditId(null);
    setError(null);
    setModal('create');
  };

  const openEdit = (p: Patient) => {
    setForm({
      fullName: p.fullName,
      gender: p.gender,
      dateOfBirth: p.dateOfBirth.split('T')[0],
      phoneNumber: p.phoneNumber,
      email: p.email ?? '',
      address: p.address ?? '',
      bloodGroup: p.bloodGroup ?? '',
      medicalHistory: p.medicalHistory ?? '',
      allergies: p.allergies ?? '',
      emergencyContact: p.emergencyContact ?? '',
      notes: p.notes ?? '',
    });
    setEditId(p.id);
    setError(null);
    setModal('edit');
  };

  const save = async () => {
    setError(null);
    try {
      const body: Record<string, unknown> = { ...form, gender: Number(form.gender) };
      if (modal === 'create') {
        if (isSuperAdmin && selectedClinicId) {
          body.clinicId = selectedClinicId;
        }
        await patientsApi.create(body);
      } else if (editId) {
        await patientsApi.update(editId, body);
      }
      setModal(null);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Save failed');
    }
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this patient?')) return;
    await patientsApi.delete(id);
    load();
  };

  if (needsClinicContext) return <EmptyState message="Select a clinic to manage patients." />;
  if (loading && items.length === 0) return <PageLoader />;

  return (
    <div>
      <Card>
        <CardHeader
          title="Patients"
          action={
            <Button onClick={openCreate}>Add patient</Button>
          }
        />
        <div className="flex gap-3 border-b border-slate-100 px-5 py-3">
          <Input
            placeholder="Search name or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Button variant="secondary" onClick={() => { setPage(1); load(); }}>
            Search
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700">Code</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Name</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Phone</th>
                <th className="px-6 py-4 font-semibold text-slate-700">DOB</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Gender</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-slate-600 bg-slate-50/30 rounded-lg">{p.patientCode}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">{p.fullName}</td>
                  <td className="px-6 py-4 text-slate-600">{p.phoneNumber}</td>
                  <td className="px-6 py-4 text-slate-600">{formatDate(p.dateOfBirth)}</td>
                  <td className="px-6 py-4">{genderLabels[p.gender]}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/patients/${p.id}`}>
                        <Button variant="ghost">View</Button>
                      </Link>
                      <Button variant="ghost" onClick={() => openEdit(p)}>Edit</Button>
                      <Button variant="ghost" onClick={() => remove(p.id)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && <EmptyState message="No patients found." />}
        </div>
        <div className="flex justify-between items-center px-6 py-4 text-sm text-slate-500 border-t border-slate-100">
          <span className="font-medium">{total} total</span>
          <div className="flex gap-2">
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" disabled={page * 10 >= total} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      </Card>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'New patient' : 'Edit patient'}>
        {error && <Alert message={error} />}
        {modal === 'edit' && editId && (
          <div className="mb-3">
            <label className="text-sm font-medium text-slate-700">Patient Code</label>
            <p className="mt-1 font-mono text-sm text-slate-600">{items.find(p => p.id === editId)?.patientCode}</p>
          </div>
        )}
        {isSuperAdmin && modal === 'create' && selectedClinicId && (
          <div className="mb-3">
            <label className="text-sm font-medium text-slate-700">Clinic</label>
            <p className="mt-1 text-sm text-slate-600">Creating for currently selected clinic (ID: {selectedClinicId})</p>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          <Select label="Gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: Number(e.target.value) as Gender })} options={Object.entries(genderLabels).map(([k, v]) => ({ value: k, label: v }))} />
          <Input label="Date of birth" type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} required />
          <Input label="Phone" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} required />
          <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Blood group" value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })} />
          <Input label="Emergency contact" value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} />
        </div>
        <Input label="Address" className="mt-3" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <Input label="Allergies" className="mt-3" value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
          <Button onClick={save}>Save</Button>
        </div>
      </Modal>
    </div>
  );
}
