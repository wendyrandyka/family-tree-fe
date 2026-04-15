import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Trash2, UserPlus, User, Upload, Camera } from 'lucide-react';
import axios from 'axios';

//const BACKEND = 'http://localhost:3001';
const BACKEND = import.meta.env.VITE_BACKEND_URL;

const emptyForm = {
  name: '', gender: 'male', date_of_birth: '', date_of_death: '',
  father_id: '', mother_id: '', spouse_id: '', notes: '', photo_url: '',
};

export default function PersonForm({ person, persons, onSave, onDelete, onClose, loading, canEdit = true, canDelete = true }) {
  const [form, setForm]           = useState(emptyForm);
  const [errors, setErrors]       = useState({});
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();
  const isEdit  = !!person;

  useEffect(() => {
    if (person) {
      setForm({
        name:          person.name || '',
        gender:        person.gender || 'male',
        date_of_birth: person.date_of_birth  ? person.date_of_birth.split('T')[0]  : '',
        date_of_death: person.date_of_death  ? person.date_of_death.split('T')[0]  : '',
        father_id:     person.father_id || '',
        mother_id:     person.mother_id || '',
        spouse_id:     person.spouse_id  || '',
        notes:         person.notes || '',
        photo_url:     person.photo_url || '',
      });
      setPhotoPreview(
        person.photo_url
          ? (person.photo_url.startsWith('http') ? person.photo_url : `${BACKEND}${person.photo_url}`)
          : null
      );
    } else {
      setForm(emptyForm);
      setPhotoPreview(null);
    }
    setErrors({});
  }, [person]);

  // Filtered parent/spouse options
  const males   = persons.filter(p => p.gender === 'male'   && (!person || p.id !== person.id));
  const females = persons.filter(p => p.gender === 'female' && (!person || p.id !== person.id));
  const spouseOptions = form.gender === 'male' ? females : males;

  function validate() {
    const e = {};
    if (!form.name.trim())          e.name = 'Nama wajib diisi';
    else if (form.name.trim().length < 2) e.name = 'Minimal 2 karakter';
    if (!form.gender)               e.gender = 'Gender wajib dipilih';
    if (form.date_of_birth && isNaN(new Date(form.date_of_birth).getTime()))
      e.date_of_birth = 'Format tanggal tidak valid';
    if (form.date_of_death && isNaN(new Date(form.date_of_death).getTime()))
      e.date_of_death = 'Format tanggal tidak valid';
    if (form.date_of_birth && form.date_of_death &&
        new Date(form.date_of_death) < new Date(form.date_of_birth))
      e.date_of_death = 'Tanggal wafat tidak boleh sebelum tanggal lahir';
    if (form.father_id && form.mother_id && String(form.father_id) === String(form.mother_id))
      e.mother_id = 'Ayah dan ibu tidak boleh orang yang sama';
    if (form.spouse_id && (String(form.spouse_id) === String(form.father_id) || String(form.spouse_id) === String(form.mother_id)))
      e.spouse_id = 'Pasangan tidak boleh sama dengan orang tua';
    return e;
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }));
    // Reset spouse if gender changed
    if (name === 'gender') setForm(prev => ({ ...prev, gender: value, spouse_id: '' }));
  }

  async function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    // Local preview
    const reader = new FileReader();
    reader.onload = ev => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
    // Upload
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      const token = localStorage.getItem('ft_token');
      const res = await axios.post('http://localhost:3001/persons/upload-photo', fd, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
      });
      setForm(prev => ({ ...prev, photo_url: res.data.url }));
    } catch (err) {
      setErrors(prev => ({ ...prev, photo_url: 'Upload gagal: ' + (err.response?.data?.message || err.message) }));
    } finally {
      setUploading(false);
    }
  }

  function removePhoto() {
    setPhotoPreview(null);
    setForm(prev => ({ ...prev, photo_url: '' }));
    if (fileRef.current) fileRef.current.value = '';
  }

  function handleSubmit(e) {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length > 0) { setErrors(e2); return; }
    onSave({
      name:          form.name.trim(),
      gender:        form.gender,
      date_of_birth: form.date_of_birth || null,
      date_of_death: form.date_of_death || null,
      father_id:     form.father_id  ? parseInt(form.father_id)  : null,
      mother_id:     form.mother_id  ? parseInt(form.mother_id)  : null,
      spouse_id:     form.spouse_id  ? parseInt(form.spouse_id)  : null,
      photo_url:     form.photo_url  || null,
      notes:         form.notes.trim() || null,
    });
  }

  return (
    <div className="flex flex-col h-full bg-parchment-50 animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-parchment-200 bg-white shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isEdit ? 'bg-forest-100' : 'bg-parchment-200'}`}>
            {isEdit ? <User size={16} className="text-forest-600" /> : <UserPlus size={16} className="text-ink-600" />}
          </div>
          <div>
            <h2 className="font-display font-semibold text-ink-800 text-base leading-tight">
              {isEdit ? 'Edit Anggota' : 'Tambah Anggota'}
            </h2>
            {isEdit && <p className="text-[11px] text-ink-400 font-body">ID: #{person.id}</p>}
          </div>
        </div>
        <button onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-400 hover:text-ink-700 hover:bg-parchment-200 transition-colors">
          <X size={15} />
        </button>
      </div>

      {/* Scrollable form body */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

        {/* ── Photo upload ── */}
        <div>
          <label className="form-label">Foto</label>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-xl border-2 border-dashed border-parchment-300 overflow-hidden flex items-center justify-center bg-parchment-100 shrink-0 relative">
              {photoPreview
                ? <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                : <Camera size={22} className="text-parchment-400" />
              }
              {uploading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-forest-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-1.5">
              <button type="button" onClick={() => fileRef.current?.click()}
                className="btn-secondary w-full justify-center text-xs py-1.5">
                <Upload size={13} /> {photoPreview ? 'Ganti Foto' : 'Upload Foto'}
              </button>
              {photoPreview && (
                <button type="button" onClick={removePhoto}
                  className="w-full text-xs text-red-500 hover:text-red-700 font-body transition-colors">
                  Hapus foto
                </button>
              )}
              <p className="text-[10px] text-ink-400">JPG, PNG, WEBP — maks 5MB</p>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
          {errors.photo_url && <p className="text-red-500 text-xs mt-1">{errors.photo_url}</p>}
        </div>

        {/* ── Name ── */}
        <div>
          <label className="form-label">Nama Lengkap *</label>
          <input name="name" value={form.name} onChange={handleChange}
            placeholder="cth. Budi Santoso"
            className={`form-input ${errors.name ? 'border-red-400 focus:ring-red-300' : ''}`} />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        {/* ── Gender ── */}
        <div>
          <label className="form-label">Jenis Kelamin *</label>
          <div className="flex gap-2">
            {[
              { val: 'male',   label: '♂ Laki-laki',  active: 'bg-sky-100 border-sky-400 text-sky-700' },
              { val: 'female', label: '♀ Perempuan',   active: 'bg-rose-100 border-rose-400 text-rose-700' },
            ].map(({ val, label, active }) => (
              <button key={val} type="button"
                onClick={() => { setForm(p => ({ ...p, gender: val, spouse_id: '' })); }}
                className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium font-body transition-all
                  ${form.gender === val ? active : 'border-parchment-300 bg-white text-ink-500 hover:border-parchment-400'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Dates ── */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="form-label">Tgl. Lahir</label>
            <input type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange}
              className={`form-input ${errors.date_of_birth ? 'border-red-400' : ''}`} />
            {errors.date_of_birth && <p className="text-red-500 text-[10px] mt-1">{errors.date_of_birth}</p>}
          </div>
          <div>
            <label className="form-label">Tgl. Wafat</label>
            <input type="date" name="date_of_death" value={form.date_of_death} onChange={handleChange}
              className={`form-input ${errors.date_of_death ? 'border-red-400' : ''}`} />
            {errors.date_of_death && <p className="text-red-500 text-[10px] mt-1">{errors.date_of_death}</p>}
          </div>
        </div>

        {/* ── Relationships ── */}
        <div className="border-t border-parchment-200 pt-3 space-y-3">
          <p className="text-[11px] uppercase tracking-widest text-ink-400 font-body font-medium">Hubungan Keluarga</p>

          {/* Spouse */}
          <div>
            <label className="form-label">
              ♥ Pasangan {form.gender === 'male' ? '(Istri)' : '(Suami)'}
            </label>
            <select name="spouse_id" value={form.spouse_id} onChange={handleChange}
              className={`form-input ${errors.spouse_id ? 'border-red-400' : ''}`}>
              <option value="">— Tidak ada / Belum menikah</option>
              {spouseOptions.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {errors.spouse_id && <p className="text-red-500 text-xs mt-1">{errors.spouse_id}</p>}
          </div>

          {/* Father */}
          <div>
            <label className="form-label">Ayah</label>
            <select name="father_id" value={form.father_id} onChange={handleChange}
              className={`form-input ${errors.father_id ? 'border-red-400' : ''}`}>
              <option value="">— Tidak diketahui</option>
              {males.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {errors.father_id && <p className="text-red-500 text-xs mt-1">{errors.father_id}</p>}
          </div>

          {/* Mother */}
          <div>
            <label className="form-label">Ibu</label>
            <select name="mother_id" value={form.mother_id} onChange={handleChange}
              className={`form-input ${errors.mother_id ? 'border-red-400' : ''}`}>
              <option value="">— Tidak diketahui</option>
              {females.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {errors.mother_id && <p className="text-red-500 text-xs mt-1">{errors.mother_id}</p>}
          </div>
        </div>

        {/* ── Notes ── */}
        <div>
          <label className="form-label">Catatan</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} rows={3}
            placeholder="Informasi tambahan..."
            className="form-input resize-none" />
        </div>

        {/* ── Meta ── */}
        {isEdit && (
          <div className="rounded-lg bg-parchment-100 border border-parchment-200 p-3 text-xs text-ink-500 font-body space-y-1">
            <p><span className="font-medium text-ink-600">Dibuat:</span> {new Date(person.created_at).toLocaleString('id-ID')}</p>
            <p><span className="font-medium text-ink-600">Diperbarui:</span> {new Date(person.updated_at).toLocaleString('id-ID')}</p>
          </div>
        )}
      </form>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-parchment-200 bg-white space-y-2 shrink-0">
        {canEdit && (
          <button onClick={handleSubmit} disabled={loading || uploading}
            className="btn-primary w-full justify-center">
            <Save size={15} />
            {loading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Anggota'}
          </button>
        )}
        {isEdit && canDelete && (
          <button type="button" onClick={() => onDelete(person)} disabled={loading}
            className="btn-danger w-full justify-center">
            <Trash2 size={15} /> Hapus Anggota
          </button>
        )}
        {!canEdit && (
          <div className="text-center text-xs text-ink-400 font-body py-1 bg-parchment-50 rounded-lg border border-parchment-200">
            🔒 Hanya bisa melihat — login sebagai editor untuk mengubah data
          </div>
        )}
        <button type="button" onClick={onClose} className="btn-secondary w-full justify-center">
          Tutup
        </button>
      </div>
    </div>
  );
}
