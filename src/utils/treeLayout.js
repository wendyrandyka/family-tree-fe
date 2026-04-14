/**
 * Family Tree Layout Engine
 *
 * Strategy:
 * 1. Assign each person a generation level (Gen 0 = roots)
 * 2. Build "couple units" — spouse pairs placed side-by-side as one slot
 * 3. Position couple units centered above their children
 * 4. Connect with edges: spouse↔spouse (horizontal), parent→child (vertical)
 */

const NODE_W   = 172;  // node width
const NODE_H   = 96;   // node height
const H_GAP    = 24;   // gap between siblings / couple members
const COUPLE_GAP = 8;  // extra-tight gap between spouses
const V_GAP    = 110;  // vertical gap between generations

// ─── helpers ────────────────────────────────────────────────────────────────

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return dateStr; }
}

export function calcAge(dob, dod) {
  if (!dob) return null;
  const birth = new Date(dob);
  const end   = dod ? new Date(dod) : new Date();
  let age = end.getFullYear() - birth.getFullYear();
  const m = end.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && end.getDate() < birth.getDate())) age--;
  return age;
}

// ─── main export ─────────────────────────────────────────────────────────────

export function buildTree(persons) {
  if (!persons || persons.length === 0) return { nodes: [], edges: [] };

  const byId   = Object.fromEntries(persons.map(p => [p.id, p]));
  const ids    = new Set(persons.map(p => p.id));

  // ── 1. Assign generation via Kahn topological sort ──────────────────────
  const childrenOf = {};   // parentId → [childId]
  const inDeg      = {};
  persons.forEach(p => { childrenOf[p.id] = []; inDeg[p.id] = 0; });

  persons.forEach(p => {
    [p.father_id, p.mother_id].forEach(pid => {
      if (pid && ids.has(pid)) {
        childrenOf[pid].push(p.id);
        inDeg[p.id]++;
      }
    });
  });

  const gen = {};
  const queue = persons.filter(p => inDeg[p.id] === 0).map(p => p.id);
  queue.forEach(id => { gen[id] = 0; });

  while (queue.length) {
    const id = queue.shift();
    childrenOf[id].forEach(cid => {
      gen[cid] = Math.max(gen[cid] ?? 0, (gen[id] ?? 0) + 1);
      if (--inDeg[cid] === 0) queue.push(cid);
    });
  }
  persons.forEach(p => { if (gen[p.id] === undefined) gen[p.id] = 0; });

  // ── 2. Build couple units per generation ────────────────────────────────
  // Force spouses to share the same generation (use max of the two)
  persons.forEach(p => {
    if (p.spouse_id && ids.has(p.spouse_id)) {
      const sp = byId[p.spouse_id];
      const sharedGen = Math.max(gen[p.id] ?? 0, gen[sp.id] ?? 0);
      gen[p.id]  = sharedGen;
      gen[sp.id] = sharedGen;
    }
  });

  const maxGen = Math.max(...Object.values(gen));
  const unitsByGen = {};
  for (let g = 0; g <= maxGen; g++) unitsByGen[g] = [];

  const pairedIds = new Set();

  // First pass: create all couple units
  persons.forEach(p => {
    if (pairedIds.has(p.id)) return;
    const sp = p.spouse_id && ids.has(p.spouse_id) ? byId[p.spouse_id] : null;
    if (sp && !pairedIds.has(sp.id)) {
      const [left, right] = p.gender === 'male' ? [p, sp] : [sp, p];
      const g = gen[p.id];
      unitsByGen[g].push({ left, right, coupled: true });
      pairedIds.add(p.id);
      pairedIds.add(sp.id);
    }
  });

  // Second pass: add remaining singles
  persons.forEach(p => {
    if (pairedIds.has(p.id)) return;
    const g = gen[p.id];
    unitsByGen[g].push({ left: p, right: null, coupled: false });
  });

  // ── 3. First pass: position units without child-centering ───────────────
  const posMap = {};  // personId → {x, y}

  function unitWidth(unit) {
    return unit.coupled ? NODE_W * 2 + COUPLE_GAP : NODE_W;
  }

  function placeGen(g, startX) {
    const units = unitsByGen[g];
    let x = startX;
    units.forEach(unit => {
      const y = g * (NODE_H + V_GAP);
      if (unit.coupled) {
        posMap[unit.left.id]  = { x, y };
        posMap[unit.right.id] = { x: x + NODE_W + COUPLE_GAP, y };
      } else {
        posMap[unit.left.id]  = { x, y };
      }
      x += unitWidth(unit) + H_GAP;
    });
    return x; // next available x
  }

  // Place all gens left-aligned first
  for (let g = 0; g <= maxGen; g++) placeGen(g, 0);

  // ── 4. Bottom-up: center parents over their children ────────────────────
  // Collect children per couple unit
  function coupleChildrenX(unit) {
    const parentIds = new Set([unit.left.id, unit.right?.id].filter(Boolean));
    const childXs = persons
      .filter(p => (p.father_id && parentIds.has(p.father_id)) || (p.mother_id && parentIds.has(p.mother_id)))
      .filter(p => posMap[p.id] !== undefined)
      .map(p => posMap[p.id].x + NODE_W / 2);
    return childXs;
  }

  for (let g = maxGen - 1; g >= 0; g--) {
    unitsByGen[g].forEach(unit => {
      const childXs = coupleChildrenX(unit);
      if (childXs.length === 0) return;
      const childCenter = (Math.min(...childXs) + Math.max(...childXs)) / 2;
      const unitCenter  = unit.coupled
        ? posMap[unit.left.id].x + NODE_W + COUPLE_GAP / 2
        : posMap[unit.left.id].x + NODE_W / 2;
      const dx = childCenter - unitCenter;
      if (Math.abs(dx) < 1) return;
      // shift this unit
      posMap[unit.left.id].x  += dx;
      if (unit.right) posMap[unit.right.id].x += dx;
    });
  }

  // ── 5. Resolve overlaps per generation (sweep right) ────────────────────
  for (let g = 0; g <= maxGen; g++) {
    const units = unitsByGen[g];
    // sort by current left x
    units.sort((a, b) => posMap[a.left.id].x - posMap[b.left.id].x);
    let minX = -Infinity;
    units.forEach(unit => {
      const leftX = posMap[unit.left.id].x;
      if (leftX < minX) {
        const shift = minX - leftX;
        posMap[unit.left.id].x  += shift;
        if (unit.right) posMap[unit.right.id].x += shift;
        minX = posMap[unit.left.id].x + unitWidth(unit) + H_GAP;
      } else {
        minX = leftX + unitWidth(unit) + H_GAP;
      }
    });
  }

  // ── 6. Center all generations horizontally around 0 ─────────────────────
  const allX = Object.values(posMap).map(p => p.x);
  const centerShift = -(Math.min(...allX) + Math.max(...allX)) / 2;
  Object.values(posMap).forEach(p => { p.x += centerShift; });

  // ── 7. Build edges ───────────────────────────────────────────────────────
  const edges = [];
  const edgeSet = new Set();

  persons.forEach(p => {
    // Parent → child edges: exit from bottom of parent, enter top of child
    if (p.father_id && ids.has(p.father_id)) {
      const eid = `father-${p.father_id}-${p.id}`;
      if (!edgeSet.has(eid)) {
        edgeSet.add(eid);
        edges.push({
          id: eid,
          source: String(p.father_id),
          target: String(p.id),
          sourceHandle: 'bottom',
          targetHandle: 'top',
          type: 'smoothstep',
          style: { stroke: '#7c9a6e', strokeWidth: 2 },
          markerEnd: { type: 'arrowclosed', color: '#7c9a6e', width: 14, height: 14 },
          label: 'ayah',
          labelStyle: { fontSize: 9, fill: '#6b8a5e', fontFamily: 'DM Sans, sans-serif' },
          labelBgStyle: { fill: '#f0f7ee', fillOpacity: 0.85 },
          labelBgPadding: [3, 2],
          labelBgBorderRadius: 3,
        });
      }
    }
    if (p.mother_id && ids.has(p.mother_id)) {
      const eid = `mother-${p.mother_id}-${p.id}`;
      if (!edgeSet.has(eid)) {
        edgeSet.add(eid);
        edges.push({
          id: eid,
          source: String(p.mother_id),
          target: String(p.id),
          sourceHandle: 'bottom',
          targetHandle: 'top',
          type: 'smoothstep',
          style: { stroke: '#c47a7a', strokeWidth: 2, strokeDasharray: '5 3' },
          markerEnd: { type: 'arrowclosed', color: '#c47a7a', width: 14, height: 14 },
          label: 'ibu',
          labelStyle: { fontSize: 9, fill: '#a05a5a', fontFamily: 'DM Sans, sans-serif' },
          labelBgStyle: { fill: '#fdf0f0', fillOpacity: 0.85 },
          labelBgPadding: [3, 2],
          labelBgBorderRadius: 3,
        });
      }
    }

    // Spouse ↔ spouse horizontal edge (once per pair)
    // Always goes: left person's Right handle → right person's Left handle
    if (p.spouse_id && ids.has(p.spouse_id) && p.id < p.spouse_id) {
      const sp = byId[p.spouse_id];
      const leftPerson  = p.gender === 'male' ? p : (sp.gender === 'male' ? sp : p);
      const rightPerson = leftPerson.id === p.id ? sp : p;
      const eid = `spouse-${p.id}-${p.spouse_id}`;
      edges.push({
        id: eid,
        source: String(leftPerson.id),
        target: String(rightPerson.id),
        sourceHandle: 'right',
        targetHandle: 'left',
        type: 'straight',
        style: { stroke: '#d4a843', strokeWidth: 2.5 },
        label: '♥ pasangan',
        labelStyle: { fontSize: 9, fill: '#a07820', fontFamily: 'DM Sans, sans-serif' },
        labelBgStyle: { fill: '#fffbea', fillOpacity: 0.9 },
        labelBgPadding: [3, 2],
        labelBgBorderRadius: 4,
        markerEnd: undefined,
      });
    }
  });

  // ── 8. Build React Flow nodes ────────────────────────────────────────────
  const nodes = persons.map(p => ({
    id: String(p.id),
    type: 'personNode',
    position: posMap[p.id] || { x: 0, y: 0 },
    data: { person: p },
    draggable: true,
  }));

  return { nodes, edges };
}
