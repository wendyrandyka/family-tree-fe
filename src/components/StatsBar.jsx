import React from 'react';
import { Users, UserCheck, Baby, GitBranch } from 'lucide-react';

export default function StatsBar({ persons }) {
  const total = persons.length;
  const males = persons.filter((p) => p.gender === 'male').length;
  const females = persons.filter((p) => p.gender === 'female').length;
  const withParents = persons.filter((p) => p.father_id || p.mother_id).length;

  const stats = [
    { icon: <Users size={14} />, label: 'Total', value: total, color: 'text-ink-600' },
    { icon: <UserCheck size={14} />, label: 'Laki-laki', value: males, color: 'text-sky-600' },
    { icon: <UserCheck size={14} />, label: 'Perempuan', value: females, color: 'text-rose-600' },
    { icon: <GitBranch size={14} />, label: 'Terhubung', value: withParents, color: 'text-forest-600' },
  ];

  return (
    <div className="flex items-center gap-4">
      {stats.map(({ icon, label, value, color }) => (
        <div key={label} className="flex items-center gap-1.5">
          <span className={`${color} opacity-70`}>{icon}</span>
          <span className="text-xs text-ink-500 font-body">{label}:</span>
          <span className={`text-xs font-semibold font-body ${color}`}>{value}</span>
        </div>
      ))}
    </div>
  );
}
