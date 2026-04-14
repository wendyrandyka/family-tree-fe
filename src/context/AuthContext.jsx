import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, getToken, setToken, removeToken, getStoredUser, setStoredUser, removeStoredUser } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [loading, setLoading] = useState(!!getToken());

  useEffect(() => {
    if (!getToken()) { setLoading(false); return; }
    authApi.me()
      .then(u => { setUser(u); setStoredUser(u); })
      .catch(() => { removeToken(); removeStoredUser(); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username, password) => {
    const res = await authApi.login(username, password);
    setToken(res.token);
    setStoredUser(res.user);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    removeToken(); removeStoredUser(); setUser(null);
  }, []);

  const canEdit   = user && ['superuser','admin','editor'].includes(user.role);
  const canDelete = user && ['superuser','admin'].includes(user.role);
  const canAdmin  = user && ['superuser','admin'].includes(user.role);
  const isSuperuser = user?.role === 'superuser';

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, canEdit, canDelete, canAdmin, isSuperuser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
