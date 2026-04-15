import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { calcAge } from '../utils/treeLayout';

//const BACKEND = 'http://localhost:3001';

const BACKEND = import.meta.env.VITE_BACKEND_URL;

export default function PersonNode({ data, selected }) {
  const { person, onSelect } = data;
  const isMale   = person.gender === 'male';
  const isDead   = !!person.date_of_death;
  const age      = calcAge(person.date_of_birth, person.date_of_death);
  const initials = person.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const photoSrc = person.photo_url
    ? (person.photo_url.startsWith('http') ? person.photo_url : `${BACKEND}${person.photo_url}`)
    : null;

  const borderColor  = isDead   ? '#9ca3af'
                     : isMale   ? '#60a5fa'
                     :            '#f472b6';
  const avatarBg     = isDead   ? '#9ca3af'
                     : isMale   ? '#3b82f6'
                     :            '#ec4899';
  const headerBg     = isDead   ? '#f3f4f6'
                     : isMale   ? '#eff6ff'
                     :            '#fdf2f8';

  return (
    <div
      onClick={() => onSelect && onSelect(person)}
      className="family-node cursor-pointer rounded-xl overflow-hidden shadow-md"
      style={{
        width: 172,
        border: `2px solid ${selected ? '#f59e0b' : borderColor}`,
        background: '#fff',
        boxShadow: selected
          ? '0 0 0 3px rgba(245,158,11,0.35), 0 6px 20px rgba(0,0,0,0.15)'
          : '0 2px 10px rgba(0,0,0,0.1)',
        opacity: isDead ? 0.82 : 1,
        transition: 'box-shadow .15s, transform .15s',
      }}
    >
      {/* Handles */}
      <Handle type="target" position={Position.Top} id="top"
        style={{ width: 10, height: 10, border: '2px solid #d1d5db', background: '#fff', top: -5 }} />
      <Handle type="source" position={Position.Bottom} id="bottom"
        style={{ width: 10, height: 10, border: '2px solid #d1d5db', background: '#fff', bottom: -5 }} />
      <Handle type="source" position={Position.Right} id="right"
        style={{ width: 10, height: 10, border: '2px solid #fbbf24', background: '#fff', right: -5 }} />
      <Handle type="target" position={Position.Left} id="left"
        style={{ width: 10, height: 10, border: '2px solid #fbbf24', background: '#fff', left: -5 }} />

      {/* Header */}
      <div style={{ background: headerBg, padding: '10px 10px 8px' }}
           className="flex items-center gap-2">
        {/* Avatar / Photo */}
        <div style={{
          width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
          background: avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `2px solid ${borderColor}`,
        }}>
          {photoSrc
            ? <img src={photoSrc} alt={person.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'Playfair Display, serif' }}>{initials}</span>
          }
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 12, fontWeight: 600, color: '#1f2937', fontFamily: 'DM Sans, sans-serif',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2,
          }}>{person.name}</p>
          <span style={{
            fontSize: 10, fontWeight: 500, fontFamily: 'DM Sans, sans-serif',
            color: isMale ? '#2563eb' : '#db2777',
            background: isMale ? '#dbeafe' : '#fce7f3',
            borderRadius: 10, padding: '1px 6px', display: 'inline-block', marginTop: 2,
          }}>
            {isMale ? '♂ L' : '♀ P'}
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '6px 10px 8px', background: '#fff' }}>
        {age !== null && (
          <p style={{ fontSize: 11, color: '#6b7280', fontFamily: 'DM Sans, sans-serif', marginBottom: 2 }}>
            {isDead ? '†' : ''} <span style={{ fontWeight: 600, color: '#374151' }}>{age}</span> tahun
            {isDead && <span style={{ fontSize: 10, color: '#9ca3af' }}> (wafat)</span>}
          </p>
        )}
        {person.spouse_name && (
          <p style={{ fontSize: 10, color: '#d97706', fontFamily: 'DM Sans, sans-serif',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            ♥ {person.spouse_name}
          </p>
        )}
        {!person.spouse_name && !age && (
          <p style={{ fontSize: 10, color: '#d1d5db', fontFamily: 'DM Sans, sans-serif', fontStyle: 'italic' }}>
            Tidak ada info
          </p>
        )}
      </div>

      {/* Dead ribbon */}
      {isDead && (
        <div style={{ background: '#6b7280', height: 3 }} />
      )}
    </div>
  );
}
