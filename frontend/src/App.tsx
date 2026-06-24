import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DemoProvider } from './contexts/DemoContext';
import AppLayout from './components/layout/AppLayout';
import { AdminRoute, PublicOnlyRoute, ResidentRoute, ProtectedRoute, ConciergeRoute, FinanceRoute, StaffRoute, FinancialRoute } from './components/layout/RouteGuards';
import LoadingSpinner from './components/ui/LoadingSpinner';
import ErrorBoundary from './components/ui/ErrorBoundary';

// Auth pages — lazy loaded
const Login = React.lazy(() => import('./pages/auth/Login'));
const Register = React.lazy(() => import('./pages/auth/Register'));
const AcceptInvite = React.lazy(() => import('./pages/auth/AcceptInvite'));
const AcceptStaffInvite = React.lazy(() => import('./pages/auth/AcceptStaffInvite'));
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
const ExpensesPage = React.lazy(() => import('./pages/admin/ExpensesPage'));
const CashflowPage = React.lazy(() => import('./pages/admin/CashflowPage'));
const ReportsPage = React.lazy(() => import('./pages/admin/ReportsPage'));
const FinancialDashboard = React.lazy(() => import('./pages/admin/FinancialDashboard'));
const ConciergeDashboard = React.lazy(() => import('./pages/admin/ConciergeDashboard'));

// Shared — lazy loaded
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));

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
const BillingSuccess = React.lazy(() => import('./pages/billing/BillingSuccess'));
const BillingPending = React.lazy(() => import('./pages/billing/BillingPending'));
const BillingFailure = React.lazy(() => import('./pages/billing/BillingFailure'));
const BillingPage = React.lazy(() => import('./pages/billing/BillingPage'));

const HomeRedirect: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner text="Carregando..." />;
  if (!user) return <Navigate to="/" replace />;
  if (user.role === 'concierge') return <Navigate to="/portaria" replace />;
  if (user.role === 'financial') return <Navigate to="/financeiro" replace />;
  if (user.role === 'resident') return <Navigate to="/morador/comunicados" replace />;
  return <Navigate to="/dashboard" replace />;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <DemoProvider>
          <Toaster position="top-right" toastOptions={{
            duration: 3000,
            style: { background: '#1E293B', color: '#F8FAFC', fontSize: '14px', borderRadius: '10px' },
          }} />
          <Suspense fallback={<LoadingSpinner text="Carregando..." />}>
            <Routes>
              {/* Landing */}
              <Route path="/" element={<LandingPage />} />

              {/* Billing — páginas de retorno do MP (públicas, nunca ativam plano) */}
              <Route path="/billing/success" element={<BillingSuccess />} />
              <Route path="/billing/pending" element={<BillingPending />} />
              <Route path="/billing/failure" element={<BillingFailure />} />

              {/* Auth */}
              <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
              <Route path="/cadastro" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
              <Route path="/convite/:token" element={<PublicOnlyRoute><AcceptInvite /></PublicOnlyRoute>} />
              <Route path="/convite-staff/:token" element={<PublicOnlyRoute><AcceptStaffInvite /></PublicOnlyRoute>} />
              <Route path="/esqueci-senha" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />
              <Route path="/redefinir-senha" element={<PublicOnlyRoute><ResetPassword /></PublicOnlyRoute>} />
              <Route path="/reset-password" element={<PublicOnlyRoute><ResetPassword /></PublicOnlyRoute>} />

              {/* Admin-only routes */}
              <Route element={<AdminRoute><AppLayout /></AdminRoute>}>
                <Route path="/dashboard" element={<AdminDashboard />} />
                <Route path="/condominio" element={<CondominiumPage />} />
                <Route path="/billing" element={<BillingPage />} />
              </Route>

              {/* Staff routes (Admin + Concierge) */}
              <Route element={<StaffRoute><AppLayout /></StaffRoute>}>
                <Route path="/moradores" element={<ResidentsPage />} />
                <Route path="/comunicados" element={<AnnouncementsPage />} />
                <Route path="/reservas" element={<ReservationsPage />} />
                <Route path="/encomendas" element={<PackagesPage />} />
                <Route path="/ocorrencias" element={<IssuesPage />} />
              </Route>

              {/* Finance routes (Admin + Financial role) */}
              <Route element={<FinancialRoute><AppLayout /></FinancialRoute>}>
                <Route path="/financeiro" element={<FinancialDashboard />} />
                <Route path="/unidades" element={<UnitsPage />} />
                <Route path="/cobrancas" element={<ChargesPage />} />
                <Route path="/despesas" element={<ExpensesPage />} />
                <Route path="/caixa" element={<CashflowPage />} />
                <Route path="/relatorios" element={<ReportsPage />} />
              </Route>

              {/* Concierge routes */}
              <Route element={<ConciergeRoute><AppLayout /></ConciergeRoute>}>
                <Route path="/portaria" element={<ConciergeDashboard />} />
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

              {/* Settings — apenas síndico e gestão */}
              <Route element={<AdminRoute><AppLayout /></AdminRoute>}>
                <Route path="/settings" element={<SettingsPage />} />
              </Route>

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          </DemoProvider>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default App;
