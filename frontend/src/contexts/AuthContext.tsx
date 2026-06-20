import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { RegisterData, User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginDemo: () => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  acceptInvite: (token: string, password: string) => Promise<User>;
  logout: () => void;
  updateUser: (user: User) => void;
  isAdmin: boolean;
  isResident: boolean;
  isConcierge: boolean;
  isSubadmin: boolean;
  isDemo: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const { data } = await api.get('/auth/me');
          setUser(data.user);
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    loadUser();
  }, [token]);

  const saveSession = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const login = async (email: string, password: string): Promise<User> => {
    const { data } = await api.post('/auth/login', { email, password });
    saveSession(data.token, data.user);
    return data.user;
  };

  const loginDemo = async (): Promise<User> => {
    const { data } = await api.post('/auth/demo');
    saveSession(data.token, data.user);
    return data.user;
  };

  const register = async (formData: RegisterData): Promise<User> => {
    const { data } = await api.post('/auth/register', formData);
    saveSession(data.token, data.user);
    return data.user;
  };

  const acceptInvite = async (inviteToken: string, password: string): Promise<User> => {
    const { data } = await api.post('/auth/accept-invite', { token: inviteToken, password });
    saveSession(data.token, data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    queryClient.clear();
  };

  const updateUser = (updatedUser: User) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        loginDemo,
        register,
        acceptInvite,
        logout,
        updateUser,
        isAdmin: user?.role === 'admin' || user?.role === 'subadmin',
        isResident: user?.role === 'resident',
        isConcierge: user?.role === 'concierge',
        isSubadmin: user?.role === 'subadmin',
        isDemo: user?.isDemo === true,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
