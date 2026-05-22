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
  patientCode: string;
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
  patientCode: '',
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
  const { needsClinicContext } = useAuth();
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
  }, [page, search, needsClinicContext]);

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
      patientCode: p.patientCode,
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
      const { patientCode, ...rest } = form;
      const body = { ...rest, gender: Number(form.gender) };
      if (modal === 'create') await patientsApi.create({ ...body, patientCode });
      else if (editId) await patientsApi.update(editId, body);
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
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Phone</th>
                <th className="px-5 py-3">DOB</th>
                <th className="px-5 py-3">Gender</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-5 py-3 font-mono text-xs">{p.patientCode}</td>
                  <td className="px-5 py-3 font-medium">{p.fullName}</td>
                  <td className="px-5 py-3">{p.phoneNumber}</td>
                  <td className="px-5 py-3">{formatDate(p.dateOfBirth)}</td>
                  <td className="px-5 py-3">{genderLabels[p.gender]}</td>
                  <td className="px-5 py-3 text-right space-x-1">
                    <Link to={`/patients/${p.id}`}>
                      <Button variant="ghost">View</Button>
                    </Link>
                    <Button variant="ghost" onClick={() => openEdit(p)}>Edit</Button>
                    <Button variant="ghost" onClick={() => remove(p.id)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && <EmptyState message="No patients found." />}
        </div>
        <div className="flex justify-between px-5 py-3 text-sm text-slate-500">
          <span>{total} total</span>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
            <Button variant="secondary" disabled={page * 10 >= total} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      </Card>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'create' ? 'New patient' : 'Edit patient'}>
        {error && <Alert message={error} />}
        <div className="grid gap-3 sm:grid-cols-2">
          {modal === 'create' && (
            <Input label="Patient code" value={form.patientCode} onChange={(e) => setForm({ ...form, patientCode: e.target.value })} required />
          )}
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
