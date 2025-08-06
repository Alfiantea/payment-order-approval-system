import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import backend from '~backend/client';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const getAuthenticatedBackend = () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return backend;
    
    return backend.with({
      auth: () => Promise.resolve({ authorization: `Bearer ${token}` })
    });
  };

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const authBackend = getAuthenticatedBackend();
      const response = await authBackend.auth.me();
      setUser(response);
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('auth_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await backend.auth.login({ email, password });
    localStorage.setItem('auth_token', response.token);
    setUser(response.user);
  };

  const logout = async () => {
    try {
      const authBackend = getAuthenticatedBackend();
      await authBackend.auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      setUser(null);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useBackend() {
  const token = localStorage.getItem('auth_token');
  if (!token) return backend;
  
  return backend.with({
    auth: () => Promise.resolve({ authorization: `Bearer ${token}` })
  });
}
