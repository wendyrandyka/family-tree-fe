import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function DeleteModal({ person, onConfirm, onCancel, loading }) {
  if (!person) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm animate-fade-in"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-slide-up border border-parchment-200">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center text-ink-400 hover:text-ink-700 hover:bg-parchment-100 transition-colors"
        >
          <X size={14} />
        </button>

        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center">
            <AlertTriangle size={28} className="text-red-500" />
          </div>

          <div>
            <h3 className="font-display font-bold text-ink-800 text-lg">Hapus Anggota?</h3>
            <p className="text-ink-500 font-body text-sm mt-1">
              Anda akan menghapus <span className="font-semibold text-ink-700">{person.name}</span>.
              Hubungan dengan anak-anaknya akan dihapus.
              <br />
              <span className="text-red-500 font-medium">Tindakan ini tidak dapat dibatalkan.</span>
            </p>
          </div>

          <div className="flex gap-3 w-full">
            <button
              onClick={onCancel}
              disabled={loading}
              className="btn-secondary flex-1 justify-center"
            >
              Batal
            </button>
            <button
              onClick={() => onConfirm(person.id)}
              disabled={loading}
              className="btn-danger flex-1 justify-center"
            >
              {loading ? 'Menghapus...' : 'Ya, Hapus'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
