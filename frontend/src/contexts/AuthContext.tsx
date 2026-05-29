import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { laravelApi, getStoredUser, type User } from '../lib/laravelApi';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    password_confirmation: string;
    first_name?: string;
    last_name?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      // First try to get stored user for instant load
      const storedUser = getStoredUser();
      if (storedUser) {
        setUser(storedUser);
      }
      // Then verify with server
      const userData = await laravelApi.getMe();
      if (userData) {
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.log('Auth check failed:', err);
      // Clear stored auth state on any failure to avoid stale sessions
      localStorage.removeItem('laravel_user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const storedUser = getStoredUser();

  const login = async (email: string, password: string): Promise<void> => {
    setError(null);
    try {
      const user = await laravelApi.login(email, password);
      setUser(user);
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Login failed';
      setError(message);
      throw new Error(message);
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    password_confirmation: string;
    first_name?: string;
    last_name?: string;
  }): Promise<void> => {
    setError(null);
    try {
      const newUser = await laravelApi.register(data);
      setUser(newUser);
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Registration failed';
      setError(message);
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await laravelApi.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    refetch: checkAuthStatus,
    isAdmin: user?.role === 'administrator',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
