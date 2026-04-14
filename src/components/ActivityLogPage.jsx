import React, { useState, useEffect, useCallback } from 'react';
import { X, RefreshCw, ClipboardList, Plus, Pencil, Trash2, Filter } from 'lucide-react';
import { logApi } from '../utils/api';
import { toast } from 'react-hot-toast';

const ACTION_META = {
  CREATE: { label: 'Tambah',  color: 'bg-green-100 text-green-700 border-green-200', icon: <Plus size={11}/> },
  UPDATE: { label: 'Ubah',    color: 'bg-blue-100 text-blue-700 border-blue-200',   icon: <Pencil size={11}/> },
  DELETE: { label: 'Hapus',   color: 'bg-red-100 text-red-600 border-red-200',      icon: <Trash2 size={11}/> },
};

function DetailBlock({ detail, action }) {
  if (!detail) return null;
  if (action === 'UPDATE' && detail.changed && Object.keys(detail.changed).length > 0) {
    return (
      <div className="mt-1 space-y-0.5">
        {Object.entries(detail.changed).map(([k, v]) => (
          <div key={k} className="text-[10px] text-ink-500 font-body">
            <span className="font-medium text-ink-600">{k}:</span>{' '}
            <span className="text-red-400 line-through">{String(v.from ?? '—')}</span>
            {' → '}
            <span className="text-green-600">{String(v.to ?? '—')}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function ActivityLogPage({ onClose }) {
  const [logs,    setLogs]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState({ action: '', limit: 50, offset: 0 });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.action) params.action = filter.action;
      params.limit  = filter.limit;
      params.offset = filter.offset;
      const res = await logApi.getAll(params);
      setLogs(res.rows);
      setTotal(res.total);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const totalPages = Math.ceil(total / filter.limit);
  const curPage    = Math.floor(filter.offset / filter.limit) + 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-parchment-200 w-full max-w-3xl mx-4 overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-parchment-200 bg-parchment-50 shrink-0">
          <div className="flex items-center gap-2">
            <ClipboardList size={18} className="text-forest-600"/>
            <h2 className="font-display font-bold text-ink-800 text-lg">Log Aktivitas</h2>
            <span className="text-xs text-ink-400 font-body bg-parchment-100 px-2 py-0.5 rounded-full">{total} entri</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchLogs} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-500 hover:bg-parchment-100">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''}/>
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-400 hover:text-ink-700 hover:bg-parchment-100">
              <X size={16}/>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b border-parchment-100 bg-white shrink-0 flex items-center gap-3">
          <Filter size={13} className="text-ink-400"/>
          <span className="text-xs text-ink-500 font-body">Filter:</span>
          {['', 'CREATE', 'UPDATE', 'DELETE'].map(a => (
            <button key={a}
              onClick={() => setFilter(f => ({...f, action: a, offset: 0}))}
              className={`text-xs px-3 py-1 rounded-full border font-body transition-colors ${
                filter.action === a
                  ? 'bg-forest-600 text-white border-forest-600'
                  : 'border-parchment-300 text-ink-500 hover:bg-parchment-100'
              }`}>
              {a === '' ? 'Semua' : ACTION_META[a]?.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-ink-400 font-body text-sm">
              <RefreshCw size={16} className="animate-spin mr-2"/> Memuat log...
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-ink-400 font-body text-sm">
              <ClipboardList size={32} className="mb-3 text-parchment-300"/>
              Belum ada aktivitas tercatat
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-parchment-50 border-b border-parchment-200 sticky top-0">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-medium text-ink-500 font-body w-36">Waktu</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-ink-500 font-body w-24">User</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-ink-500 font-body w-20">Aksi</th>
                  <th className="text-left px-3 py-3 text-xs font-medium text-ink-500 font-body">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-parchment-100">
                {logs.map(log => {
                  const meta = ACTION_META[log.action] || {};
                  const dt   = new Date(log.created_at);
                  return (
                    <tr key={log.id} className="hover:bg-parchment-50/60 transition-colors">
                      <td className="px-5 py-3 font-body text-ink-500 text-xs whitespace-nowrap">
                        <div>{dt.toLocaleDateString('id-ID', {day:'2-digit',month:'short',year:'numeric'})}</div>
                        <div className="text-ink-400">{dt.toLocaleTimeString('id-ID', {hour:'2-digit',minute:'2-digit',second:'2-digit'})}</div>
                      </td>
                      <td className="px-3 py-3 font-body">
                        <div className="text-xs font-medium text-ink-700">{log.username || '—'}</div>
                        <div className="text-[10px] text-ink-400 capitalize">{log.role || ''}</div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`flex items-center gap-1 w-fit px-2 py-0.5 rounded-full border text-[11px] font-body ${meta.color}`}>
                          {meta.icon} {meta.label}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-body">
                        <div className="text-xs font-medium text-ink-800">{log.entity_name || `ID #${log.entity_id}`}</div>
                        <DetailBlock detail={log.detail} action={log.action}/>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-parchment-200 bg-parchment-50 shrink-0 flex items-center justify-between">
            <span className="text-xs text-ink-400 font-body">Halaman {curPage} dari {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={curPage <= 1}
                onClick={() => setFilter(f => ({...f, offset: f.offset - f.limit}))}
                className="px-3 py-1 text-xs rounded-lg border border-parchment-300 font-body text-ink-600 disabled:opacity-40 hover:bg-parchment-100">
                ← Sebelumnya
              </button>
              <button disabled={curPage >= totalPages}
                onClick={() => setFilter(f => ({...f, offset: f.offset + f.limit}))}
                className="px-3 py-1 text-xs rounded-lg border border-parchment-300 font-body text-ink-600 disabled:opacity-40 hover:bg-parchment-100">
                Berikutnya →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
