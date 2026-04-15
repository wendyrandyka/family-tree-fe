import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { createPortal } from 'react-dom';
import { calcAge } from '../utils/treeLayout';

//const BACKEND = 'http://localhost:3001';
const BACKEND = import.meta.env.VITE_BACKEND_URL;

// ── Cek apakah hari ini ulang tahun ──────────────────────────────
function isBirthdayToday(dateOfBirth) {
  if (!dateOfBirth) return false;
  const today = new Date();
  const dob = new Date(dateOfBirth);
  return (
    dob.getDate() === today.getDate() &&
    dob.getMonth() === today.getMonth()
  );
}

// ── Modal popup foto ─────────────────────────────────────────────
function PhotoModal({ src, name, onClose }) {
  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
          maxWidth: '90vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          animation: 'popIn 0.2s ease',
        }}
      >
        {/* Header modal */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid #f3f4f6',
          background: '#fafafa',
        }}>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 14, color: '#1f2937' }}>
            {name}
          </span>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: '50%',
              border: 'none', background: '#f3f4f6',
              cursor: 'pointer', fontSize: 16, color: '#6b7280',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#e5e7eb'}
            onMouseLeave={e => e.currentTarget.style.background = '#f3f4f6'}
          >
            ✕
          </button>
        </div>

        {/* Foto */}
        <img
          src={src}
          alt={name}
          style={{
            maxWidth: '80vw',
            maxHeight: '75vh',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </div>

      {/* Animasi CSS */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes popIn  { from { transform: scale(0.85); opacity: 0 } to { transform: scale(1); opacity: 1 } }
      `}</style>
    </div>,
    document.body
  );
}

// ── Komponen utama ────────────────────────────────────────────────
export default function PersonNode({ data, selected }) {
  const { person, onSelect } = data;
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const isMale     = person.gender === 'male';
  const isDead     = !!person.date_of_death;
  const isBirthday = !isDead && isBirthdayToday(person.date_of_birth);
  const age        = calcAge(person.date_of_birth, person.date_of_death);
  const initials   = person.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const photoSrc   = person.photo_url
    ? (person.photo_url.startsWith('http') ? person.photo_url : `${BACKEND}${person.photo_url}`)
    : null;

  // Warna berdasarkan status
  const borderColor = isBirthday ? '#f59e0b'
                    : isDead     ? '#9ca3af'
                    : isMale     ? '#60a5fa'
                    :              '#f472b6';
  const avatarBg    = isDead     ? '#9ca3af'
                    : isMale     ? '#3b82f6'
                    :              '#ec4899';
  const headerBg    = isBirthday ? '#fffbeb'
                    : isDead     ? '#f3f4f6'
                    : isMale     ? '#eff6ff'
                    :              '#fdf2f8';

  return (
    <>
      <div
        onClick={() => onSelect && onSelect(person)}
        className="family-node cursor-pointer rounded-xl overflow-hidden shadow-md"
        style={{
          width: 172,
          border: `2px solid ${selected ? '#f59e0b' : borderColor}`,
          background: '#fff',
          boxShadow: isBirthday
            ? '0 0 0 3px rgba(251,191,36,0.4), 0 6px 20px rgba(0,0,0,0.15)'
            : selected
              ? '0 0 0 3px rgba(245,158,11,0.35), 0 6px 20px rgba(0,0,0,0.15)'
              : '0 2px 10px rgba(0,0,0,0.1)',
          opacity: isDead ? 0.82 : 1,
          transition: 'box-shadow .15s, transform .15s',
          position: 'relative',
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

        {/* Badge ulang tahun */}
        {isBirthday && (
          <div style={{
            position: 'absolute', top: -10, right: -10, zIndex: 10,
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            borderRadius: '50%',
            width: 28, height: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15,
            boxShadow: '0 2px 8px rgba(245,158,11,0.5)',
            border: '2px solid #fff',
            animation: 'birthdayPulse 1.5s ease-in-out infinite',
          }}>
            🎂
          </div>
        )}

        {/* Header */}
        <div style={{ background: headerBg, padding: '10px 10px 8px' }}
             className="flex items-center gap-2">

          {/* Avatar / Foto — klik untuk popup */}
          <div
            onClick={(e) => {
              if (photoSrc) {
                e.stopPropagation(); // jangan trigger onSelect
                setShowPhotoModal(true);
              }
            }}
            title={photoSrc ? 'Klik untuk memperbesar foto' : undefined}
            style={{
              width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
              background: avatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `2px solid ${isBirthday ? '#f59e0b' : borderColor}`,
              cursor: photoSrc ? 'zoom-in' : 'default',
              transition: 'transform 0.15s, box-shadow 0.15s',
              boxShadow: photoSrc ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
            }}
            onMouseEnter={e => { if (photoSrc) e.currentTarget.style.transform = 'scale(1.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
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

            {isBirthday ? (
              <span style={{
                fontSize: 10, fontWeight: 600, fontFamily: 'DM Sans, sans-serif',
                color: '#92400e',
                background: 'linear-gradient(90deg, #fef3c7, #fde68a)',
                borderRadius: 10, padding: '1px 6px', display: 'inline-block', marginTop: 2,
                border: '1px solid #fbbf24',
              }}>
                🎉 Ulang Tahun!
              </span>
            ) : (
              <span style={{
                fontSize: 10, fontWeight: 500, fontFamily: 'DM Sans, sans-serif',
                color: isMale ? '#2563eb' : '#db2777',
                background: isMale ? '#dbeafe' : '#fce7f3',
                borderRadius: 10, padding: '1px 6px', display: 'inline-block', marginTop: 2,
              }}>
                {isMale ? '♂ L' : '♀ P'}
              </span>
            )}
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

        {/* Strip bawah — ulang tahun atau wafat */}
        {isBirthday && (
          <div style={{
            background: 'linear-gradient(90deg, #fbbf24, #f59e0b, #fbbf24)',
            backgroundSize: '200% 100%',
            height: 3,
            animation: 'shimmer 2s linear infinite',
          }} />
        )}
        {isDead && !isBirthday && (
          <div style={{ background: '#6b7280', height: 3 }} />
        )}
      </div>

      {/* Modal popup foto */}
      {showPhotoModal && photoSrc && (
        <PhotoModal
          src={photoSrc}
          name={person.name}
          onClose={() => setShowPhotoModal(false)}
        />
      )}

      {/* Animasi CSS */}
      <style>{`
        @keyframes birthdayPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 2px 8px rgba(245,158,11,0.5); }
          50%       { transform: scale(1.15); box-shadow: 0 4px 16px rgba(245,158,11,0.7); }
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </>
  );
}
