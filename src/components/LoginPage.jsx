import React, { useState } from 'react';
import { TreePine, LogIn, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

export default function LoginPage({ onClose }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show,     setShow]     = useState(false);
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(username.trim(), password);
      toast.success(`Selamat datang, ${u.username}!`);
      onClose && onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-parchment-200 w-full max-w-sm mx-4 overflow-hidden animate-slide-in-right">
        {/* Header */}
        <div className="bg-gradient-to-br from-forest-700 to-forest-500 px-8 py-6 text-white text-center">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <TreePine size={28} className="text-white" />
          </div>
          <h2 className="font-display font-bold text-xl">Pohon Keluarga</h2>
          <p className="text-white/70 text-sm mt-1 font-body">Masuk untuk mengelola data</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-600 font-body mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="masukkan username"
              required
              className="w-full px-3 py-2.5 border border-parchment-300 rounded-lg text-sm font-body
                focus:outline-none focus:ring-2 focus:ring-forest-400 focus:border-transparent bg-parchment-50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-600 font-body mb-1">Password</label>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="masukkan password"
                required
                className="w-full px-3 py-2.5 border border-parchment-300 rounded-lg text-sm font-body pr-10
                  focus:outline-none focus:ring-2 focus:ring-forest-400 focus:border-transparent bg-parchment-50"
              />
              <button type="button" onClick={() => setShow(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600">
                {show ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary justify-center py-2.5 mt-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                Masuk...
              </span>
            ) : (
              <span className="flex items-center gap-2"><LogIn size={16}/> Masuk</span>
            )}
          </button>

          <p className="text-center text-xs text-ink-400 font-body">
            Hanya bisa melihat pohon keluarga tanpa login
          </p>
        </form>
      </div>
    </div>
  );
}
