import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { billingApi, patientsApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { PaymentMethod, type Billing, type Patient } from '../types';
import { paymentMethodLabels } from '../utils/labels';
import { Alert, Button, Card, CardHeader, Input, PageLoader, Select } from '../components/ui';

export function BillingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { needsClinicContext } = useAuth();
  const [billing, setBilling] = useState<Billing | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMode, setPaymentMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    amount: '',
    paymentMethod: 1 as PaymentMethod,
    notes: '',
  });

  useEffect(() => {
    if (needsClinicContext || !id) return;
    load();
  }, [id, needsClinicContext]);

  const load = async () => {
    setLoading(true);
    try {
      const bill = await billingApi.list({ pageNumber: 1, pageSize: 1 });
      const foundBilling = bill.data.find((b) => b.id === Number(id));
      if (foundBilling) {
        setBilling(foundBilling);
        const pts = await patientsApi.list({ pageNumber: 1, pageSize: 100 });
        const foundPatient = pts.data.find((p) => p.id === foundBilling.patientId);
        if (foundPatient) setPatient(foundPatient);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!id) return;
    setError(null);
    try {
      await billingApi.recordPayment(Number(id), {
        amount: Number(form.amount),
        paymentMethod: form.paymentMethod,
        notes: form.notes || undefined,
      });
      setPaymentMode(false);
      setForm({ amount: '', paymentMethod: PaymentMethod.Cash, notes: '' });
      await load();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    }
  };

  if (loading) return <PageLoader />;
  if (!billing) return <div className="text-center text-slate-500">Billing record not found</div>;

  const outstandingBalance = billing.totalAmount;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Invoice #{billing.invoiceNumber}</h1>
          <p className="mt-1 text-slate-500">{patient?.fullName}</p>
        </div>
        <button onClick={() => navigate('/billing')} className="text-slate-600 hover:text-slate-900">
          ← Back
        </button>
      </div>

      {error && <Alert message={error} />}

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader title="Billing Details" />
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Invoice Number</label>
                <p className="mt-1 text-slate-900">{billing.invoiceNumber}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Total Amount</label>
              <p className="mt-1 text-lg font-semibold text-slate-900">₹{billing.totalAmount}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Outstanding Balance</label>
              <p className={`mt-1 text-lg font-semibold ${outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ₹{outstandingBalance}
              </p>
            </div>

            {billing.notes && (
              <div>
                <label className="text-sm font-medium text-slate-700">Notes</label>
                <p className="mt-1 text-slate-900">{billing.notes}</p>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Actions" />
          <div className="space-y-3">
            {outstandingBalance > 0 && (
              <Button
                onClick={() => setPaymentMode(!paymentMode)}
                className="w-full"
                variant={paymentMode ? 'secondary' : 'primary'}
              >
                {paymentMode ? 'Cancel' : 'Record Payment'}
              </Button>
            )}
          </div>
        </Card>
      </div>

      {paymentMode && outstandingBalance > 0 && (
        <Card>
          <CardHeader title="Record Payment" />
          <div className="space-y-4">
            <Input
              label="Amount"
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder={`Max: ₹${outstandingBalance}`}
              max={outstandingBalance}
            />
            <Select
              label="Payment Method"
              value={String(form.paymentMethod)}
              onChange={(e) => setForm({ ...form, paymentMethod: Number(e.target.value) as PaymentMethod })}
              options={[
                { value: String(PaymentMethod.Cash), label: paymentMethodLabels[PaymentMethod.Cash] },
                { value: String(PaymentMethod.UPI), label: paymentMethodLabels[PaymentMethod.UPI] },
                { value: String(PaymentMethod.Card), label: paymentMethodLabels[PaymentMethod.Card] },
                { value: String(PaymentMethod.BankTransfer), label: paymentMethodLabels[PaymentMethod.BankTransfer] },
              ]}
            />
            <Input
              label="Notes (Optional)"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Payment notes..."
            />
            <Button onClick={handleRecordPayment} className="w-full">
              Confirm Payment
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
