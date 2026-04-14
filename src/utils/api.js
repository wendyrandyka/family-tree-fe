import axios from 'axios';

export function getToken()        { return localStorage.getItem('ft_token'); }
export function setToken(t)       { localStorage.setItem('ft_token', t); }
export function removeToken()     { localStorage.removeItem('ft_token'); }
export function getStoredUser()   { try { return JSON.parse(localStorage.getItem('ft_user')); } catch { return null; } }
export function setStoredUser(u)  { localStorage.setItem('ft_user', JSON.stringify(u)); }
export function removeStoredUser(){ localStorage.removeItem('ft_user'); }

const withAuth = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });
const handleErr = err => {
  const message = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || err.message || 'Unknown error';
  return Promise.reject(new Error(message));
};

//const BASE = 'http://localhost:3001';
const BASE = import.meta.env.VITE_BACKEND_URL;

export const personApi = {
  getAll:   ()         => axios.get(`${BASE}/persons`).then(r => r.data.data).catch(handleErr),
  getById:  id         => axios.get(`${BASE}/persons/${id}`).then(r => r.data.data).catch(handleErr),
  create:   data       => axios.post(`${BASE}/persons`, data, withAuth()).then(r => r.data.data).catch(handleErr),
  update:   (id, data) => axios.put(`${BASE}/persons/${id}`, data, withAuth()).then(r => r.data.data).catch(handleErr),
  delete:   id         => axios.delete(`${BASE}/persons/${id}`, withAuth()).then(r => r.data).catch(handleErr),
};

export const authApi = {
  login: (username, password) => axios.post(`${BASE}/auth/login`, { username, password }).then(r => r.data).catch(handleErr),
  me:    ()                   => axios.get(`${BASE}/auth/me`, withAuth()).then(r => r.data.user).catch(handleErr),
};

export const userApi = {
  getAll:  ()         => axios.get(`${BASE}/users`, withAuth()).then(r => r.data.data).catch(handleErr),
  create:  data       => axios.post(`${BASE}/users`, data, withAuth()).then(r => r.data.data).catch(handleErr),
  update:  (id, data) => axios.put(`${BASE}/users/${id}`, data, withAuth()).then(r => r.data.data).catch(handleErr),
  remove:  id         => axios.delete(`${BASE}/users/${id}`, withAuth()).then(r => r.data).catch(handleErr),
};

export const logApi = {
  getAll: (params = {}) => axios.get(`${BASE}/logs`, { ...withAuth(), params }).then(r => r.data).catch(handleErr),
};

export default personApi;
