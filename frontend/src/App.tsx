import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppLayout from './components/layout/AppLayout';
import { AdminRoute, PublicOnlyRoute, ResidentRoute, ProtectedRoute } from './components/layout/RouteGuards';
import LoadingSpinner from './components/ui/LoadingSpinner';
import ErrorBoundary from './components/ui/ErrorBoundary';

// Auth pages — lazy loaded
const Login = React.lazy(() => import('./pages/auth/Login'));
const Register = React.lazy(() => import('./pages/auth/Register'));
const AcceptInvite = React.lazy(() => import('./pages/auth/AcceptInvite'));
const ForgotPassword = React.lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/auth/ResetPassword'));

// Admin pages — lazy loaded
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const CondominiumPage = React.lazy(() => import('./pages/admin/CondominiumPage'));
const UnitsPage = React.lazy(() => import('./pages/admin/UnitsPage'));
const ResidentsPage = React.lazy(() => import('./pages/admin/ResidentsPage'));
const ChargesPage = React.lazy(() => import('./pages/admin/ChargesPage'));
const AnnouncementsPage = React.lazy(() => import('./pages/admin/AnnouncementsPage'));
const IssuesPage = React.lazy(() => import('./pages/admin/IssuesPage'));
const ReservationsPage = React.lazy(() => import('./pages/admin/ReservationsPage'));
const PackagesPage = React.lazy(() => import('./pages/admin/PackagesPage'));

// Shared — lazy loaded
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));

// Resident pages — lazy loaded
const ResidentDashboard = React.lazy(() => import('./pages/resident/ResidentDashboard'));
const MyCharges = React.lazy(() => import('./pages/resident/MyCharges'));
const ResidentAnnouncements = React.lazy(() => import('./pages/resident/ResidentAnnouncements'));
const MyIssues = React.lazy(() => import('./pages/resident/MyIssues'));
const MyReservations = React.lazy(() => import('./pages/resident/MyReservations'));
const MyPackages = React.lazy(() => import('./pages/resident/MyPackages'));

// Public pages — lazy loaded
const LandingPage = React.lazy(() => import('./pages/public/LandingPage'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

const HomeRedirect: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner text="Carregando..." />;
  if (!user) return <Navigate to="/" replace />;
  return <Navigate to={user.role === 'admin' ? '/dashboard' : '/morador'} replace />;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <Toaster position="top-right" toastOptions={{
            duration: 3000,
            style: { background: '#1E293B', color: '#F8FAFC', fontSize: '14px', borderRadius: '10px' },
          }} />
          <Suspense fallback={<LoadingSpinner text="Carregando..." />}>
            <Routes>
              {/* Landing */}
              <Route path="/" element={<LandingPage />} />

              {/* Auth */}
              <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
              <Route path="/cadastro" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
              <Route path="/convite/:token" element={<PublicOnlyRoute><AcceptInvite /></PublicOnlyRoute>} />
              <Route path="/esqueci-senha" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />
              <Route path="/redefinir-senha" element={<PublicOnlyRoute><ResetPassword /></PublicOnlyRoute>} />

              {/* Admin routes */}
              <Route element={<AdminRoute><AppLayout /></AdminRoute>}>
                <Route path="/dashboard" element={<AdminDashboard />} />
                <Route path="/condominio" element={<CondominiumPage />} />
                <Route path="/unidades" element={<UnitsPage />} />
                <Route path="/moradores" element={<ResidentsPage />} />
                <Route path="/cobrancas" element={<ChargesPage />} />
                <Route path="/comunicados" element={<AnnouncementsPage />} />
                <Route path="/encomendas" element={<PackagesPage />} />
                <Route path="/ocorrencias" element={<IssuesPage />} />
                <Route path="/reservas" element={<ReservationsPage />} />
              </Route>

              {/* Resident routes */}
              <Route element={<ResidentRoute><AppLayout /></ResidentRoute>}>
                <Route path="/morador" element={<ResidentDashboard />} />
                <Route path="/morador/cobrancas" element={<MyCharges />} />
                <Route path="/morador/comunicados" element={<ResidentAnnouncements />} />
                <Route path="/morador/encomendas" element={<MyPackages />} />
                <Route path="/morador/ocorrencias" element={<MyIssues />} />
                <Route path="/morador/reservas" element={<MyReservations />} />
              </Route>

              {/* Authenticated default */}
              <Route path="/app" element={<HomeRedirect />} />

              {/* Shared routes */}
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/perfil" element={<ProfilePage />} />
              </Route>

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default App;
