import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppLayout from './components/layout/AppLayout';
import { AdminRoute, PublicOnlyRoute, ResidentRoute, ProtectedRoute } from './components/layout/RouteGuards';
import LoadingSpinner from './components/ui/LoadingSpinner';
import ErrorBoundary from './components/ui/ErrorBoundary';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AcceptInvite from './pages/auth/AcceptInvite';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import CondominiumPage from './pages/admin/CondominiumPage';
import UnitsPage from './pages/admin/UnitsPage';
import ResidentsPage from './pages/admin/ResidentsPage';
import ChargesPage from './pages/admin/ChargesPage';
import AnnouncementsPage from './pages/admin/AnnouncementsPage';
import IssuesPage from './pages/admin/IssuesPage';
import ReservationsPage from './pages/admin/ReservationsPage';
import PackagesPage from './pages/admin/PackagesPage';

// Shared
import ProfilePage from './pages/ProfilePage';

// Resident pages
import ResidentDashboard from './pages/resident/ResidentDashboard';
import MyCharges from './pages/resident/MyCharges';
import ResidentAnnouncements from './pages/resident/ResidentAnnouncements';
import MyIssues from './pages/resident/MyIssues';
import MyReservations from './pages/resident/MyReservations';
import MyPackages from './pages/resident/MyPackages';

// Public pages
import LandingPage from './pages/public/LandingPage';
import NotFound from './pages/NotFound';

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
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default App;
