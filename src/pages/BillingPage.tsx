import { useEffect, useState } from 'react';
import { billingApi, patientsApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { PaymentMethod, PaymentStatus, type Billing, type Patient } from '../types';
import { paymentMethodLabels, paymentStatusLabels } from '../utils/labels';
import {
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
  const { needsClinicContext } = useAuth();
  const [items, setItems] = useState<Billing[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [payOpen, setPayOpen] = useState<Billing | null>(null);
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
    const [b, p] = await Promise.all([
      billingApi.list({ pageNumber: 1, pageSize: 20 }),
      patientsApi.list({ pageNumber: 1, pageSize: 100 }),
    ]);
    setItems(b.data);
    setPatients(p.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [needsClinicContext]);

  const create = async () => {
    await billingApi.create({
      patientId: Number(form.patientId),
      totalAmount: Number(form.totalAmount),
      paymentMethod: Number(form.paymentMethod),
      notes: form.notes || undefined,
    });
    setCreateOpen(false);
    load();
  };

  const recordPayment = async () => {
    if (!payOpen) return;
    await billingApi.recordPayment(payOpen.id, {
      paymentAmount: Number(payAmount),
      paymentMethod: payOpen.paymentMethod,
    });
    setPayOpen(null);
    load();
  };

  if (needsClinicContext) return <EmptyState message="Select a clinic for billing." />;
  if (loading) return <PageLoader />;

  return (
    <div>
      <Card>
        <CardHeader title="Billing" action={<Button onClick={() => setCreateOpen(true)}>New invoice</Button>} />
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-5 py-3">Invoice</th>
              <th className="px-5 py-3">Patient</th>
              <th className="px-5 py-3">Total</th>
              <th className="px-5 py-3">Balance</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((b) => (
              <tr key={b.id} className="border-t border-slate-100">
                <td className="px-5 py-3 font-mono text-xs">{b.invoiceNumber}</td>
                <td className="px-5 py-3">{b.patientName}</td>
                <td className="px-5 py-3">₹{b.totalAmount.toFixed(2)}</td>
                <td className="px-5 py-3">₹{b.balanceAmount.toFixed(2)}</td>
                <td className="px-5 py-3">
                  <Badge tone={b.paymentStatus === PaymentStatus.Paid ? 'success' : 'warn'}>
                    {paymentStatusLabels[b.paymentStatus]}
                  </Badge>
                </td>
                <td className="px-5 py-3 text-right">
                  {b.balanceAmount > 0 && (
                    <Button variant="ghost" onClick={() => { setPayOpen(b); setPayAmount(String(b.balanceAmount)); }}>
                      Record payment
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <EmptyState message="No billing records." />}
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New invoice">
        <Select
          label="Patient"
          value={form.patientId}
          onChange={(e) => setForm({ ...form, patientId: e.target.value })}
          options={[{ value: '', label: 'Select…' }, ...patients.map((p) => ({ value: p.id, label: p.fullName }))]}
        />
        <Input label="Total amount" type="number" className="mt-3" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} />
        <Select
          label="Payment method"
          className="mt-3"
          value={form.paymentMethod}
          onChange={(e) => setForm({ ...form, paymentMethod: Number(e.target.value) as PaymentMethod })}
          options={Object.entries(paymentMethodLabels).map(([k, v]) => ({ value: k, label: v }))}
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button onClick={create}>Create</Button>
        </div>
      </Modal>

      <Modal open={!!payOpen} onClose={() => setPayOpen(null)} title="Record payment">
        {payOpen && (
          <>
            <p className="text-sm text-slate-600">Invoice {payOpen.invoiceNumber} — balance ₹{payOpen.balanceAmount}</p>
            <Input label="Amount" type="number" className="mt-3" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setPayOpen(null)}>Cancel</Button>
              <Button onClick={recordPayment}>Submit</Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
