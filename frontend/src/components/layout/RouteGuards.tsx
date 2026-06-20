import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';

export const FinancialRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, isAdmin, isFinancial } = useAuth();
  if (loading) return <LoadingSpinner text="Carregando..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin && !isFinancial) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner text="Carregando..." />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner text="Carregando..." />;
  if (user) {
    if (user.role === 'concierge') return <Navigate to="/portaria" replace />;
    return <Navigate to={user.role === 'resident' ? '/morador' : '/dashboard'} replace />;
  }
  return <>{children}</>;
};

export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <LoadingSpinner text="Carregando..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/morador" replace />;
  return <>{children}</>;
};

export const ResidentRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, isResident } = useAuth();
  if (loading) return <LoadingSpinner text="Carregando..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isResident) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

export const ConciergeRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, isConcierge } = useAuth();
  if (loading) return <LoadingSpinner text="Carregando..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isConcierge) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

export const FinanceRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, isAdmin, isFinancial } = useAuth();
  if (loading) return <LoadingSpinner text="Carregando..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin && !isFinancial) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

export const StaffRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, isAdmin, isConcierge } = useAuth();
  if (loading) return <LoadingSpinner text="Carregando..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin && !isConcierge) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};
