import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Alert, Button, Card, Input } from '../components/ui';
import { Building2, Lock, User, Shield } from 'lucide-react';

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
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <div className="mx-auto mb-3 sm:mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-lg bg-[#005d90] text-white shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
            <Building2 size={28} className="sm:size-32" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#191c1d] tracking-tight">AI Dental OS</h1>
          <p className="mt-2 text-[#404850]">Multi-clinic practice management</p>
        </div>

        <Card className="p-5 sm:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border-0 bg-white">
          <div className="mb-5 sm:mb-6 flex rounded-lg bg-[#f3f4f5] p-1">
            <button
              type="button"
              className={`flex-1 rounded-md py-2 sm:py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                mode === 'clinic' 
                  ? 'bg-white shadow-md text-[#005d90]' 
                  : 'text-[#404850] hover:text-[#191c1d]'
              }`}
              onClick={() => setMode('clinic')}
            >
              Clinic Staff
            </button>
            <button
              type="button"
              className={`flex-1 rounded-md py-2 sm:py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                mode === 'platform' 
                  ? 'bg-white shadow-md text-[#005d90]' 
                  : 'text-[#404850] hover:text-[#191c1d]'
              }`}
              onClick={() => setMode('platform')}
            >
              Platform Admin
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4 sm:space-y-5">
            {error && <Alert message={error} errors={errors} />}

            {mode === 'clinic' && (
              <div className="space-y-3 sm:space-y-4">
                <label className="flex items-center gap-3 p-3 sm:p-4 rounded-lg bg-[#f8f9fa] border border-[#e1e3e4] cursor-pointer hover:bg-[#edeeef] transition-colors">
                  <input 
                    type="checkbox" 
                    checked={useId} 
                    onChange={(e) => setUseId(e.target.checked)} 
                    className="w-5 h-5 rounded border-[#bfc7d1] text-[#005d90] focus:ring-[#005d90]"
                  />
                  <span className="text-xs sm:text-sm font-medium text-[#191c1d]">Login with clinic ID instead of code</span>
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
              </div>
            )}

            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#707881]" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                required
                className="w-full rounded-lg border border-[#bfc7d1] bg-white pl-12 pr-4 py-3 text-[#191c1d] outline-none focus:border-[#005d90] focus:bg-white focus:ring-2 focus:ring-[#005d90]/20 transition-all placeholder:text-[#707881]"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#707881]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full rounded-lg border border-[#bfc7d1] bg-white pl-12 pr-4 py-3 text-[#191c1d] outline-none focus:border-[#005d90] focus:bg-white focus:ring-2 focus:ring-[#005d90]/20 transition-all placeholder:text-[#707881]"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          {mode === 'clinic' && (
            <div className="mt-5 sm:mt-6 p-3 sm:p-4 rounded-lg bg-[#f8f9fa] border border-[#e1e3e4]">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={16} className="text-[#707881]" />
                <p className="text-xs font-semibold text-[#191c1d]">Demo credentials</p>
              </div>
              <p className="text-xs text-[#404850]">
                Clinic code: <span className="font-mono bg-[#e7e8e9] px-1 rounded">demo-dental</span> • 
                Username: <span className="font-mono bg-[#e7e8e9] px-1 rounded">admin</span> • 
                Password: <span className="font-mono bg-[#e7e8e9] px-1 rounded">Admin@123</span>
              </p>
            </div>
          )}
          {mode === 'platform' && (
            <div className="mt-5 sm:mt-6 p-3 sm:p-4 rounded-lg bg-[#f8f9fa] border border-[#e1e3e4]">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={16} className="text-[#707881]" />
                <p className="text-xs font-semibold text-[#191c1d]">Demo credentials</p>
              </div>
              <p className="text-xs text-[#404850]">
                Username: <span className="font-mono bg-[#e7e8e9] px-1 rounded">superadmin</span> • 
                Password: <span className="font-mono bg-[#e7e8e9] px-1 rounded">SuperAdmin@123</span>
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
