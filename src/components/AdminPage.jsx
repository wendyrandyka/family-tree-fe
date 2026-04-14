import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Pencil, Trash2, ShieldCheck, Shield, Eye, UserCog, RefreshCw, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../utils/api';
import { toast } from 'react-hot-toast';

const ROLE_LABEL = { superuser: 'Superuser', admin: 'Admin', editor: 'Editor', viewer: 'Viewer' };
const ROLE_COLOR = {
  superuser: 'bg-purple-100 text-purple-700 border-purple-200',
  admin:     'bg-blue-100 text-blue-700 border-blue-200',
  editor:    'bg-green-100 text-green-700 border-green-200',
  viewer:    'bg-gray-100 text-gray-600 border-gray-200',
};
const ROLE_ICON = {
  superuser: <ShieldCheck size={12}/>,
  admin:     <Shield size={12}/>,
  editor:    <Pencil size={12}/>,
  viewer:    <Eye size={12}/>,
};

const ROLE_RANK = { viewer: 0, editor: 1, admin: 2, superuser: 3 };

function rolesCanCreate(myRole) {
  return Object.keys(ROLE_RANK).filter(r => ROLE_RANK[r] < ROLE_RANK[myRole]);
}

function UserModal({ user, myRole, onSave, onClose }) {
  const isEdit = !!user;
  const [form, setForm] = useState({
    username: user?.username || '',
    password: '',
    role: user?.role || 'viewer',
    is_active: user?.is_active ?? true,
  });
  const [loading, setLoading] = useState(false);
  const availableRoles = rolesCanCreate(myRole);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { username: form.username, role: form.role, is_active: form.is_active };
      if (form.password) payload.password = form.password;
      if (!isEdit) payload.password = form.password;
      await onSave(payload);
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full px-3 py-2 border border-parchment-300 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-forest-400 bg-parchment-50";

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-parchment-200 w-full max-w-sm mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-parchment-200 bg-parchment-50">
          <h3 className="font-display font-semibold text-ink-800">
            {isEdit ? 'Edit User' : 'Tambah User Baru'}
          </h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-400 hover:text-ink-700 hover:bg-parchment-100">
            <X size={14}/>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Username</label>
            <input className={inputCls} value={form.username} onChange={e => setForm(f=>({...f,username:e.target.value}))}
              required minLength={3} maxLength={64} placeholder="username"/>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">
              Password {isEdit && <span className="text-ink-400">(kosongkan jika tidak diubah)</span>}
            </label>
            <input className={inputCls} type="password" value={form.password}
              onChange={e => setForm(f=>({...f,password:e.target.value}))}
              required={!isEdit} minLength={6} placeholder={isEdit ? '••••••••' : 'min 6 karakter'}/>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Role</label>
            <select className={inputCls} value={form.role} onChange={e => setForm(f=>({...f,role:e.target.value}))}>
              {availableRoles.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
          </div>
          {isEdit && (
            <div className="flex items-center gap-3">
              <input type="checkbox" id="is_active" checked={form.is_active}
                onChange={e => setForm(f=>({...f,is_active:e.target.checked}))}
                className="w-4 h-4 accent-forest-600"/>
              <label htmlFor="is_active" className="text-sm font-body text-ink-700">Akun aktif</label>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-parchment-300 text-sm font-body text-ink-600 hover:bg-parchment-100">
              Batal
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 btn-primary justify-center text-sm">
              {loading ? 'Menyimpan...' : isEdit ? 'Simpan' : 'Tambah'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminPage({ onClose }) {
  const { user: me, isSuperuser } = useAuth();
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]   = useState(null); // null | {mode:'create'} | {mode:'edit', user}
  const [delTarget, setDelTarget] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userApi.getAll();
      setUsers(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function handleSave(payload) {
    if (modal?.mode === 'edit') {
      const updated = await userApi.update(modal.user.id, payload);
      setUsers(us => us.map(u => u.id === updated.id ? updated : u));
      toast.success('User diperbarui');
    } else {
      const created = await userApi.create(payload);
      setUsers(us => [...us, created]);
      toast.success('User ditambahkan');
    }
  }

  async function handleDelete(id) {
    try {
      await userApi.remove(id);
      setUsers(us => us.filter(u => u.id !== id));
      setDelTarget(null);
      toast.success('User dihapus');
    } catch (err) {
      toast.error(err.message);
    }
  }

  const canManageUser = (target) => {
    if (target.role === 'superuser') return false;
    return ROLE_RANK[me.role] > ROLE_RANK[target.role];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-parchment-200 w-full max-w-2xl mx-4 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-parchment-200 bg-parchment-50 shrink-0">
          <div className="flex items-center gap-2">
            <UserCog size={18} className="text-forest-600"/>
            <h2 className="font-display font-bold text-ink-800 text-lg">Manajemen User</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchUsers} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-500 hover:bg-parchment-100">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''}/>
            </button>
            <button onClick={() => setModal({mode:'create'})}
              className="btn-primary text-xs px-3 py-1.5">
              <Plus size={14}/> Tambah User
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:text-ink-700 hover:bg-parchment-100">
              <X size={16}/>
            </button>
          </div>
        </div>

        {/* Role legend */}
        <div className="px-6 py-3 border-b border-parchment-100 bg-white shrink-0">
          <div className="flex flex-wrap gap-2 text-xs">
            {Object.entries(ROLE_LABEL).map(([r,l]) => (
              <span key={r} className={`flex items-center gap-1 px-2 py-0.5 rounded-full border font-body ${ROLE_COLOR[r]}`}>
                {ROLE_ICON[r]} {l}
              </span>
            ))}
            <span className="text-ink-400 text-[11px] self-center ml-1">
              Superuser › Admin › Editor › Viewer
            </span>
          </div>
        </div>

        {/* Permissions info */}
        <div className="px-6 py-2 bg-blue-50 border-b border-blue-100 shrink-0">
          <p className="text-[11px] text-blue-700 font-body">
            <strong>Viewer:</strong> lihat saja &nbsp;|&nbsp;
            <strong>Editor:</strong> tambah & edit data &nbsp;|&nbsp;
            <strong>Admin:</strong> + hapus data & kelola user &nbsp;|&nbsp;
            <strong>Superuser:</strong> akses penuh
          </p>
        </div>

        {/* Table */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-ink-400 font-body text-sm">
              <RefreshCw size={16} className="animate-spin mr-2"/> Memuat data...
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-parchment-50 border-b border-parchment-200 sticky top-0">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-ink-500 font-body">Username</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-500 font-body">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-500 font-body">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-500 font-body">Dibuat</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-parchment-100">
                {users.map(u => (
                  <tr key={u.id} className={`hover:bg-parchment-50 transition-colors ${u.id === me?.id ? 'bg-green-50/50' : ''}`}>
                    <td className="px-6 py-3 font-body text-ink-800 font-medium">
                      {u.username}
                      {u.id === me?.id && <span className="ml-2 text-[10px] text-forest-600 bg-forest-50 px-1.5 py-0.5 rounded-full border border-forest-200">Anda</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 w-fit px-2 py-0.5 rounded-full border text-xs font-body ${ROLE_COLOR[u.role]}`}>
                        {ROLE_ICON[u.role]} {ROLE_LABEL[u.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-body ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {u.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-400 font-body">
                      {new Date(u.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-4 py-3">
                      {canManageUser(u) && (
                        <div className="flex items-center gap-1 justify-end">
                          <button onClick={() => setModal({mode:'edit', user:u})}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-blue-500 hover:bg-blue-50">
                            <Pencil size={13}/>
                          </button>
                          <button onClick={() => setDelTarget(u)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50">
                            <Trash2 size={13}/>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* User form modal */}
      {modal && (
        <UserModal
          user={modal.user}
          myRole={me?.role}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {/* Delete confirm */}
      {delTarget && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl border border-red-200 p-6 max-w-sm mx-4 text-center">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trash2 size={22} className="text-red-400"/>
            </div>
            <h3 className="font-display font-bold text-ink-800 mb-1">Hapus User?</h3>
            <p className="text-sm text-ink-500 font-body mb-4">
              User <strong>{delTarget.username}</strong> akan dihapus permanen.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDelTarget(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-parchment-300 text-sm font-body text-ink-600 hover:bg-parchment-100">
                Batal
              </button>
              <button onClick={() => handleDelete(delTarget.id)}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-body hover:bg-red-600">
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
