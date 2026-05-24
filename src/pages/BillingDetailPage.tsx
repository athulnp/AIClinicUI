import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { billingApi, patientsApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { PaymentMethod, type Billing, type Patient } from '../types';
import { paymentMethodLabels } from '../utils/labels';
import { Alert, Button, Card, Input, PageLoader, Select } from '../components/ui';

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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#191c1d]">Invoice #{billing.invoiceNumber}</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-[#404850]">{patient?.fullName}</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/billing')} className="w-full sm:w-auto">
          ← Back
        </Button>
      </div>

      {error && <Alert message={error} />}

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border-0 bg-gradient-to-br from-white to-[#f8f9fa]">
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#191c1d]">Billing Details</h2>
              <p className="mt-1 text-sm text-[#404850]">Invoice information and payment status</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#707881]">Invoice Number</label>
                <p className="mt-1 text-[#191c1d] font-medium">{billing.invoiceNumber}</p>
              </div>

              <div>
                <label className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#707881]">Total Amount</label>
                <p className="mt-1 text-lg sm:text-xl font-bold text-[#191c1d]">₹{billing.totalAmount.toFixed(2)}</p>
              </div>

              <div>
                <label className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#707881]">Outstanding Balance</label>
                <p className={`mt-1 text-lg sm:text-xl font-bold ${outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ₹{outstandingBalance.toFixed(2)}
                </p>
              </div>

              {billing.notes && (
                <div>
                  <label className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#707881]">Notes</label>
                  <p className="mt-1 text-[#191c1d]">{billing.notes}</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="shadow-[0_4px_20px_rgba(0,0,0,0.08)] border-0 bg-gradient-to-br from-white to-[#f8f9fa]">
          <div className="p-4 sm:p-6 space-y-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#191c1d]">Actions</h2>
              <p className="text-sm text-[#404850]">Manage this invoice</p>
            </div>
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
          </div>
        </Card>
      </div>

      {paymentMode && outstandingBalance > 0 && (
        <Card className="shadow-[0_4px_20px_rgba(0,0,0,0.08)] border-0 bg-gradient-to-br from-white to-[#f8f9fa]">
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#191c1d]">Record Payment</h2>
              <p className="text-sm text-[#404850]">Add a payment to this invoice</p>
            </div>
            <div className="space-y-3 sm:space-y-4">
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
          </div>
        </Card>
      )}
    </div>
  );
}
