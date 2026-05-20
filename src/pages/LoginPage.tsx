import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Alert, Button, Card, Input } from '../components/ui';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'clinic' | 'platform'>('clinic');
  const [clinicCode, setClinicCode] = useState('demo-dental');
  const [clinicId, setClinicId] = useState('');
  const [useId, setUseId] = useState(false);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@123');
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrors([]);
    setLoading(true);
    try {
      await login({
        username,
        password,
        ...(mode === 'platform'
          ? {}
          : useId
            ? { clinicId: Number(clinicId) }
            : { clinicCode: clinicCode.trim() }),
      });
      navigate('/');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setErrors(err.errors);
      } else setError('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-800 via-brand-700 to-slate-900 p-4">
      <Card className="w-full max-w-md !border-0 p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-2xl text-white">
            🦷
          </div>
          <h1 className="text-2xl font-bold text-slate-900">AI Dental OS</h1>
          <p className="mt-1 text-sm text-slate-500">Multi-clinic practice management</p>
        </div>

        <div className="mb-6 flex rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            className={`flex-1 rounded-md py-2 text-sm font-medium ${mode === 'clinic' ? 'bg-white shadow text-brand-700' : 'text-slate-600'}`}
            onClick={() => setMode('clinic')}
          >
            Clinic staff
          </button>
          <button
            type="button"
            className={`flex-1 rounded-md py-2 text-sm font-medium ${mode === 'platform' ? 'bg-white shadow text-brand-700' : 'text-slate-600'}`}
            onClick={() => setMode('platform')}
          >
            Platform admin
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {error && <Alert message={error} errors={errors} />}

          {mode === 'clinic' && (
            <>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={useId} onChange={(e) => setUseId(e.target.checked)} />
                Login with clinic ID instead of code
              </label>
              {useId ? (
                <Input
                  label="Clinic ID"
                  type="number"
                  value={clinicId}
                  onChange={(e) => setClinicId(e.target.value)}
                  placeholder="1"
                  required
                />
              ) : (
                <Input
                  label="Clinic code"
                  value={clinicCode}
                  onChange={(e) => setClinicCode(e.target.value)}
                  placeholder="demo-dental"
                  required
                />
              )}
            </>
          )}

          <Input label="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        {mode === 'clinic' && (
          <p className="mt-6 text-center text-xs text-slate-400">
            Demo: demo-dental / admin / Admin@123
          </p>
        )}
        {mode === 'platform' && (
          <p className="mt-6 text-center text-xs text-slate-400">Demo: superadmin / SuperAdmin@123</p>
        )}
      </Card>
    </div>
  );
}
