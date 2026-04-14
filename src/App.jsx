import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Panel,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Toaster, toast } from 'react-hot-toast';
import { Plus, TreePine, RefreshCw, X, List, LogIn, LogOut, UserCog, ClipboardList, Download, FileSpreadsheet, Image } from 'lucide-react';

import PersonNode from './components/PersonNode';
import PersonForm from './components/PersonForm';
import DeleteModal from './components/DeleteModal';
import StatsBar from './components/StatsBar';
import MemberList from './components/MemberList';
import LoginPage from './components/LoginPage';
import AdminPage from './components/AdminPage';
import ActivityLogPage from './components/ActivityLogPage';
import { personApi } from './utils/api';
import { buildTree } from './utils/treeLayout';
import { useAuth } from './context/AuthContext';

const nodeTypes = { personNode: PersonNode };

function AppInner() {
  const { user, logout, canEdit, canDelete, canAdmin, isSuperuser } = useAuth();
  const { getNodes, getEdges, toObject } = useReactFlow();
  const reactFlowRef = useRef(null);
  const [showLogin,   setShowLogin]   = useState(false);
  const [showAdmin,   setShowAdmin]   = useState(false);
  const [showLogs,    setShowLogs]    = useState(false);
  const [exporting,   setExporting]   = useState(false);
  const [persons, setPersons] = useState([]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [selectedPerson, setSelectedPerson] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [sidebarMode, setSidebarMode] = useState(null); // null | 'form' | 'list'
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all persons
  const fetchPersons = useCallback(async () => {
    setFetching(true);
    setError(null);
    try {
      const data = await personApi.getAll();
      setPersons(data);
    } catch (err) {
      setError(err.message);
      toast.error('Gagal memuat data: ' + err.message);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => { fetchPersons(); }, [fetchPersons]);

  // Rebuild tree whenever persons change
  useEffect(() => {
    const { nodes: n, edges: e } = buildTree(persons);

    // Attach click handler to each node
    const nodesWithHandler = n.map((node) => ({
      ...node,
      data: {
        ...node.data,
        onSelect: (person) => {
          setSelectedPerson(person);
          setSidebarMode('form');
        },
      },
    }));

    setNodes(nodesWithHandler);
    setEdges(e);
  }, [persons]);

  // Open add form
  function handleAddNew() {
    setSelectedPerson(null);
    setSidebarMode('form');
  }

  // Save (create or update)
  async function handleSave(payload) {
    setLoading(true);
    try {
      if (selectedPerson) {
        const updated = await personApi.update(selectedPerson.id, payload);
        setPersons((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        toast.success(`${updated.name} berhasil diperbarui!`);
        setSelectedPerson(updated);
      } else {
        const created = await personApi.create(payload);
        setPersons((prev) => [...prev, created]);
        toast.success(`${created.name} berhasil ditambahkan!`);
        setSidebarMode(null);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Confirm delete
  async function handleDeleteConfirm(id) {
    setLoading(true);
    try {
      await personApi.delete(id);
      setPersons((prev) => prev.filter((p) => p.id !== id));
      toast.success('Anggota berhasil dihapus');
      setDeleteTarget(null);
      setSidebarMode(null);
      setSelectedPerson(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleCloseSidebar() {
    setSidebarMode(null);
    setSelectedPerson(null);
  }

  // Select from list
  function handleSelectFromList(person) {
    setSelectedPerson(person);
    setSidebarMode('form');
  }

  // ── Export PNG ──────────────────────────────────────────────────
  async function handleExportPNG() {
    setExporting(true);
    toast.loading('Menyiapkan gambar...', { id: 'export' });
    try {
      // Dynamic import to keep bundle lean
      const { toPng } = await import('html-to-image');
      const flowEl = document.querySelector('.react-flow__viewport');
      if (!flowEl) throw new Error('Canvas tidak ditemukan');

      // Get bounding box of all nodes to know actual content size
      const nodeEls = document.querySelectorAll('.react-flow__node');
      if (nodeEls.length === 0) throw new Error('Tidak ada data untuk diekspor');

      const img = await toPng(document.querySelector('.react-flow'), {
        backgroundColor: '#fdf8f0',
        pixelRatio: 2,
        filter: (node) => {
          // exclude controls, minimap, panels from screenshot
          if (node.classList) {
            if (node.classList.contains('react-flow__controls')) return false;
            if (node.classList.contains('react-flow__minimap'))  return false;
            if (node.classList.contains('react-flow__panel'))    return false;
          }
          return true;
        },
      });
      const link = document.createElement('a');
      link.download = `pohon-keluarga-${new Date().toISOString().slice(0,10)}.png`;
      link.href = img;
      link.click();
      toast.success('Gambar berhasil diunduh!', { id: 'export' });
    } catch (err) {
      toast.error('Gagal ekspor PNG: ' + err.message, { id: 'export' });
    } finally {
      setExporting(false);
    }
  }

  // ── Export Excel ────────────────────────────────────────────────
  async function handleExportExcel() {
    setExporting(true);
    toast.loading('Menyiapkan Excel...', { id: 'export' });
    try {
      const { default: ExcelJS } = await import('exceljs');
      const wb = new ExcelJS.Workbook();
      wb.creator = 'Pohon Keluarga App';
      wb.created = new Date();

      // ── Sheet 1: Data Anggota ──
      const ws = wb.addWorksheet('Data Anggota', { views: [{ state: 'frozen', ySplit: 1 }] });
      ws.columns = [
        { header: 'ID',           key: 'id',           width: 8  },
        { header: 'Nama',         key: 'name',         width: 28 },
        { header: 'Gender',       key: 'gender',       width: 12 },
        { header: 'Tanggal Lahir',key: 'dob',          width: 18 },
        { header: 'Tanggal Wafat',key: 'dod',          width: 18 },
        { header: 'Ayah',         key: 'father',       width: 25 },
        { header: 'Ibu',          key: 'mother',       width: 25 },
        { header: 'Pasangan',     key: 'spouse',       width: 25 },
        { header: 'Catatan',      key: 'notes',        width: 40 },
      ];

      // Style header row
      ws.getRow(1).eachCell(cell => {
        cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D6A2D' } };
        cell.font   = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        cell.border = { bottom: { style: 'thin', color: { argb: 'FF1a4d1a' } } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
      ws.getRow(1).height = 28;

      const fmt = (d) => d ? new Date(d).toLocaleDateString('id-ID', {day:'2-digit',month:'long',year:'numeric'}) : '';
      persons.forEach((p, i) => {
        const row = ws.addRow({
          id:     p.id,
          name:   p.name,
          gender: p.gender === 'male' ? 'Laki-laki' : 'Perempuan',
          dob:    fmt(p.date_of_birth),
          dod:    fmt(p.date_of_death),
          father: p.father_name || '',
          mother: p.mother_name || '',
          spouse: p.spouse_name || '',
          notes:  p.notes || '',
        });
        const fill = i % 2 === 0
          ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
          : { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5FAF5' } };
        row.eachCell(cell => {
          cell.fill = fill;
          cell.alignment = { vertical: 'middle', wrapText: true };
          cell.font = { size: 10 };
        });
        row.height = 20;
      });

      // ── Sheet 2: Statistik ──
      const ws2 = wb.addWorksheet('Statistik');
      const male   = persons.filter(p => p.gender === 'male').length;
      const female = persons.filter(p => p.gender === 'female').length;
      const dead   = persons.filter(p => p.date_of_death).length;
      const married= persons.filter(p => p.spouse_id).length;

      ws2.getColumn(1).width = 30;
      ws2.getColumn(2).width = 20;

      [['Statistik Pohon Keluarga', ''], ['', ''],
       ['Total Anggota',    persons.length],
       ['Laki-laki',        male],
       ['Perempuan',        female],
       ['Sudah Menikah',    married / 2],
       ['Telah Wafat',      dead],
       ['Masih Hidup',      persons.length - dead],
       ['', ''],
       ['Diekspor pada', new Date().toLocaleString('id-ID')],
      ].forEach((row, i) => {
        const r = ws2.addRow(row);
        if (i === 0) { r.font = { bold: true, size: 14, color: { argb: 'FF2D6A2D' } }; r.height = 30; }
        else if (i > 1 && i < 9) {
          r.getCell(1).font = { size: 11 };
          r.getCell(2).font = { bold: true, size: 11 };
          r.getCell(2).alignment = { horizontal: 'right' };
        }
      });

      const buf  = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href  = url;
      link.download = `pohon-keluarga-${new Date().toISOString().slice(0,10)}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Excel berhasil diunduh!', { id: 'export' });
    } catch (err) {
      toast.error('Gagal ekspor Excel: ' + err.message, { id: 'export' });
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-parchment-50">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            fontFamily: '"DM Sans", sans-serif',
            fontSize: 13,
            background: '#fdf8f0',
            color: '#241a14',
            border: '1px solid #e8ddb8',
            boxShadow: '0 8px 32px rgba(20,14,10,0.15)',
          },
          success: { iconTheme: { primary: '#2e7d2e', secondary: '#fff' } },
          error: { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
        }}
      />

      {/* Top header */}
      <header className="flex items-center justify-between px-5 py-3 bg-white border-b border-parchment-200 shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-forest-600 flex items-center justify-center shadow-sm">
            <TreePine size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-ink-800 text-lg leading-tight">Pohon Keluarga Ene Elot</h1>
            <p className="text-[11px] text-ink-400 font-body leading-none hidden sm:block">Family Tree Manager</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Stats - hidden on small */}
          <div className="hidden md:flex">
            <StatsBar persons={persons} />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={fetchPersons}
              disabled={fetching}
              title="Refresh"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-500 hover:text-ink-700 hover:bg-parchment-100 transition-colors"
            >
              <RefreshCw size={15} className={fetching ? 'animate-spin' : ''} />
            </button>

            <button
              onClick={() => setSidebarMode(sidebarMode === 'list' ? null : 'list')}
              title="Daftar Anggota"
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors
                ${sidebarMode === 'list' ? 'bg-forest-600 text-white' : 'text-ink-500 hover:text-ink-700 hover:bg-parchment-100'}`}
            >
              <List size={15} />
            </button>

            {canAdmin && (
              <button
                onClick={() => setShowAdmin(true)}
                title="Manajemen User"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-500 hover:text-ink-700 hover:bg-parchment-100 transition-colors"
              >
                <UserCog size={15} />
              </button>
            )}

            {canAdmin && (
              <button
                onClick={() => setShowLogs(true)}
                title="Log Aktivitas"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-500 hover:text-ink-700 hover:bg-parchment-100 transition-colors"
              >
                <ClipboardList size={15} />
              </button>
            )}

            {/* Export buttons */}
            <div className="relative group">
              <button
                disabled={exporting || persons.length === 0}
                title="Export"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-500 hover:text-ink-700 hover:bg-parchment-100 transition-colors disabled:opacity-40"
              >
                <Download size={15}/>
              </button>
              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-parchment-200 py-1 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50">
                <button onClick={handleExportPNG}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-ink-700 hover:bg-parchment-50 font-body">
                  <Image size={13} className="text-purple-500"/> Ekspor PNG
                </button>
                <button onClick={handleExportExcel}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-ink-700 hover:bg-parchment-50 font-body">
                  <FileSpreadsheet size={13} className="text-green-600"/> Ekspor Excel
                </button>
              </div>
            </div>

            {canEdit && (
              <button
                onClick={handleAddNew}
                className="btn-primary px-3 py-1.5 text-xs"
              >
                <Plus size={14} />
                <span className="hidden sm:inline">Tambah</span>
              </button>
            )}

            {/* Auth button */}
            {user ? (
              <div className="flex items-center gap-2 border-l border-parchment-200 pl-2 ml-1">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-medium text-ink-700 font-body leading-tight">{user.username}</span>
                  <span className="text-[10px] text-ink-400 font-body capitalize">{user.role}</span>
                </div>
                <button onClick={logout} title="Keluar"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-500 hover:text-red-500 hover:bg-red-50 transition-colors">
                  <LogOut size={15}/>
                </button>
              </div>
            ) : (
              <button onClick={() => setShowLogin(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-parchment-300 text-xs font-body text-ink-600 hover:bg-parchment-100 transition-colors">
                <LogIn size={14}/> <span className="hidden sm:inline">Masuk</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* React Flow canvas */}
        <div className="flex-1 relative">
          {fetching && (
            <div className="absolute inset-0 bg-parchment-50/80 backdrop-blur-sm z-20 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-3 border-forest-200 border-t-forest-600 rounded-full animate-spin" />
                <p className="text-sm font-body text-ink-500">Memuat data pohon keluarga...</p>
              </div>
            </div>
          )}

          {error && !fetching && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="bg-white rounded-2xl border border-red-200 shadow-lg p-8 max-w-sm text-center">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <X size={24} className="text-red-400" />
                </div>
                <h3 className="font-display font-bold text-ink-800 mb-1">Gagal Memuat</h3>
                <p className="text-sm text-ink-500 font-body mb-4">{error}</p>
                <button onClick={fetchPersons} className="btn-primary mx-auto">
                  <RefreshCw size={14} /> Coba Lagi
                </button>
              </div>
            </div>
          )}

          {!fetching && !error && persons.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <div className="text-center">
                <div className="w-20 h-20 bg-parchment-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-parchment-200">
                  <TreePine size={40} className="text-parchment-400" />
                </div>
                <h3 className="font-display font-bold text-ink-600 text-xl mb-1">Pohon masih kosong</h3>
                <p className="text-sm text-ink-400 font-body">Tambahkan anggota keluarga pertama Anda</p>
                <button
                  onClick={handleAddNew}
                  className="btn-primary mx-auto mt-4 pointer-events-auto"
                >
                  <Plus size={15} /> Tambah Anggota
                </button>
              </div>
            </div>
          )}

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.2}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#d0c8b0" gap={24} size={1} variant="dots" />
            <Controls />
            <MiniMap
              nodeColor={(n) => {
                const gender = n.data?.person?.gender;
                return gender === 'male' ? '#7dd3fc' : gender === 'female' ? '#fda4af' : '#d0c8b0';
              }}
              maskColor="rgba(253,248,240,0.7)"
              style={{ bottom: 16, right: sidebarMode ? 340 : 16 }}
            />

            {/* Legend panel — top-right to avoid covering zoom controls */}
            <Panel position="top-right">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-parchment-200 shadow-sm px-3 py-2 text-xs font-body">
                <p className="text-ink-400 mb-1.5 font-medium text-[10px] uppercase tracking-wider">Legenda</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <svg width="20" height="8"><line x1="0" y1="4" x2="20" y2="4" stroke="#7c9a6e" strokeWidth="2"/></svg>
                    <span className="text-ink-500">Hubungan Ayah</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg width="20" height="8"><line x1="0" y1="4" x2="20" y2="4" stroke="#c47a7a" strokeWidth="2" strokeDasharray="4 2"/></svg>
                    <span className="text-ink-500">Hubungan Ibu</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg width="20" height="8"><line x1="0" y1="4" x2="20" y2="4" stroke="#d4a843" strokeWidth="2.5"/></svg>
                    <span className="text-ink-500">&#9829; Pasangan</span>
                  </div>
                </div>
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* Sidebar */}
        {sidebarMode && (
          <div className="w-72 border-l border-parchment-200 bg-parchment-50 flex flex-col shrink-0 animate-slide-in-right overflow-hidden shadow-lg">
            {sidebarMode === 'form' ? (
              <PersonForm
                person={selectedPerson}
                persons={persons}
                onSave={handleSave}
                onDelete={(p) => setDeleteTarget(p)}
                onClose={handleCloseSidebar}
                loading={loading}
                canEdit={canEdit}
                canDelete={canDelete}
              />
            ) : sidebarMode === 'list' ? (
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between px-4 py-3 border-b border-parchment-200 bg-white">
                  <h2 className="font-display font-semibold text-ink-800 text-base">
                    Daftar Anggota
                  </h2>
                  <button
                    onClick={() => setSidebarMode(null)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-400 hover:text-ink-700 hover:bg-parchment-100 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
                <MemberList
                  persons={persons}
                  selectedId={selectedPerson?.id}
                  onSelect={handleSelectFromList}
                />
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteTarget && (
        <DeleteModal
          person={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          loading={loading}
        />
      )}

      {/* Login modal */}
      {showLogin && <LoginPage onClose={() => setShowLogin(false)} />}

      {/* Admin panel */}
      {showAdmin && <AdminPage onClose={() => setShowAdmin(false)} />}

      {/* Activity log */}
      {showLogs && <ActivityLogPage onClose={() => setShowLogs(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <AppInner />
    </ReactFlowProvider>
  );
}
