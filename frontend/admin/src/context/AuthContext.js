import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('adminToken'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await axios.get('/api/auth/me');
      // Only allow admin users
      if (res.data.role === 'admin') {
        setUser(res.data);
      } else {
        throw new Error('Access denied. Admin only.');
      }
    } catch (error) {
      localStorage.removeItem('adminToken');
      setToken(null);
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      const { token: newToken, user: userData } = res.data;
      
      // Verify user is admin
      if (!userData) {
        return {
          success: false,
          message: 'Login failed: No user data received'
        };
      }
      
      if (userData.role !== 'admin') {
        console.error('Login failed: User role is', userData.role, 'but admin is required');
        return {
          success: false,
          message: `Access denied. This account has role "${userData.role}" but admin role is required. Please contact administrator to upgrade your account.`
        };
      }
      
      localStorage.setItem('adminToken', newToken);
      localStorage.setItem('adminUser', JSON.stringify(userData));
      setToken(newToken);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  const register = async (name, email, password, phone) => {
    try {
      // Force admin role on registration
      const res = await axios.post('/api/auth/register', {
        name,
        email,
        password,
        phone,
        role: 'admin'
      });
      const { token: newToken, user: userData } = res.data;
      
      // Verify user is admin (backend should set role to admin)
      if (userData.role !== 'admin') {
        return {
          success: false,
          message: 'Registration failed. Admin access required.'
        };
      }
      
      localStorage.setItem('adminToken', newToken);
      localStorage.setItem('adminUser', JSON.stringify(userData));
      setToken(newToken);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
















