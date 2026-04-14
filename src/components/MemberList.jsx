import React, { useState } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { calcAge } from '../utils/treeLayout';

export default function MemberList({ persons, selectedId, onSelect }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = persons.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchGender = filter === 'all' || p.gender === filter;
    return matchSearch && matchGender;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="px-3 py-3 border-b border-parchment-200">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari anggota..."
            className="form-input pl-8 py-1.5 text-xs"
          />
        </div>
        {/* Filter tabs */}
        <div className="flex gap-1 mt-2">
          {[
            { val: 'all', label: 'Semua' },
            { val: 'male', label: '♂ L' },
            { val: 'female', label: '♀ P' },
          ].map(({ val, label }) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`flex-1 text-xs py-1 rounded-md font-body font-medium transition-colors
                ${filter === val
                  ? 'bg-forest-600 text-white'
                  : 'bg-parchment-100 text-ink-500 hover:bg-parchment-200'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-ink-400 text-xs font-body">
            {search ? 'Tidak ditemukan' : 'Belum ada anggota'}
          </div>
        ) : (
          filtered.map((p) => {
            const age = calcAge(p.date_of_birth);
            const isSelected = selectedId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onSelect(p)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 border-b border-parchment-100
                  text-left transition-colors group
                  ${isSelected ? 'bg-forest-50 border-l-2 border-l-forest-500' : 'hover:bg-parchment-50'}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0
                  ${p.gender === 'male' ? 'bg-sky-400' : 'bg-rose-400'}`}>
                  {p.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold font-body truncate
                    ${isSelected ? 'text-forest-700' : 'text-ink-700'}`}>
                    {p.name}
                  </p>
                  <p className="text-[10px] text-ink-400 font-body">
                    {p.gender === 'male' ? 'Laki-laki' : 'Perempuan'}
                    {age !== null ? ` · ${age} thn` : ''}
                  </p>
                </div>

                <ChevronRight size={12} className={`shrink-0 transition-colors
                  ${isSelected ? 'text-forest-500' : 'text-ink-300 group-hover:text-ink-500'}`} />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
