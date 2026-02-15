import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  register: (data: { email: string; password: string; name: string; phone: string; code: string }) => Promise<void>;
  sendSignupOtp: (phone: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginAdmin: (email: string, password: string) => Promise<void>;
  registerAdmin: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await api.getMe();
          setUser(response.user);
        }
      } catch (error) {
        // Token invalid or expired
        api.setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const sendSignupOtp = async (phone: string) => {
    await api.sendSignupOtp(phone);
  };

  const register = async (data: { email: string; password: string; name: string; phone: string; code: string }) => {
    try {
      const response = await api.register(data);
      setUser(response.user);
      toast({
        title: 'Registration successful',
        description: 'Your account has been created!',
      });
    } catch (error: any) {
      toast({
        title: 'Registration failed',
        description: error.message || 'Failed to create account',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login({ email, password });
      setUser(response.user);
      toast({
        title: 'Login successful',
        description: `Welcome back, ${response.user.name || response.user.email}!`,
      });
    } catch (error: any) {
      toast({
        title: 'Login failed',
        description: error.message || 'Invalid email or password',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const registerAdmin = async (email: string, password: string, name?: string) => {
    try {
      const response = await api.registerAdmin({ email, password, name });
      setUser(response.user);
      toast({
        title: 'Admin account created',
        description: 'Your admin account has been created!',
      });
    } catch (error: any) {
      toast({
        title: 'Registration failed',
        description: error.message || 'Failed to create admin account',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const loginAdmin = async (email: string, password: string) => {
    try {
      const response = await api.loginAdmin({ email, password });
      setUser(response.user);
      toast({
        title: 'Admin login successful',
        description: `Welcome back, ${response.user.name || response.user.email}!`,
      });
    } catch (error: any) {
      toast({
        title: 'Login failed',
        description: error.message || 'Invalid email or password',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const logout = () => {
    api.setToken(null);
    setUser(null);
    toast({
      title: 'Logged out',
      description: 'You have been logged out successfully',
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        register,
        sendSignupOtp,
        login,
        loginAdmin,
        registerAdmin,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

