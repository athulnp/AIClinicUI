import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PatientsPage } from './pages/PatientsPage';
import { PatientDetailPage } from './pages/PatientDetailPage';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { BillingPage } from './pages/BillingPage';
import { DoctorsPage } from './pages/DoctorsPage';
import { UsersPage } from './pages/UsersPage';
import { ClinicsPage } from './pages/ClinicsPage';
import { ProfilePage } from './pages/ProfilePage';
import { PageLoader, ToastContainer } from './components/ui';

function LoginRoute() {
  const { token, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (token) return <Navigate to="/" replace />;
  return <LoginPage />;
}

export default function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginRoute />} />
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<DashboardPage />} />
              <Route path="/patients" element={<PatientsPage />} />
              <Route path="/patients/:id" element={<PatientDetailPage />} />
              <Route path="/appointments" element={<AppointmentsPage />} />
              <Route path="/doctors" element={<DoctorsPage />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/clinics" element={<ClinicsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <ToastContainer />
      </AuthProvider>
    </NotificationProvider>
  );
}
