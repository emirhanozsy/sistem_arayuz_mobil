/**
 * Client-side data service
 * Loads JSON data, performs search/filter locally, persists updates in localStorage
 */

const STORAGE_KEY = 'member_updates_v1';
let allMembers = null;
let isLoaded = false;

// --- Normalize Turkish characters for search ---
function normalizeTr(s) {
  if (!s) return '';
  return s
    .toUpperCase()
    .replace(/İ/g, 'I').replace(/ı/g, 'I')
    .replace(/Ş/g, 'S').replace(/ş/g, 'S')
    .replace(/Ğ/g, 'G').replace(/ğ/g, 'G')
    .replace(/Ü/g, 'U').replace(/ü/g, 'U')
    .replace(/Ö/g, 'O').replace(/ö/g, 'O')
    .replace(/Ç/g, 'C').replace(/ç/g, 'C')
    .toLowerCase()
    .trim();
}

// --- localStorage helpers ---
function getSavedUpdates() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setSavedUpdates(updates) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updates));
}

// --- Apply saved updates to a member ---
function applyUpdates(member) {
  const updates = getSavedUpdates();
  const saved = updates[member.i];
  if (saved) {
    return {
      ...member,
      d: saved.d !== undefined ? saved.d : member.d,
      b: saved.b !== undefined ? saved.b : member.b,
      r: saved.r !== undefined ? saved.r : member.r,
      nt: saved.nt !== undefined ? saved.nt : member.nt,
    };
  }
  return member;
}

// --- Convert compact member to display format ---
function toDisplayFormat(m) {
  const applied = applyUpdates(m);
  return {
    __originalRowIndex: applied.i,
    'UYE SICIL NO': applied.u,
    'TİCARET SİCİL NO': applied.t,
    'UNVAN': applied.n,
    'ADRES': applied.a,
    'İLÇE': applied.cl || applied.l,
    'CEP TELEFONU (GSM) ': applied.p,
    'YETKİLİ ADI SOYADI/UNVAN': applied.y,
    'MESLEK GRUBU': applied.m,
    'YETKİ BELGESİ DURUM': applied.yb,
    'DURUM': applied.d || '',
    'BELGEYİ ALAN': applied.b || '',
    'REFERANS': applied.r || '',
    'NOTLAR': applied.nt || '',
  };
}

// --- Build search text for a member ---
function getSearchText(m) {
  // Use cached search text if available
  if (m._st) return m._st;
  const parts = [m.u, m.t, m.n, m.y, m.l, m.cl, m.a, m.r].map(normalizeTr);
  m._st = parts.join(' ');
  return m._st;
}

// --- Load data ---
export async function loadData() {
  if (isLoaded && allMembers) return;
  
  const response = await fetch('/data.json');
  allMembers = await response.json();
  isLoaded = true;

  // Pre-build search text index (runs once)
  for (const m of allMembers) {
    getSearchText(m);
  }
}

// --- Search ---
export function searchMembers({ q = '', page = 1, limit = 20, ilce = '', durum = '', komite = '', kayitDurumu = '', sortIlce = '', sortAdres = '' }) {
  if (!allMembers) return { results: [], total: 0, page: 1, limit: 20, hasMore: false };

  const tokens = normalizeTr(q).split(/\s+/).filter(Boolean);
  const normalizedIlce = ilce ? ilce.toUpperCase() : '';
  const updates = getSavedUpdates();

  let filtered = allMembers;

  // Apply search tokens
  if (tokens.length > 0) {
    filtered = filtered.filter(m => {
      const st = getSearchText(m);
      return tokens.every(t => st.includes(t));
    });
  }

  // Apply district filter
  if (normalizedIlce) {
    filtered = filtered.filter(m => {
      const cl = (m.cl || '').toUpperCase();
      const l = (m.l || '').toUpperCase();
      return cl === normalizedIlce || l.includes(normalizedIlce);
    });
  }

  // Apply komite filter
  if (komite) {
    filtered = filtered.filter(m => {
      if (!m.m) return false;
      const match = m.m.match(/(\d+)$/);
      const mKomite = match ? Number(match[1]) : (Number(m.m) || null);
      return mKomite === Number(komite);
    });
  }

  // Apply kayitDurumu filter (Aktif/Askı)
  if (kayitDurumu) {
    filtered = filtered.filter(m => {
      const isAski = m.m && m.m.includes('Askı');
      if (kayitDurumu === 'Askı') return isAski;
      if (kayitDurumu === 'Aktif') return !isAski;
      return true;
    });
  }

  // Apply status filter (check saved updates too)
  if (durum) {
    filtered = filtered.filter(m => {
      const saved = updates[m.i];
      const currentDurum = saved && saved.d !== undefined ? saved.d : m.d;
      return currentDurum === durum;
    });
  }

  // If no filters at all, return empty (don't show all 23k)
  if (tokens.length === 0 && !normalizedIlce && !durum && !komite && !kayitDurumu && !sortIlce && !sortAdres) {
    return { results: [], total: 0, page: 1, limit, hasMore: false };
  }

  // Apply sorting
  if (sortIlce || sortAdres) {
    filtered = [...filtered].sort((a, b) => {
      if (sortIlce) {
        const valA = (a.cl || a.l || '').toUpperCase();
        const valB = (b.cl || b.l || '').toUpperCase();
        if (valA < valB) return sortIlce === 'asc' ? -1 : 1;
        if (valA > valB) return sortIlce === 'asc' ? 1 : -1;
      }
      if (sortAdres) {
        const valA = (a.a || '').toUpperCase();
        const valB = (b.a || '').toUpperCase();
        if (valA < valB) return sortAdres === 'asc' ? -1 : 1;
        if (valA > valB) return sortAdres === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  const total = filtered.length;
  const offset = (page - 1) * limit;
  const paged = filtered.slice(offset, offset + limit);
  const results = paged.map(toDisplayFormat);

  return {
    results,
    total,
    page,
    limit,
    hasMore: (offset + limit) < total,
  };
}

// --- Update member status ---
export function updateMember({ rowIndex, durum, belgeyiAlan, referans, notlar }) {
  const updates = getSavedUpdates();
  
  if (!updates[rowIndex]) {
    updates[rowIndex] = {};
  }

  if (durum !== undefined) updates[rowIndex].d = durum;
  if (belgeyiAlan !== undefined) updates[rowIndex].b = belgeyiAlan;
  if (referans !== undefined) updates[rowIndex].r = referans;
  if (notlar !== undefined) updates[rowIndex].nt = notlar;

  setSavedUpdates(updates);

  return {
    success: true,
    rowIndex,
    durum: updates[rowIndex].d,
    belgeyiAlan: updates[rowIndex].b,
    referans: updates[rowIndex].r,
    notlar: updates[rowIndex].nt,
  };
}

// --- Stats ---
export function getStats() {
  if (!allMembers) return { total: 0, visited: 0, document_received: 0, opposite_party: 0, districts: [] };

  const updates = getSavedUpdates();
  let visited = 0;
  let documentReceived = 0;
  let oppositeParty = 0;
  const districtCounts = {};

  for (const m of allMembers) {
    const saved = updates[m.i];
    const currentDurum = saved && saved.d !== undefined ? saved.d : m.d;

    if (currentDurum === 'Ziyarete Gidildi') visited++;
    else if (currentDurum === 'Belge Alındı') documentReceived++;
    else if (currentDurum === 'Karşı Tarafta') oppositeParty++;

    const cl = m.cl || '';
    if (['GEBZE', 'DARICA', 'ÇAYIROVA', 'DİLOVASI'].includes(cl)) {
      districtCounts[cl] = (districtCounts[cl] || 0) + 1;
    }
  }

  const districts = Object.entries(districtCounts)
    .map(([ilce, count]) => ({ ilce, count }))
    .sort((a, b) => b.count - a.count);

  return {
    total: allMembers.length,
    visited,
    document_received: documentReceived,
    opposite_party: oppositeParty,
    districts,
  };
}
