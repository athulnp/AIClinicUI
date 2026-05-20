import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authApi } from '../api/services';
import { UserRole, type User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  selectedClinicId: number | null;
  login: (payload: {
    username: string;
    password: string;
    clinicCode?: string;
    clinicId?: number;
  }) => Promise<void>;
  logout: () => Promise<void>;
  setSelectedClinicId: (id: number | null) => void;
  isSuperAdmin: boolean;
  isClinicStaff: boolean;
  needsClinicContext: boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));
  const [selectedClinicId, setSelectedClinicIdState] = useState<number | null>(() => {
    const v = localStorage.getItem('selectedClinicId');
    return v ? Number(v) : null;
  });

  const setSelectedClinicId = useCallback((id: number | null) => {
    setSelectedClinicIdState(id);
    if (id) localStorage.setItem('selectedClinicId', String(id));
    else localStorage.removeItem('selectedClinicId');
  }, []);

  const persist = useCallback((t: string, u: User, refresh: string) => {
    localStorage.setItem('token', t);
    localStorage.setItem('refreshToken', refresh);
    localStorage.setItem('user', JSON.stringify(u));
    setToken(t);
    setUser(u);
    if (u.clinicId) setSelectedClinicId(u.clinicId);
  }, [setSelectedClinicId]);

  const login = useCallback(
    async (payload: {
      username: string;
      password: string;
      clinicCode?: string;
      clinicId?: number;
    }) => {
      const res = await authApi.login(payload);
      persist(res.token, res.user, res.refreshToken);
    },
    [persist],
  );

  const logout = useCallback(async () => {
    try {
      if (token) await authApi.logout();
    } finally {
      localStorage.clear();
      setToken(null);
      setUser(null);
      setSelectedClinicIdState(null);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((u) => {
        setUser(u);
        localStorage.setItem('user', JSON.stringify(u));
        if (u.clinicId && !selectedClinicId) setSelectedClinicId(u.clinicId);
      })
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, []);

  const isSuperAdmin = user?.role === UserRole.SuperAdmin;
  const isClinicStaff = user != null && !isSuperAdmin;
  const needsClinicContext = isSuperAdmin && !selectedClinicId && !user?.clinicId;

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      selectedClinicId,
      login,
      logout,
      setSelectedClinicId,
      isSuperAdmin,
      isClinicStaff,
      needsClinicContext,
    }),
    [
      user,
      token,
      loading,
      selectedClinicId,
      login,
      logout,
      setSelectedClinicId,
      isSuperAdmin,
      isClinicStaff,
      needsClinicContext,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
