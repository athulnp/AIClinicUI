import { useEffect, useState } from 'react';
import { ApiError } from '../api/client';
import { billingApi, patientsApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { PaymentMethod, PaymentStatus, type Billing, type Patient } from '../types';
import { paymentMethodLabels, paymentStatusLabels } from '../utils/labels';
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

export function BillingPage() {
  const { needsClinicContext, isSuperAdmin, selectedClinicId } = useAuth();
  const [tab, setTab] = useState<'all' | 'outstanding'>('all');
  const [items, setItems] = useState<Billing[]>([]);
  const [outstanding, setOutstanding] = useState<Billing[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [payOpen, setPayOpen] = useState<Billing | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<{ patientId: string; totalAmount: string; paymentMethod: PaymentMethod; notes: string }>({
    patientId: '',
    totalAmount: '',
    paymentMethod: PaymentMethod.Cash,
    notes: '',
  });
  const [payAmount, setPayAmount] = useState('');

  const load = async () => {
    if (needsClinicContext) return;
    setLoading(true);
    try {
      const [b, p] = await Promise.all([
        billingApi.list({ pageNumber: 1, pageSize: 50 }),
        patientsApi.list({ pageNumber: 1, pageSize: 100 }),
      ]);
      setItems(b.data);
      setOutstanding(b.data.filter((bill) => bill.balanceAmount > 0));
      setPatients(p.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [needsClinicContext, selectedClinicId]);

  const create = async () => {
    setError(null);
    try {
      const body: Record<string, unknown> = {
        patientId: Number(form.patientId),
        totalAmount: Number(form.totalAmount),
        paymentMethod: Number(form.paymentMethod),
        notes: form.notes || undefined,
      };
      if (isSuperAdmin && selectedClinicId) {
        body.clinicId = selectedClinicId;
      }
      await billingApi.create(body);
      setModal(null);
      setForm({ patientId: '', totalAmount: '', paymentMethod: PaymentMethod.Cash, notes: '' });
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to create invoice');
    }
  };

  const openEdit = (billing: Billing) => {
    setForm({
      patientId: String(billing.patientId),
      totalAmount: String(billing.totalAmount),
      paymentMethod: billing.paymentMethod,
      notes: billing.notes || '',
    });
    setEditId(billing.id);
    setError(null);
    setModal('edit');
  };

  const update = async () => {
    setError(null);
    try {
      await billingApi.update(editId!, {
        patientId: Number(form.patientId),
        totalAmount: Number(form.totalAmount),
        paymentMethod: Number(form.paymentMethod),
        notes: form.notes || undefined,
      });
      setModal(null);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to update invoice');
    }
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this invoice?')) return;
    try {
      await billingApi.delete(id);
      load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Delete failed');
    }
  };

  const recordPayment = async () => {
    if (!payOpen) return;
    setError(null);
    try {
      await billingApi.recordPayment(payOpen.id, {
        paymentAmount: Number(payAmount),
        paymentMethod: payOpen.paymentMethod,
      });
      setPayOpen(null);
      setPayAmount('');
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to record payment');
    }
  };

  const totalAmount = items.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalBalance = items.reduce((sum, b) => sum + b.balanceAmount, 0);
  const outstandingCount = items.filter((b) => b.paymentStatus !== PaymentStatus.Paid).length;

  if (needsClinicContext) return <EmptyState message="Select a clinic for billing." />;
  if (loading) return <PageLoader />;

  const displayItems = tab === 'outstanding' ? outstanding : items;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-sm font-medium text-slate-600">Total Amount</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">₹{totalAmount.toFixed(2)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-medium text-slate-600">Outstanding Balance</p>
          <p className="mt-2 text-2xl font-bold text-red-600">₹{totalBalance.toFixed(2)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-medium text-slate-600">Pending Invoices</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">{outstandingCount}</p>
        </Card>
      </div>

      <Card>
        <CardHeader title="Invoices" action={<Button onClick={() => { setForm({ patientId: '', totalAmount: '', paymentMethod: PaymentMethod.Cash, notes: '' }); setModal('create'); }}>New invoice</Button>} />
        <div className="border-b border-slate-100 px-5 py-3">
          <div className="flex gap-2">
            <button
              onClick={() => setTab('all')}
              className={`px-3 py-1 text-sm font-medium transition ${tab === 'all' ? 'border-b-2 border-brand-600 text-brand-600' : 'text-slate-600 hover:text-slate-900'}`}
            >
              All ({items.length})
            </button>
            <button
              onClick={() => setTab('outstanding')}
              className={`px-3 py-1 text-sm font-medium transition ${tab === 'outstanding' ? 'border-b-2 border-brand-600 text-brand-600' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Outstanding ({outstanding.length})
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-5 py-3">Invoice</th>
                <th className="px-5 py-3">Patient</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Paid</th>
                <th className="px-5 py-3">Balance</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {displayItems.map((b) => (
                <tr key={b.id} className="border-t border-slate-100">
                  <td className="px-5 py-3 font-mono text-xs">{b.invoiceNumber}</td>
                  <td className="px-5 py-3">{b.patientName}</td>
                  <td className="px-5 py-3">₹{b.totalAmount.toFixed(2)}</td>
                  <td className="px-5 py-3">₹{b.paidAmount.toFixed(2)}</td>
                  <td className="px-5 py-3">₹{b.balanceAmount.toFixed(2)}</td>
                  <td className="px-5 py-3">
                    <Badge tone={b.paymentStatus === PaymentStatus.Paid ? 'success' : b.paymentStatus === PaymentStatus.Partial ? 'warn' : 'danger'}>
                      {paymentStatusLabels[b.paymentStatus]}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right space-x-1">
                    {b.balanceAmount > 0 && (
                      <Button variant="ghost" onClick={() => { setPayOpen(b); setPayAmount(String(b.balanceAmount)); }}>
                        Pay
                      </Button>
                    )}
                    <Button variant="ghost" onClick={() => openEdit(b)}>Edit</Button>
                    <Button variant="ghost" onClick={() => remove(b.id)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {displayItems.length === 0 && <EmptyState message={tab === 'outstanding' ? 'No outstanding invoices.' : 'No billing records.'} />}
        </div>
      </Card>

      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal === 'create' ? 'New invoice' : 'Edit invoice'}>
        {error && <Alert message={error} />}
        {isSuperAdmin && modal === 'create' && selectedClinicId && (
          <div className="mb-3">
            <label className="text-sm font-medium text-slate-700">Clinic</label>
            <p className="mt-1 text-sm text-slate-600">Creating for currently selected clinic (ID: {selectedClinicId})</p>
          </div>
        )}
        <div className="space-y-3">
          <Select
            label="Patient"
            value={form.patientId}
            onChange={(e) => setForm({ ...form, patientId: e.target.value })}
            options={[{ value: '', label: 'Select…' }, ...patients.map((p) => ({ value: p.id, label: p.fullName }))]}
          />
          <Input label="Total amount" type="number" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} />
          <Select
            label="Payment method"
            value={form.paymentMethod}
            onChange={(e) => setForm({ ...form, paymentMethod: Number(e.target.value) as PaymentMethod })}
            options={Object.entries(paymentMethodLabels).map(([k, v]) => ({ value: k, label: v }))}
          />
          <Input label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
        <div className="mt-3 sm:mt-4 flex gap-2">
          <Button variant="secondary" onClick={() => setModal(null)} className="flex-1">Cancel</Button>
          <Button onClick={modal === 'create' ? create : update} className="flex-1">{modal === 'create' ? 'Create' : 'Save'}</Button>
        </div>
      </Modal>

      <Modal open={!!payOpen} onClose={() => setPayOpen(null)} title="Record payment">
        {error && <Alert message={error} />}
        {payOpen && (
          <>
            <div className="mb-3 sm:mb-4 space-y-2 pb-4 border-b text-xs sm:text-sm">
              <div>
                <span className="font-medium text-slate-700">Invoice:</span> {payOpen.invoiceNumber}
              </div>
              <div>
                <span className="font-medium text-slate-700">Patient:</span> {payOpen.patientName}
              </div>
              <div>
                <span className="font-medium text-slate-700">Total:</span> ₹{payOpen.totalAmount.toFixed(2)}
              </div>
              <div>
                <span className="font-medium text-slate-700">Paid:</span> ₹{payOpen.paidAmount.toFixed(2)}
              </div>
              <div>
                <span className="font-medium text-slate-700">Balance:</span> ₹{payOpen.balanceAmount.toFixed(2)}
              </div>
            </div>
            <Input label="Payment amount" type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
            <div className="mt-3 sm:mt-4 flex gap-2">
              <Button variant="secondary" onClick={() => setPayOpen(null)} className="flex-1">Cancel</Button>
              <Button onClick={recordPayment} className="flex-1">Record payment</Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
