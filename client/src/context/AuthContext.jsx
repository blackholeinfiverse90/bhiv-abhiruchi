import React, { createContext, useContext, useState, useEffect } from 'react';
import ApiClient from '../lib/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('auth_token') || null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore user session from JWT token on page load
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const response = await ApiClient.get('/auth/me');
          if (response && response.success && response.user) {
            setUser(response.user);
            if (response.user.role === 'admin') {
              sessionStorage.setItem('is_admin', '1');
            }
          } else {
            logout();
          }
        } catch (error) {
          console.warn('Session restoration failed:', error.message);
          logout();
        }
      }
      setIsLoading(false);
    };

    loadUser();
  }, [token]);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await ApiClient.post('/auth/login', { email, password });
      if (response && response.success && response.token) {
        localStorage.setItem('auth_token', response.token);
        setToken(response.token);
        setUser(response.user);
        if (response.user?.role === 'admin') {
          sessionStorage.setItem('is_admin', '1');
        }
        setIsLoading(false);
        return { success: true, user: response.user };
      }
      setIsLoading(false);
      return { success: false, error: response.error || 'Login failed' };
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const register = async (full_name, email, password) => {
    setIsLoading(true);
    try {
      const response = await ApiClient.post('/auth/register', { full_name, email, password });
      if (response && response.success && response.token) {
        localStorage.setItem('auth_token', response.token);
        setToken(response.token);
        setUser(response.user);
        if (response.user?.role === 'admin') {
          sessionStorage.setItem('is_admin', '1');
        }
        setIsLoading(false);
        return { success: true, user: response.user };
      }
      setIsLoading(false);
      return { success: false, error: response.error || 'Registration failed' };
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: error.message || 'Registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('is_admin');
    setToken(null);
    setUser(null);
    setIsLoading(false);
  };

  const updateUser = (updatedFields) => {
    setUser(prev => prev ? { ...prev, ...updatedFields } : updatedFields);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
