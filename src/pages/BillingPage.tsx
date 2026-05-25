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
import { SearchFilter, useDebouncedSearch } from '../components/SearchFilter';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { ValidationError } from '../components/ValidationError';
import { createBillingSchema, updateBillingSchema, recordPaymentSchema } from '../validations/billingValidation';
import { useFormValidation } from '../hooks/useFormValidation';

export function BillingPage() {
  const { needsClinicContext, isSuperAdmin, selectedClinicId } = useAuth();
  const [tab, setTab] = useState<'all' | 'outstanding'>('all');
  const [items, setItems] = useState<Billing[]>([]);
  const [outstanding, setOutstanding] = useState<Billing[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const { searchQuery, setSearchQuery, filteredItems: allFiltered } = useDebouncedSearch(
    items,
    ['invoiceNumber' as keyof Billing, 'patientName' as keyof Billing]
  );
  const { filteredItems: outstandingFiltered } = useDebouncedSearch(
    outstanding,
    ['invoiceNumber' as keyof Billing, 'patientName' as keyof Billing]
  );
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [payOpen, setPayOpen] = useState<Billing | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; billingId: number | null }>({
    isOpen: false,
    billingId: null,
  });
  const [form, setForm] = useState<{ patientId: string; totalAmount: string; paymentMethod: PaymentMethod; notes: string }>({
    patientId: '',
    totalAmount: '',
    paymentMethod: PaymentMethod.Cash,
    notes: '',
  });
  const [payAmount, setPayAmount] = useState('');

  const createValidation = useFormValidation(
    createBillingSchema,
    async (data) => {
      const body: Record<string, unknown> = {
        patientId: Number(data.patientId),
        totalAmount: Number(data.totalAmount),
        paymentMethod: Number(data.paymentMethod),
        notes: data.notes || undefined,
      };
      if (isSuperAdmin && selectedClinicId) {
        body.clinicId = selectedClinicId;
      }
      await billingApi.create(body);
      setModal(null);
      setForm({ patientId: '', totalAmount: '', paymentMethod: PaymentMethod.Cash, notes: '' });
      load();
    }
  );

  const updateValidation = useFormValidation(
    updateBillingSchema,
    async (data) => {
      if (!editId) return;
      await billingApi.update(editId, {
        patientId: Number(data.patientId),
        totalAmount: Number(data.totalAmount),
        paymentMethod: Number(data.paymentMethod),
        notes: data.notes || undefined,
      });
      setModal(null);
      load();
    }
  );

  const recordPaymentValidation = useFormValidation(
    recordPaymentSchema,
    async (data) => {
      if (!payOpen) return;
      await billingApi.recordPayment(payOpen.id, {
        paymentAmount: Number(data.paymentAmount),
        paymentMethod: Number(data.paymentMethod),
        notes: data.notes || undefined,
      });
      setPayOpen(null);
      setPayAmount('');
      load();
    }
  );

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

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await createValidation.handleSubmit(form);
    if (!success) return;
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
    updateValidation.clearErrors();
    setModal('edit');
  };

  const update = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await updateValidation.handleSubmit(form);
    if (!success) return;
  };

  const remove = async (id: number) => {
    setConfirmDialog({ isOpen: true, billingId: id });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDialog.billingId) return;
    try {
      await billingApi.delete(confirmDialog.billingId);
      setConfirmDialog({ isOpen: false, billingId: null });
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Delete failed');
    }
  };

  const recordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const paymentForm = {
      paymentAmount: payAmount,
      paymentMethod: payOpen?.paymentMethod || 0,
      notes: '',
    };
    const success = await recordPaymentValidation.handleSubmit(paymentForm);
    if (!success) return;
  };

  const totalAmount = items.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalBalance = items.reduce((sum, b) => sum + b.balanceAmount, 0);
  const outstandingCount = items.filter((b) => b.paymentStatus !== PaymentStatus.Paid).length;

  if (needsClinicContext) return <EmptyState message="Select a clinic for billing." />;
  if (loading) return <PageLoader />;

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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <SearchFilter
              placeholder="Search by invoice or patient name..."
              onSearch={setSearchQuery}
              className="w-full sm:max-w-md"
            />
          </div>
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
              {(tab === 'outstanding' ? outstandingFiltered : allFiltered).map((b) => (
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
          {(tab === 'outstanding' ? outstandingFiltered : allFiltered).length === 0 && (
            <EmptyState 
              message={searchQuery 
                ? `No invoices found matching "${searchQuery}".` 
                : (tab === 'outstanding' ? 'No outstanding invoices.' : 'No billing records.')
              } 
            />
          )}
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
        <form onSubmit={modal === 'create' ? create : update} className="space-y-3">
          <div>
            <Select
              label="Patient"
              value={form.patientId}
              onChange={(e) => { setForm({ ...form, patientId: e.target.value }); modal === 'create' ? createValidation.clearFieldError('patientId') : updateValidation.clearFieldError('patientId'); }}
              options={[{ value: '', label: 'Select…' }, ...patients.map((p) => ({ value: p.id, label: p.fullName }))]}
            />
            {modal === 'create' && createValidation.getError('patientId') && <ValidationError message={createValidation.getError('patientId')!} />}
            {modal === 'edit' && updateValidation.getError('patientId') && <ValidationError message={updateValidation.getError('patientId')!} />}
          </div>
          <div>
            <Input label="Total amount" type="number" value={form.totalAmount} onChange={(e) => { setForm({ ...form, totalAmount: e.target.value }); modal === 'create' ? createValidation.clearFieldError('totalAmount') : updateValidation.clearFieldError('totalAmount'); }} />
            {modal === 'create' && createValidation.getError('totalAmount') && <ValidationError message={createValidation.getError('totalAmount')!} />}
            {modal === 'edit' && updateValidation.getError('totalAmount') && <ValidationError message={updateValidation.getError('totalAmount')!} />}
          </div>
          <div>
            <Select
              label="Payment method"
              value={form.paymentMethod}
              onChange={(e) => { setForm({ ...form, paymentMethod: Number(e.target.value) as PaymentMethod }); modal === 'create' ? createValidation.clearFieldError('paymentMethod') : updateValidation.clearFieldError('paymentMethod'); }}
              options={Object.entries(paymentMethodLabels).map(([k, v]) => ({ value: k, label: v }))}
            />
            {modal === 'create' && createValidation.getError('paymentMethod') && <ValidationError message={createValidation.getError('paymentMethod')!} />}
            {modal === 'edit' && updateValidation.getError('paymentMethod') && <ValidationError message={updateValidation.getError('paymentMethod')!} />}
          </div>
          <div>
            <Input label="Notes" value={form.notes} onChange={(e) => { setForm({ ...form, notes: e.target.value }); modal === 'create' ? createValidation.clearFieldError('notes') : updateValidation.clearFieldError('notes'); }} />
            {modal === 'create' && createValidation.getError('notes') && <ValidationError message={createValidation.getError('notes')!} />}
            {modal === 'edit' && updateValidation.getError('notes') && <ValidationError message={updateValidation.getError('notes')!} />}
          </div>
          <div className="mt-3 sm:mt-4 flex gap-2">
            <Button type="button" variant="secondary" onClick={() => { setModal(null); createValidation.clearErrors(); updateValidation.clearErrors(); }} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={modal === 'create' ? createValidation.isSubmitting : updateValidation.isSubmitting} className="flex-1">{modal === 'create' ? (createValidation.isSubmitting ? 'Creating...' : 'Create') : (updateValidation.isSubmitting ? 'Saving...' : 'Save')}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!payOpen} onClose={() => setPayOpen(null)} title="Record payment">
        {error && <Alert message={error} />}
        {payOpen && (
          <form onSubmit={recordPayment}>
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
            <div>
              <Input label="Payment amount" type="number" value={payAmount} onChange={(e) => { setPayAmount(e.target.value); recordPaymentValidation.clearFieldError('paymentAmount'); }} />
              {recordPaymentValidation.getError('paymentAmount') && <ValidationError message={recordPaymentValidation.getError('paymentAmount')!} />}
            </div>
            <div className="mt-3">
              <Select
                label="Payment method"
                value={payOpen.paymentMethod}
                onChange={() => recordPaymentValidation.clearFieldError('paymentMethod')}
                options={Object.entries(paymentMethodLabels).map(([k, v]) => ({ value: k, label: v }))}
              />
              {recordPaymentValidation.getError('paymentMethod') && <ValidationError message={recordPaymentValidation.getError('paymentMethod')!} />}
            </div>
            <div className="mt-3">
              <Input label="Notes" value="" onChange={() => recordPaymentValidation.clearFieldError('notes')} />
              {recordPaymentValidation.getError('notes') && <ValidationError message={recordPaymentValidation.getError('notes')!} />}
            </div>
            <div className="mt-3 sm:mt-4 flex gap-2">
              <Button type="button" variant="secondary" onClick={() => { setPayOpen(null); recordPaymentValidation.clearErrors(); }} className="flex-1">Cancel</Button>
              <Button type="submit" disabled={recordPaymentValidation.isSubmitting} className="flex-1">{recordPaymentValidation.isSubmitting ? 'Recording...' : 'Record Payment'}</Button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, billingId: null })}
        onConfirm={handleConfirmDelete}
        title="Delete Invoice"
        message="Are you sure you want to delete this invoice? This action cannot be undone and will remove all associated payment records."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
