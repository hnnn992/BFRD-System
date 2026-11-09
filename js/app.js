/**
 * ============================================================
 * BFRD System — Body Fitness & Requirement Data System
 * Jabatan Bomba dan Penyelamat Brunei
 * Frontend Application Logic — app.js
 * ============================================================
 */

// ── State Pengurusan Aplikasi ──
const STATE = {
  user: null,          // { idPegawai, role, nama, token }
  jawatanList: [],     // Senarai syarat jawatan dari server / cache
  pemohonList: [],     // Senarai pemohon
  aktivitiList: [],    // Jejak audit aktiviti
  filteredPemohon: [], // Senarai pemohon selepas tapisan
  currentPage: 'dashboard',
  docStatus: [true, true, true, true, false, true], // 6 dokumen default
  jantina: 'Lelaki',
  pagination: {
    page: 1,
    limit: 10,
    total: 0
  },
  chartInstance: null,
  activeDetailData: null
};

// ── 6 Jawatan Rasmi Jabatan Bomba dan Penyelamat Brunei ──
const OFFICIAL_JAWATAN = [
  {
    'Kod Jawatan': 'PBP',
    'Nama Jawatan': 'Penguasa Bomba dan Penyelamat',
    'Bahagian': 'Bahagian II',
    'Min. Umur': 18,
    'Maks. Umur': 35,
    'Min. Tinggi Lelaki (cm)': 161,
    'Min. Tinggi Wanita (cm)': 152,
    'Min. BMI': 19.0,
    'Maks. BMI': 27.0,
    'Syarat Tambahan': 'Bahagian II | Umur: 18 - 35 tahun | Kelayakan Akademik: Ijazah Sarjana Muda'
  },
  {
    'Kod Jawatan': 'TPBP',
    'Nama Jawatan': 'Timbalan Penguasa Bomba dan Penyelamat',
    'Bahagian': 'Bahagian III',
    'Min. Umur': 18,
    'Maks. Umur': 35,
    'Min. Tinggi Lelaki (cm)': 161,
    'Min. Tinggi Wanita (cm)': 152,
    'Min. BMI': 19.0,
    'Maks. BMI': 27.0,
    'Syarat Tambahan': 'Bahagian III | Umur: 18 - 35 tahun | Kelayakan Akademik: Diploma Tertinggi Kebangsaan (HND)'
  },
  {
    'Kod Jawatan': 'PPBP',
    'Nama Jawatan': 'Penolong Penguasa Bomba dan Penyelamat',
    'Bahagian': 'Bahagian III',
    'Min. Umur': 18,
    'Maks. Umur': 32,
    'Min. Tinggi Lelaki (cm)': 161,
    'Min. Tinggi Wanita (cm)': 152,
    'Min. BMI': 19.0,
    'Maks. BMI': 27.0,
    'Syarat Tambahan': 'Bahagian III | Umur: 18 - 32 tahun | Kelayakan Akademik: Sijil Tertinggi Kebangsaan (HNC)'
  },
  {
    'Kod Jawatan': 'PB',
    'Nama Jawatan': 'Pegawai Balai',
    'Bahagian': 'Bahagian III',
    'Min. Umur': 18,
    'Maks. Umur': 30,
    'Min. Tinggi Lelaki (cm)': 161,
    'Min. Tinggi Wanita (cm)': 152,
    'Min. BMI': 19.0,
    'Maks. BMI': 27.0,
    'Syarat Tambahan': 'Bahagian III | Umur: 18 - 30 tahun | Kelayakan Akademik: Diploma Kebangsaan Peringkat Biasa (OND)'
  },
  {
    'Kod Jawatan': 'TPB',
    'Nama Jawatan': 'Timbalan Pegawai Balai',
    'Bahagian': 'Bahagian IV',
    'Min. Umur': 18,
    'Maks. Umur': 26,
    'Min. Tinggi Lelaki (cm)': 161,
    'Min. Tinggi Wanita (cm)': 152,
    'Min. BMI': 19.0,
    'Maks. BMI': 27.0,
    'Syarat Tambahan': 'Bahagian IV | Umur: 18 - 26 tahun | Kelayakan Akademik: Diploma Kebangsaan Peringkat Biasa (OND)'
  },
  {
    'Kod Jawatan': 'ABP',
    'Nama Jawatan': 'Ahli Bomba dan Penyelamat',
    'Bahagian': 'Bahagian IV',
    'Min. Umur': 18,
    'Maks. Umur': 26,
    'Min. Tinggi Lelaki (cm)': 161,
    'Min. Tinggi Wanita (cm)': 152,
    'Min. BMI': 19.0,
    'Maks. BMI': 27.0,
    'Syarat Tambahan': 'Bahagian IV | Umur: 18 - 26 tahun | Kelayakan Akademik: Kredit 4 matapelajaran dalam BC-GCE O Level'
  }
];

const SEED_JAWATAN = OFFICIAL_JAWATAN;
const SEED_PEMOHON = [];

// ════════════════════════════════════════════════════════════
// 1. KOMUNIKASI API (GAS-PRO-API & CORS-Safe Pattern)
// ════════════════════════════════════════════════════════════

function isGasConfigured() {
  return typeof GAS_URL === 'string' &&
         GAS_URL.startsWith('http') &&
         !GAS_URL.includes('GANTI_DENGAN_URL_GAS_EXEC');
}

/**
 * Fetch GET request ke Google Apps Script REST API
 */
async function apiGet(action, params = {}) {
  if (!isGasConfigured()) {
    console.warn(`[API GET (Demo Mode)]: ${action}`);
    return mockGet(action, params);
  }

  try {
    const url = new URL(GAS_URL);
    url.searchParams.set('action', action);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.error('Fetch GET Error:', err);
    showToast(`Ralat capaian pelayan: ${err.message}`, 'error');
    return { success: false, message: err.message };
  }
}

/**
 * Fetch POST request ke Google Apps Script (WAJIB text/plain untuk elak CORS preflight)
 */
async function apiPost(action, data = {}) {
  const token = sessionStorage.getItem('bfrdToken') || '';

  if (!isGasConfigured()) {
    console.warn(`[API POST (Demo Mode)]: ${action}`, data);
    return mockPost(action, data, token);
  }

  try {
    // Sediakan data pada aras utama dan juga bersarang di dalam .data untuk keserasian sempurna dengan GAS
    const payload = Object.assign({ action, token }, data, { data: data });

    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // Non-negotiable CORS rule
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.error('Fetch POST Error:', err);
    showToast(`Ralat hantar data: ${err.message}`, 'error');
    return { success: false, message: err.message };
  }
}

// ── Mock Respon Tempatan untuk Ujian Pantas / Demo ──
function mockGet(action, params) {
  if (action === 'getSyaratJawatan') {
    return { success: true, data: STATE.jawatanList };
  }
  if (action === 'getPemohon') {
    return { success: true, data: STATE.pemohonList };
  }
  if (action === 'getAktiviti') {
    return { success: true, data: STATE.aktivitiList };
  }
  if (action === 'getDashboardStats') {
    const hadir = STATE.pemohonList.length;
    const layak = STATE.pemohonList.filter(p => p['Keputusan Akhir'] === 'Layak').length;
    const semakan = STATE.pemohonList.filter(p => p['Keputusan Akhir'] === 'Perlu Semakan').length;
    const gagal = STATE.pemohonList.filter(p => p['Keputusan Akhir'] === 'Tidak Layak').length;
    return { success: true, data: { hadir, layak, semakan, gagal } };
  }
  return { success: true, data: [] };
}

function mockPost(action, data, token) {
  if (action === 'login') {
    const id = (data.idPegawai || '').toLowerCase().trim();
    const pin = (data.pin || '').trim();

    // Terima akaun admin
    if (id === 'admin01' || id === 'admin' || id.startsWith('admin')) {
      return {
        success: true,
        message: 'Log masuk sebagai Pentadbir Kanan berjaya',
        token: 'demo-hmac-token-' + Date.now(),
        user: { idPegawai: id || 'admin01', role: 'superadmin', nama: 'Pentadbir Kanan BFRD' }
      };
    }

    // Terima akaun pegawai atau sebarang ID
    return {
      success: true,
      message: 'Log masuk sebagai Pegawai Pemeriksa berjaya',
      token: 'demo-hmac-token-' + Date.now(),
      user: { idPegawai: id || 'p001', role: 'pegawai', nama: 'Hj. Razali bin Mahmud' }
    };
  }

  if (action === 'simpanPemohon') {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const ymd = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}`;
    const seq = String(STATE.pemohonList.length + 1).padStart(4, '0');
    const newId = `BFRD-${ymd}-${seq}`;

    const newRecord = {
      'ID Pendaftaran': newId,
      'Tarikh & Masa': `${pad(now.getDate())}/${pad(now.getMonth()+1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`,
      ...data,
      'Pegawai Pemeriksa': (STATE.user && STATE.user.idPegawai) || 'p001'
    };

    STATE.pemohonList.unshift(newRecord);
    STATE.aktivitiList.unshift({
      'Tarikh & Masa': newRecord['Tarikh & Masa'],
      'ID Pemohon': newId,
      'Nama Pegawai': (STATE.user && STATE.user.nama) || 'Pegawai Bertugas',
      'Tindakan': 'Daftar Baharu',
      'Keterangan': `Pendaftaran saringan fizikal untuk ${newRecord['Nama Penuh']}`
    });

    return { success: true, message: 'Rekod pemohon berjaya disimpan', id: newId, data: newRecord };
  }

  if (action === 'simpanSyaratJawatan') {
    const idx = STATE.jawatanList.findIndex(j => j['Kod Jawatan'] === data['Kod Jawatan']);
    if (idx >= 0) {
      STATE.jawatanList[idx] = { ...STATE.jawatanList[idx], ...data };
    } else {
      STATE.jawatanList.push(data);
    }
    return { success: true, message: 'Syarat jawatan berjaya disimpan' };
  }

  return { success: true, message: 'Operasi demo selesai' };
}

// ════════════════════════════════════════════════════════════
// 2. INITIALIZATION & AUTH GUARD
// ════════════════════════════════════════════════════════════

window.addEventListener('DOMContentLoaded', async () => {
  // Semak sama ada peranti ini dibuka sebagai iPad / Telefon Remote Terminal (?remote=XXXX)
  const urlParams = new URLSearchParams(window.location.search);
  const remoteCode = urlParams.get('remote') || urlParams.get('session');
  if (remoteCode) {
    initRemoteCompanion(remoteCode);
    refreshIcons();
    return;
  }

  initAppSession();
  setupEventListeners();
  startLiveClock();
  initDesktopCompanionHost();

  // Kemas kini tarikh sesi semasa di topbar
  const now = new Date();
  const options = { day: '2-digit', month: 'short', year: 'numeric' };
  const strDate = now.toLocaleDateString('ms-BN', options);
  const elDate = document.getElementById('txt-session-date');
  if (elDate) elDate.textContent = strDate;

  // Inisialisasi ikon Lucide
  refreshIcons();

  // Muat data awal (Syarat jawatan di-cache di localStorage)
  await loadInitialData();

  // Semak status pengesahan sesi & buka stesen aktif secara automatik
  checkAuth();
});

/**
 * Jam Langsung Waktu Sistem Brunei (Command Dashboard Clock)
 */
function startLiveClock() {
  const hariArr = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
  const bulanArr = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];

  function tick() {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const dateStr = `${hariArr[now.getDay()]}, ${pad(now.getDate())} ${bulanArr[now.getMonth()]} ${now.getFullYear()}`;

    const elTime = document.getElementById('cmd-clock-time');
    const elDate = document.getElementById('cmd-clock-date');
    if (elTime) elTime.textContent = timeStr;
    if (elDate) elDate.textContent = dateStr;

    const elInsp = document.getElementById('inspector-timestamp');
    if (elInsp) elInsp.textContent = `${timeStr} • ${dateStr}`;
  }

  tick();
  setInterval(tick, 1000);
}

function initAppSession() {
  const token = sessionStorage.getItem('bfrdToken');
  const role = sessionStorage.getItem('bfrdRole');
  const nama = sessionStorage.getItem('bfrdNama');
  const idPegawai = sessionStorage.getItem('bfrdId');

  if (token && idPegawai) {
    STATE.user = { token, role, nama, idPegawai };
    updateUserInterface();
  }
}

function checkAuth() {
  const pageLogin = document.getElementById('page-login');
  const appShell = document.getElementById('app-shell');

  if (!STATE.user) {
    pageLogin.style.display = 'flex';
    appShell.style.display = 'none';
  } else {
    pageLogin.style.display = 'none';
    appShell.style.display = 'flex';
    
    // Semak URL param (?stesen=1/2/3/4) atau pilihan stesen disimpan (lalai: Stesen 1)
    const urlParams = new URLSearchParams(window.location.search);
    const targetStn = urlParams.get('stesen') || urlParams.get('station') || localStorage.getItem('bfrd_active_station') || '1';
    switchStation(targetStn);
  }
}

function updateUserInterface() {
  if (!STATE.user) return;

  const elName = document.getElementById('officer-display-name');
  const elId = document.getElementById('officer-display-id');
  const elAvatar = document.getElementById('officer-avatar-text');
  const elBadge = document.getElementById('user-role-badge');

  if (elName) elName.textContent = STATE.user.nama || 'Pegawai Bertugas';
  if (elId) elId.textContent = `ID: ${STATE.user.idPegawai}`;
  if (elAvatar) elAvatar.textContent = (STATE.user.nama || 'P').charAt(0).toUpperCase();

  if (elBadge) {
    if (STATE.user.role === 'superadmin') {
      elBadge.innerHTML = `<i data-lucide="shield-check" style="width:12px;height:12px;"></i> Pentadbir`;
      elBadge.style.color = '#F59E0B';
    } else {
      elBadge.innerHTML = `<i data-lucide="shield" style="width:12px;height:12px;"></i> Pegawai`;
      elBadge.style.color = 'var(--white)';
    }
  }

  // Hak cipta peranan pada butang tambah syarat
  const btnTambahSyarat = document.getElementById('btn-tambah-syarat');
  if (btnTambahSyarat) {
    btnTambahSyarat.style.display = (STATE.user.role === 'superadmin') ? 'inline-flex' : 'none';
  }

  refreshIcons();
}

async function handleLogin(e) {
  e.preventDefault();
  const idInput = document.getElementById('login-id');
  const pinInput = document.getElementById('login-pin');
  const btnSubmit = document.getElementById('btn-login-submit');

  const idPegawai = idInput.value.trim();
  const pin = pinInput.value;

  if (!idPegawai || !pin) {
    showToast('Sila masukkan ID Pegawai dan PIN keselamatan.', 'warning');
    return;
  }

  btnSubmit.disabled = true;
  btnSubmit.innerHTML = `<span>Mengesahkan...</span>`;

  try {
    const res = await apiPost('login', { idPegawai, pin });

    if (res.success && res.token) {
      const userRole = res.role || (res.user && res.user.role) || 'pegawai';
      const userNama = res.nama || (res.user && res.user.nama) || 'Pegawai Bertugas';
      const userId   = (res.user && res.user.idPegawai) || idPegawai;

      STATE.user = {
        token: res.token,
        idPegawai: userId,
        role: userRole,
        nama: userNama
      };

      sessionStorage.setItem('bfrdToken', res.token);
      sessionStorage.setItem('bfrdId', userId);
      sessionStorage.setItem('bfrdRole', userRole);
      sessionStorage.setItem('bfrdNama', userNama);

      showToast(`Selamat bertugas, ${userNama}!`, 'success');
      updateUserInterface();
      checkAuth();
    } else {
      showToast(res.message || 'Log masuk gagal.', 'error');
    }
  } catch (err) {
    console.error('Login error detail:', err);
    showToast(`Ralat semasa log masuk: ${err.message}`, 'error');
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = `<i data-lucide="log-in"></i><span>Log Masuk Kaunter</span>`;
    refreshIcons();
  }
}

function handleLogout() {
  if (confirm('Adakah anda pasti ingin menamatkan sesi kaunter ini?')) {
    sessionStorage.clear();
    STATE.user = null;
    showToast('Sesi telah ditamatkan.', 'info');
    checkAuth();
  }
}

function togglePassVisibility(id) {
  const inp = document.getElementById(id);
  const icon = document.getElementById(`${id}-eye`);
  if (!inp) return;
  if (inp.type === 'password') {
    inp.type = 'text';
    if (icon) icon.setAttribute('data-lucide', 'eye-off');
  } else {
    inp.type = 'password';
    if (icon) icon.setAttribute('data-lucide', 'eye');
  }
  refreshIcons();
}

function quickFill(id, pin) {
  const elId = document.getElementById('login-id');
  const elPin = document.getElementById('login-pin');
  if (elId) elId.value = id;
  if (elPin) elPin.value = pin;
  const form = document.getElementById('form-login');
  if (form) {
    if (form.requestSubmit) {
      form.requestSubmit();
    } else {
      const btn = document.getElementById('btn-login-submit');
      if (btn) btn.click();
    }
  }
}

function toggleSidebar(open) {
  const sb = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (!sb || !overlay) return;

  if (open) {
    sb.classList.add('open');
    overlay.classList.add('show');
  } else {
    sb.classList.remove('open');
    overlay.classList.remove('show');
  }
}

// ════════════════════════════════════════════════════════════
// 3. NAVIGATION & SPA ROUTER
// ════════════════════════════════════════════════════════════

function navigateTo(pageId) {
  STATE.currentPage = pageId;

  // Tutup sidebar di skrin mudah alih
  toggleSidebar(false);

  // Sembunyikan semua halaman
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  // Tunjukkan halaman aktif
  const targetPage = document.getElementById(`page-${pageId}`);
  if (targetPage) {
    targetPage.classList.add('active');
  }

  // Kemas kini nav items aktif
  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.getAttribute('data-page') === pageId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Kemas kini mobile bottom nav aktif
  const mobTabMap = {
    'senarai': 'mob-nav-senarai',
    'kaunter': 'mob-nav-kaunter',
    'dashboard': 'mob-nav-dashboard'
  };
  document.querySelectorAll('.mobile-nav-btn').forEach(btn => btn.classList.remove('active'));
  if (mobTabMap[pageId]) {
    const mobBtn = document.getElementById(mobTabMap[pageId]);
    if (mobBtn) mobBtn.classList.add('active');
  }

  // Kemas kini tajuk topbar
  const titles = {
    'dashboard': 'Stesen 4: Pemeriksaan Akhir & Cetakan (Laptop)',
    'kaunter': 'Stesen 1: Pendaftaran & Kad QR Calon',
    'stesen-2': 'Stesen 2: Timbangan & Ukuran Fizikal (Imbas QR)',
    'stesen-3': 'Stesen 3: Pengesahan Dokumen Fizikal (Imbas QR)',
    'senarai': 'Pangkalan Data & Rekod Pemohon',
    'syarat': 'Konfigurasi Syarat Fizikal Jawatan BFRD',
    'aktiviti': 'Jejak Audit & Rekod Aktiviti Sistem'
  };
  const elTitle = document.getElementById('page-title');
  if (elTitle) elTitle.textContent = titles[pageId] || 'BFRD System';

  // Panggil pemuat data spesifik mengikut halaman
  if (pageId === 'dashboard') {
    loadDashboardData();
  } else if (pageId === 'kaunter') {
    initBorangKaunter();
  } else if (pageId === 'senarai') {
    loadPemohonData();
  } else if (pageId === 'syarat') {
    renderSyaratTable();
  } else if (pageId === 'aktiviti') {
    loadAktivitiData();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ════════════════════════════════════════════════════════════
// 4. DATA LOADING & PERSISTENCE
// ════════════════════════════════════════════════════════════

async function loadInitialData() {
  // 1. Semak cache syarat jawatan di localStorage (TTL: 6 jam)
  const cachedSyarat = localStorage.getItem('cache_syarat');
  const cachedTime = localStorage.getItem('cache_syarat_time');
  const SIX_HOURS = 6 * 60 * 60 * 1000;

  if (cachedSyarat && cachedTime && (Date.now() - Number(cachedTime) < SIX_HOURS)) {
    try {
      const parsed = JSON.parse(cachedSyarat);
      // Jika cache mengandungi jawatan contoh lama (BPN/BPK), gunakan syarat rasmi
      if (Array.isArray(parsed) && parsed.length > 0 && !parsed.some(j => j['Kod Jawatan'] === 'BPN')) {
        STATE.jawatanList = parsed;
      } else {
        STATE.jawatanList = OFFICIAL_JAWATAN;
      }
    } catch (e) {
      STATE.jawatanList = OFFICIAL_JAWATAN;
    }
  } else {
    // Muat data syarat jawatan sebenar dari API Google Sheets
    const res = await apiGet('getSyaratJawatan');
    if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
      // Jika data dari spreadsheet masih data mock lama, gabungkan atau gunakan rasmi
      if (res.data.some(j => j['Kod Jawatan'] === 'BPN')) {
        STATE.jawatanList = OFFICIAL_JAWATAN;
      } else {
        STATE.jawatanList = res.data;
      }
      localStorage.setItem('cache_syarat', JSON.stringify(STATE.jawatanList));
      localStorage.setItem('cache_syarat_time', String(Date.now()));
    } else {
      STATE.jawatanList = OFFICIAL_JAWATAN;
      localStorage.setItem('cache_syarat', JSON.stringify(OFFICIAL_JAWATAN));
      localStorage.setItem('cache_syarat_time', String(Date.now()));
    }
  }

  // Isi dropdown jawatan
  populateJawatanDropdowns();

  // 2. Muat data rekod pemohon sebenar secara terus daripada Google Sheets
  const resP = await apiGet('getPemohon');
  if (resP && resP.success && Array.isArray(resP.data)) {
    STATE.pemohonList = resP.data;
  } else {
    STATE.pemohonList = [];
  }
  updateNavBadgeCount();
}

function populateJawatanDropdowns() {
  const selForm = document.getElementById('inp-jawatan');
  const selFilter = document.getElementById('filter-jawatan');

  if (selForm) {
    selForm.innerHTML = `<option value="">-- Pilih Jawatan --</option>` +
      STATE.jawatanList.map(j => `<option value="${j['Nama Jawatan']}">${j['Nama Jawatan']}</option>`).join('');
  }

  if (selFilter) {
    selFilter.innerHTML = `<option value="">Semua Jawatan</option>` +
      STATE.jawatanList.map(j => `<option value="${j['Nama Jawatan']}">${j['Nama Jawatan']}</option>`).join('');
  }
}

function updateNavBadgeCount() {
  const badge = document.getElementById('nav-count-pemohon');
  if (badge) badge.textContent = STATE.pemohonList.length;
}

// ════════════════════════════════════════════════════════════
// 5. DASHBOARD & ANALITIK
// ════════════════════════════════════════════════════════════

async function loadDashboardData() {
  const res = await apiGet('getDashboardStats');
  let stats = { hadir: 0, layak: 0, semakan: 0, gagal: 0 };

  if (res.success && res.data) {
    stats = res.data;
  } else {
    // Kira manual dari pemohonList
    stats.hadir = STATE.pemohonList.length;
    stats.layak = STATE.pemohonList.filter(p => p['Keputusan Akhir'] === 'Layak').length;
    stats.semakan = STATE.pemohonList.filter(p => p['Keputusan Akhir'] === 'Perlu Semakan').length;
    stats.gagal = STATE.pemohonList.filter(p => p['Keputusan Akhir'] === 'Tidak Layak').length;
  }

  // Kemas kini kad metrik
  const elHadir = document.getElementById('kpi-hadir');
  const elLayak = document.getElementById('kpi-layak');
  const elSemakan = document.getElementById('kpi-semakan');

  if (elHadir) elHadir.textContent = stats.hadir;
  if (elLayak) elLayak.textContent = stats.layak;
  if (elSemakan) elSemakan.textContent = stats.semakan;

  const pct = v => stats.hadir > 0 ? Math.round((v / stats.hadir) * 100) : 0;
  const elLayakPct = document.getElementById('kpi-layak-pct');
  const elSemakanPct = document.getElementById('kpi-semakan-pct');
  if (elLayakPct) elLayakPct.textContent = `${pct(stats.layak)}% daripada hadir`;
  if (elSemakanPct) elSemakanPct.textContent = `${pct(stats.semakan)}% daripada hadir`;

  // Kemas kini nama pegawai di banner komando
  const elCmdUser = document.getElementById('cmd-user-name');
  if (elCmdUser) {
    elCmdUser.textContent = (STATE.user && STATE.user.nama) || 'Pegawai Bertugas BFRD';
  }

  // Kemas kini pecahan jawatan dipohon
  updatePositionBreakdown();

  // Kemas kini pipeline tracker (6 peringkat)
  updatePipelineTracker(stats);

  // Render carta
  renderChart(stats);

  // Render aktiviti terkini
  renderDashboardActivity();

  // Kemas kini giliran calon Meja Ketua Penguji (Stesen 4)
  renderStation4Queue();
}

/**
 * Kemas kini pecahan bilangan pemohon mengikut jawatan (Slots Breakdown)
 */
function updatePositionBreakdown() {
  const abpCount = STATE.pemohonList.filter(p => (p['Jawatan Dipohon'] || '').includes('Ahli Bomba')).length;
  const pbCount = STATE.pemohonList.filter(p => (p['Jawatan Dipohon'] || '').includes('Pegawai Balai') && !(p['Jawatan Dipohon'] || '').includes('Timbalan')).length;
  const tpbCount = STATE.pemohonList.filter(p => (p['Jawatan Dipohon'] || '').includes('Timbalan Pegawai')).length;
  const pbpCount = STATE.pemohonList.filter(p => (p['Jawatan Dipohon'] || '').includes('Penguasa')).length;

  const elAbp = document.getElementById('slot-abp-count');
  const elPb = document.getElementById('slot-pb-count');
  const elTpb = document.getElementById('slot-tpb-count');
  const elPbp = document.getElementById('slot-pbp-count');

  if (elAbp) elAbp.textContent = abpCount;
  if (elPb) elPb.textContent = pbCount;
  if (elTpb) elTpb.textContent = tpbCount;
  if (elPbp) elPbp.textContent = pbpCount;
}

/**
 * Kemas kini bilangan calon dalam Jejak Saluran Pengambilan (Pipeline Tracker)
 */
function updatePipelineTracker(stats) {
  const total = STATE.pemohonList.length;

  // Peringkat 1: Pendaftaran Kaunter / Walk-in
  const elP1 = document.getElementById('pipe-count-1');
  if (elP1) elP1.textContent = total;

  // Peringkat 2: Pengesahan Dokumen & Akademik
  const docOkCount = STATE.pemohonList.filter(p => p['Semakan Kad Pengenalan'] === 'Ya' && p['Semakan Surat Panggilan'] === 'Ya').length;
  const elP2 = document.getElementById('pipe-count-2');
  if (elP2) elP2.textContent = docOkCount;

  // Peringkat 3: Ukuran Fizikal & Antropometrik
  const fizikalCount = STATE.pemohonList.filter(p => parseFloat(p['Tinggi (cm)'] || 0) > 0).length;
  const elP3 = document.getElementById('pipe-count-3');
  if (elP3) elP3.textContent = fizikalCount;

  // Peringkat 4: Ujian Ketangkasan Fizikal (Layak ke PAFT/IPPT)
  const elP4 = document.getElementById('pipe-count-4');
  if (elP4) elP4.textContent = stats.layak;

  // Peringkat 5: Lembaga Temuduga & Ujian Khas (Perlu Semakan / Tapisan Khas)
  const elP5 = document.getElementById('pipe-count-5');
  if (elP5) elP5.textContent = stats.semakan;

  // Peringkat 6: Pemilihan Akhir (Sasaran Melepasi Saringan)
  const elP6 = document.getElementById('pipe-count-6');
  if (elP6) elP6.textContent = Math.max(0, stats.layak - stats.semakan);
}

function renderChart(stats) {
  const ctx = document.getElementById('chartStatus');
  if (!ctx) return;

  if (STATE.chartInstance) {
    STATE.chartInstance.destroy();
  }

  STATE.chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Layak (Lulus)', 'Perlu Semakan', 'Tidak Layak (Gagal)'],
      datasets: [{
        label: 'Bilangan Pemohon',
        data: [stats.layak, stats.semakan, stats.gagal],
        backgroundColor: [
          'rgba(5, 150, 105, 0.85)',  // Emerald Green
          'rgba(245, 158, 11, 0.85)',  // Royal Gold
          'rgba(220, 38, 38, 0.85)'   // Fire Red
        ],
        borderColor: [
          '#059669',
          '#F59E0B',
          '#DC2626'
        ],
        borderWidth: 1.5,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { stepSize: 1 }
        }
      }
    }
  });
}

function renderDashboardActivity() {
  const elList = document.getElementById('dashboard-recent-activity');
  if (!elList) return;

  const recent = STATE.pemohonList.slice(0, 5);
  if (recent.length === 0) {
    elList.innerHTML = `<li class="activity-item"><div class="activity-info"><div class="activity-name">Tiada rekod saringan hari ini</div></div></li>`;
    return;
  }

  elList.innerHTML = recent.map(p => {
    let dotClass = 'green';
    if (p['Keputusan Akhir'] === 'Perlu Semakan') dotClass = 'amber';
    if (p['Keputusan Akhir'] === 'Tidak Layak') dotClass = 'red';

    return `
      <li class="activity-item">
        <div class="activity-dot ${dotClass}"></div>
        <div class="activity-info">
          <div class="activity-name">${escapeHtml(p['Nama Penuh'])}</div>
          <div class="activity-meta">${p['No. IC']} • ${escapeHtml(p['Jawatan Dipohon'])} • ${p['Tarikh & Masa'] || ''}</div>
        </div>
      </li>
    `;
  }).join('');
}

// ════════════════════════════════════════════════════════════
// 6. KAUNTER SARINGAN & REAKTIF BMI ENGINE
// ════════════════════════════════════════════════════════════

function initBorangKaunter() {
  generateDraftId();
  calcBMI();
  updateFormProgress();
  broadcastCandidateToiPad(true);
}

function generateDraftId() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const ymd = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}`;
  const seq = String(STATE.pemohonList.length + 1).padStart(4, '0');
  const newRef = `BFRD-${ymd}-${seq}`;

  const el = document.getElementById('txt-form-ref-id');
  if (el) el.textContent = newRef;
}

function setJantina(val) {
  STATE.jantina = val;
  const buttons = document.querySelectorAll('#segmented-jantina .segmented-btn');
  buttons.forEach(btn => {
    if (btn.getAttribute('data-val') === val) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Tunjukkan atau sembunyikan ukuran dada (hanya untuk lelaki mengikut Screen 08)
  const groupDada = document.getElementById('group-ukuran-dada');
  if (groupDada) {
    groupDada.style.display = (val === 'Lelaki') ? 'block' : 'none';
  }

  handleJawatanChange();
}

// ════════════════════════════════════════════════════════════
// STESEN TIMBANG & PENGUKURAN FIZIKAL TAKTIKAL (TACTILE STATE)
// ════════════════════════════════════════════════════════════
let currentHeight = 168.0;
let currentWeight = 65.0;
let currentChest = 33.0;
let isHold = false;
let activeNumpadField = 'height';
let numpadBuffer = '168.0';

function adjustHeight(delta) {
  currentHeight = Math.round((currentHeight + delta) * 10) / 10;
  if (currentHeight < 100) currentHeight = 100;
  if (currentHeight > 250) currentHeight = 250;
  updateHeightDisplay();
  calcBMI();
}

function setHeight(val) {
  currentHeight = parseFloat(val) || 168.0;
  updateHeightDisplay();
  calcBMI();
}

function updateHeightDisplay() {
  const inp = document.getElementById('inp-tinggi');
  if (inp && document.activeElement !== inp) {
    inp.value = currentHeight.toFixed(1);
  }
  const el = document.getElementById('height-val');
  if (el) el.textContent = currentHeight.toFixed(1);

  // Kemas kini butang preset aktif
  document.querySelectorAll('#height-presets-row .preset-pill').forEach(btn => {
    const txt = btn.textContent;
    if (txt.includes(currentHeight.toFixed(1))) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function adjustWeight(delta) {
  currentWeight = Math.round((currentWeight + delta) * 10) / 10;
  if (currentWeight < 30) currentWeight = 30;
  if (currentWeight > 250) currentWeight = 250;
  updateWeightDisplay();
  calcBMI();
}

function setWeight(val) {
  currentWeight = parseFloat(val) || 65.0;
  updateWeightDisplay();
  calcBMI();
}

function adjustChest(delta) {
  currentChest = Math.round((currentChest + delta) * 10) / 10;
  if (currentChest < 20) currentChest = 20;
  if (currentChest > 60) currentChest = 60;
  updateChestDisplay();
  calcBMI();
}

function setChest(val) {
  currentChest = parseFloat(val) || 33.0;
  updateChestDisplay();
  calcBMI();
}

function updateWeightDisplay() {
  const inp = document.getElementById('inp-berat');
  if (inp && document.activeElement !== inp) {
    inp.value = currentWeight.toFixed(1);
  }
  const el = document.getElementById('weight-val');
  if (el) el.textContent = currentWeight.toFixed(1);
}

function updateChestDisplay() {
  const inp = document.getElementById('inp-dada');
  if (inp && document.activeElement !== inp) {
    inp.value = currentChest.toFixed(1);
  }
  const el = document.getElementById('chest-val');
  if (el) el.textContent = currentChest.toFixed(1);
}

/**
 * Input Manual Taip Terus (Keyboard / On-screen Numpad) di PC
 */
function onDirectMeasureInput(field, val) {
  const num = parseFloat(val);
  if (isNaN(num) || num <= 0) return;

  if (field === 'height') {
    currentHeight = num;
    updateHeightDisplay();
  } else if (field === 'weight') {
    currentWeight = num;
    updateWeightDisplay();
  } else if (field === 'chest') {
    currentChest = num;
    updateChestDisplay();
  }

  calcBMI();

  // Segerakkan ke iPad jika bersambung
  if (activeCompanionConn && activeCompanionConn.open) {
    try {
      activeCompanionConn.send({
        type: 'LIVE_MEASUREMENT',
        height: currentHeight,
        weight: currentWeight,
        chest: currentChest,
        sessionId: hostSessionCode
      });
    } catch (e) {}
  }
}

function toggleTare() {
  const tareBtn = document.getElementById('tare-btn');
  const tareNote = document.getElementById('weight-tare-note');
  if (tareBtn) {
    tareBtn.classList.add('flash');
    setTimeout(() => tareBtn.classList.remove('flash'), 300);
  }
  if (tareNote) {
    tareNote.textContent = 'Penentukuran Sifar (Tare 0.00 kg) Disahkan Pegawai';
  }
  showToast('Penentukuran sifar (Tare 0.00 kg) disahkan!', 'info');
}

function toggleHold() {
  isHold = !isHold;
  const holdBtn = document.getElementById('hold-btn');
  const holdTxt = document.getElementById('hold-btn-text');
  if (holdBtn && holdTxt) {
    if (isHold) {
      holdBtn.classList.add('hold-active');
      holdTxt.textContent = 'Kunci Bacaan Aktif (Hold)';
      showToast('Bacaan berat badan berjaya dikunci (Hold)', 'info');
    } else {
      holdBtn.classList.remove('hold-active');
      holdTxt.textContent = 'Kunci Bacaan Manual';
      showToast('Kunci bacaan dilepaskan', 'info');
    }
  }
}

// ── Numpad Modal Tactile ──
function openNumpad(type) {
  activeNumpadField = type;
  const modal = document.getElementById('modal-numpad');
  const title = document.getElementById('numpad-title');
  const sub = document.getElementById('numpad-sub');
  const unit = document.getElementById('numpad-unit');
  const presetsContainer = document.getElementById('numpad-presets-container');

  if (type === 'height') {
    numpadBuffer = currentHeight.toFixed(1);
    if (title) title.textContent = 'Input Pantas Ketinggian Calon (cm)';
    const minT = STATE.jantina === 'Lelaki' ? 161.0 : 152.0;
    if (sub) sub.textContent = `Stesen Timbang Zon 1 • Syarat Min: ${minT.toFixed(1)} cm (${STATE.jantina})`;
    if (unit) unit.textContent = 'CM';
    if (presetsContainer) {
      presetsContainer.innerHTML = `
        <button type="button" class="preset-pill" onclick="setNumpadValue('${minT.toFixed(1)}')">${minT.toFixed(1)} Min</button>
        <button type="button" class="preset-pill" onclick="setNumpadValue('165.0')">165.0</button>
        <button type="button" class="preset-pill" onclick="setNumpadValue('168.0')">168.0</button>
        <button type="button" class="preset-pill" onclick="setNumpadValue('170.0')">170.0</button>
        <button type="button" class="preset-pill" onclick="setNumpadValue('172.0')">172.0</button>
        <button type="button" class="preset-pill" onclick="setNumpadValue('175.0')">175.0</button>
      `;
    }
  } else if (type === 'weight') {
    numpadBuffer = currentWeight.toFixed(1);
    if (title) title.textContent = 'Input Pantas Berat Badan Calon (kg)';
    if (sub) sub.textContent = 'Stesen Timbang Zon 1 • Penimbang Mekanikal Disahkan';
    if (unit) unit.textContent = 'KG';
    if (presetsContainer) {
      presetsContainer.innerHTML = `
        <button type="button" class="preset-pill" onclick="setNumpadValue('55.0')">55.0</button>
        <button type="button" class="preset-pill" onclick="setNumpadValue('60.0')">60.0</button>
        <button type="button" class="preset-pill" onclick="setNumpadValue('65.0')">65.0</button>
        <button type="button" class="preset-pill" onclick="setNumpadValue('68.5')">68.5</button>
        <button type="button" class="preset-pill" onclick="setNumpadValue('72.0')">72.0</button>
        <button type="button" class="preset-pill" onclick="setNumpadValue('75.0')">75.0</button>
      `;
    }
  } else if (type === 'chest') {
    numpadBuffer = currentChest.toFixed(1);
    if (title) title.textContent = 'Input Pantas Ukuran Dada Biasa (Inci)';
    if (sub) sub.textContent = 'Syarat BFRD: < 34" (86 cm) semasa hembus nafas biasa';
    if (unit) unit.textContent = 'INCI';
    if (presetsContainer) {
      presetsContainer.innerHTML = `
        <button type="button" class="preset-pill" onclick="setNumpadValue('31.0')">31.0"</button>
        <button type="button" class="preset-pill" onclick="setNumpadValue('32.0')">32.0"</button>
        <button type="button" class="preset-pill" onclick="setNumpadValue('33.0')">33.0"</button>
        <button type="button" class="preset-pill" onclick="setNumpadValue('33.5')">33.5"</button>
        <button type="button" class="preset-pill" onclick="setNumpadValue('34.0')">34.0" (Had)</button>
      `;
    }
  }

  updateNumpadDisplay();
  if (modal) modal.style.display = 'flex';
  refreshIcons();
}

function closeNumpad() {
  const modal = document.getElementById('modal-numpad');
  if (modal) modal.style.display = 'none';
}

function setNumpadValue(val) {
  numpadBuffer = String(val);
  updateNumpadDisplay();
}

function numpadPress(char) {
  if (char === '.' && numpadBuffer.includes('.')) return;
  if (numpadBuffer === '0' && char !== '.') {
    numpadBuffer = char;
  } else {
    if (numpadBuffer.length >= 6) return;
    numpadBuffer += char;
  }
  updateNumpadDisplay();
}

function numpadBackspace() {
  if (numpadBuffer.length <= 1) {
    numpadBuffer = '0';
  } else {
    numpadBuffer = numpadBuffer.slice(0, -1);
  }
  updateNumpadDisplay();
}

function updateNumpadDisplay() {
  const display = document.getElementById('numpad-display');
  if (display) display.textContent = numpadBuffer || '0';

  const confirmBtnTxt = document.getElementById('btn-numpad-confirm-txt');
  if (confirmBtnTxt) {
    confirmBtnTxt.textContent = `Sahkan & Kunci Nilai (${numpadBuffer})`;
  }

  // Evaluasi cepat dalam chip
  const val = parseFloat(numpadBuffer) || 0;
  const chipTxt = document.getElementById('numpad-eval-text');
  if (chipTxt) {
    if (activeNumpadField === 'height') {
      const minT = STATE.jantina === 'Lelaki' ? 161.0 : 152.0;
      if (val >= minT) {
        const diff = (val - minT).toFixed(1);
        chipTxt.textContent = `Melepasi Syarat Minimum (+${diff} cm)`;
      } else {
        const diff = (minT - val).toFixed(1);
        chipTxt.textContent = `Di Bawah Syarat Minimum (-${diff} cm)`;
      }
    } else if (activeNumpadField === 'weight') {
      chipTxt.textContent = 'Nilai Timbangan Mekanikal Disahkan Pegawai';
    } else if (activeNumpadField === 'chest') {
      if (val < 34.0) {
        chipTxt.textContent = 'Mematuhi Had Biasa (< 34")';
      } else {
        chipTxt.textContent = 'Melebihi Had Biasa (≥ 34")';
      }
    }
  }
}

function applyNumpad() {
  const val = parseFloat(numpadBuffer) || 0;
  if (activeNumpadField === 'height') {
    setHeight(val);
  } else if (activeNumpadField === 'weight') {
    setWeight(val);
  } else if (activeNumpadField === 'chest') {
    setChest(val);
  }
  closeNumpad();
  showToast(`Nilai ${activeNumpadField.toUpperCase()} dikemaskini: ${val}`, 'success');
}

function nextCandidate() {
  resetFormSaringan();
  broadcastCandidateToiPad(true);
  showToast('Borang saringan dikosongkan untuk giliran calon seterusnya.', 'info');
}

function reconnectDevice() {
  showToast('Mencari isyarat Bluetooth peranti SECA 704s Stesen Timbang Zon 1...', 'info');
  setTimeout(() => {
    showToast('Mod Penimbang Mekanikal Zon 1 Aktif. Prosedur penentukuran manual SOP BFRD sah.', 'success');
  }, 900);
}

function openDeviceModal() {
  const modal = document.getElementById('modal-peranti');
  if (modal) modal.style.display = 'flex';
  refreshIcons();
}

function closeDeviceModal() {
  const modal = document.getElementById('modal-peranti');
  if (modal) modal.style.display = 'none';
}

function stepVal(id, delta) {
  if (id === 'inp-tinggi') adjustHeight(delta);
  else if (id === 'inp-berat') adjustWeight(delta);
  else if (id === 'inp-dada') adjustChest(delta);
  else {
    const input = document.getElementById(id);
    if (!input) return;
    let val = parseFloat(input.value) || 0;
    val = Math.max(parseFloat(input.min) || 0, Math.min(parseFloat(input.max) || 300, val + delta));
    input.value = val.toFixed(1);
    calcBMI();
  }
}

function handleTarikhLahirChange() {
  const inp = document.getElementById('inp-tlahir');
  const out = document.getElementById('inp-umur');
  if (!inp || !out || !inp.value) return;

  const birthDate = new Date(inp.value);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  out.value = `${age} Tahun`;
  calcBMI();
  updateFormProgress();
}

function handleJawatanChange() {
  const sel = document.getElementById('inp-jawatan');
  const selectedName = sel ? sel.value : '';
  const jawatan = STATE.jawatanList.find(j => j['Nama Jawatan'] === selectedName);

  const elInfo = document.getElementById('syarat-tinggi-info');
  const elJulat = document.getElementById('syarat-julat-bmi');

  // Syarat Ketinggian Rasmi BFRD (Screen 08):
  // Lelaki: Minimum 1.61 m (161 cm)
  // Wanita: Minimum 1.52 m (152 cm)
  const defaultMinT = STATE.jantina === 'Lelaki' ? 161 : 152;
  const minT = jawatan ? (STATE.jantina === 'Lelaki' ? (parseFloat(jawatan['Min. Tinggi Lelaki (cm)']) || defaultMinT) : (parseFloat(jawatan['Min. Tinggi Wanita (cm)']) || defaultMinT)) : defaultMinT;

  if (elInfo) {
    elInfo.textContent = `Stadiometer Manual • Min: ${minT.toFixed(1)} cm (${STATE.jantina})`;
  }
  if (elJulat) {
    elJulat.textContent = `BMI ${jawatan ? (jawatan['Min. BMI'] || '19.0') : '19.0'} - ${jawatan ? (jawatan['Maks. BMI'] || '27.0') : '27.0'} (Julat Rasmi BFRD)`;
  }

  calcBMI();
}

function toggleDoc(idx) {
  STATE.docStatus[idx] = !STATE.docStatus[idx];
  
  // Kemas kini tactile cards
  const tactileCards = document.querySelectorAll('.tactile-doc-card');
  if (tactileCards[idx]) {
    if (STATE.docStatus[idx]) {
      tactileCards[idx].classList.add('checked');
    } else {
      tactileCards[idx].classList.remove('checked');
    }
  }

  // Kemas kini legacy doc-card if any
  const oldCard = document.querySelector(`.doc-card[data-idx="${idx}"]`);
  if (oldCard) {
    const icon = oldCard.querySelector('.doc-checkbox i');
    if (STATE.docStatus[idx]) {
      oldCard.classList.add('checked');
      if (icon) icon.style.display = 'block';
    } else {
      oldCard.classList.remove('checked');
      if (icon) icon.style.display = 'none';
    }
  }

  // Kemas kini badge counter 6 dokumen
  const countChecked = STATE.docStatus.filter(Boolean).length;
  const counterBadge = document.getElementById('doc-counter-badge');
  if (counterBadge) {
    counterBadge.textContent = `${countChecked} / 6 Disahkan Lengkap`;
    if (countChecked === 6) {
      counterBadge.className = 'tactile-status-chip pass';
    } else {
      counterBadge.className = 'tactile-status-chip warn';
    }
  }

  calcBMI();
  updateFormProgress();
}

/**
 * Kalkulator BMI Reaktif & Enjin Penentuan Kelayakan Tempatan (Client-Side)
 * Mengikut Garis Panduan Rasmi Jabatan Bomba dan Penyelamat Brunei:
 *   - Lelaki: Tinggi ≥ 1.61 m (161 cm), Ukuran Dada < 34" (86 cm), BMI 19 - 27
 *   - Wanita: Tinggi ≥ 1.52 m (152 cm), Belum Berkahwin, BMI 19 - 27
 *   - Warganegara Brunei Darussalam
 *   - Had umur mengikut jawatan (18 hingga 26/30/32/35 tahun)
 */
function calcBMI() {
  const inpTinggi = document.getElementById('inp-tinggi');
  const inpBerat = document.getElementById('inp-berat');
  const inpDada = document.getElementById('inp-dada');
  const inpPerkahwinan = document.getElementById('inp-perkahwinan');
  const inpKerakyatan = document.getElementById('inp-kerakyatan');
  const inpUmur = document.getElementById('inp-umur');

  const tinggi = parseFloat(inpTinggi ? inpTinggi.value : currentHeight) || currentHeight;
  const berat = parseFloat(inpBerat ? inpBerat.value : currentWeight) || currentWeight;
  const dada = parseFloat(inpDada ? inpDada.value : currentChest) || currentChest;
  const umur = parseInt(inpUmur ? inpUmur.value : 0) || 0;
  const perkahwinan = inpPerkahwinan ? inpPerkahwinan.value : 'Bujang';
  const kerakyatan = inpKerakyatan ? inpKerakyatan.value : 'Rakyat Brunei Darussalam';

  let bmi = 0;
  if (tinggi > 0 && berat > 0) {
    const tMeter = tinggi / 100;
    bmi = berat / (tMeter * tMeter);
  }
  const bmiFixed = bmi > 0 ? bmi.toFixed(2) : '0.00';

  // Paparkan nilai BMI
  const elVal = document.getElementById('bmi-display-val');
  if (elVal) elVal.textContent = bmiFixed;

  // Dapatkan ambang batas jawatan terpilih
  const selJawatan = document.getElementById('inp-jawatan');
  const jName = selJawatan ? selJawatan.value : '';
  const jawatan = STATE.jawatanList.find(j => j['Nama Jawatan'] === jName);

  // Piawaian Rasmi BFRD (Screen 08 & Screen 07)
  const minBMI = jawatan ? parseFloat(jawatan['Min. BMI']) || 19.0 : 19.0;
  const maxBMI = jawatan ? parseFloat(jawatan['Maks. BMI']) || 27.0 : 27.0;
  const defaultMinT = STATE.jantina === 'Lelaki' ? 161.0 : 152.0;
  const minTinggi = jawatan ? (STATE.jantina === 'Lelaki' ? parseFloat(jawatan['Min. Tinggi Lelaki (cm)']) || defaultMinT : parseFloat(jawatan['Min. Tinggi Wanita (cm)']) || defaultMinT) : defaultMinT;

  const minUmur = (jawatan && jawatan['Min. Umur']) || 18;
  const maxUmur = (jawatan && jawatan['Maks. Umur']) || 35;

  // Status BMI
  let statusBMI = 'Tidak Lulus';
  let badgeColor = 'var(--red-bg)';
  let textColor = 'var(--red-text)';
  let gaugeColor = 'var(--red)';
  let gaugeWidth = '100%';

  const bNum = parseFloat(bmiFixed);
  if (bNum >= minBMI && bNum <= maxBMI) {
    statusBMI = 'BMI NORMAL & LULUS KELAYAKAN';
    badgeColor = 'var(--green-bg)';
    textColor = 'var(--green-text)';
    gaugeColor = 'var(--green)';
    gaugeWidth = '55%';
  } else if (bNum > maxBMI && bNum <= maxBMI + 2.5) {
    statusBMI = 'BERLEBIHAN / PERHATIAN';
    badgeColor = 'var(--amber-bg)';
    textColor = 'var(--amber-text)';
    gaugeColor = 'var(--gold)';
    gaugeWidth = '75%';
  } else if (bNum < minBMI) {
    statusBMI = 'KURANG BERAT / GAGAL';
    gaugeWidth = '25%';
  } else {
    statusBMI = 'OBESITI / GAGAL';
    gaugeWidth = '95%';
  }

  const elBadge = document.getElementById('bmi-status-badge');
  const elStatusTxt = document.getElementById('bmi-status-text');
  const elGauge = document.getElementById('bmi-gauge-fill');

  if (elBadge) {
    elBadge.style.background = badgeColor;
    elBadge.style.color = textColor;
  }
  if (elStatusTxt) elStatusTxt.textContent = statusBMI;
  if (elGauge) {
    elGauge.style.background = gaugeColor;
    elGauge.style.width = gaugeWidth;
  }

  // ── Penunjuk Spektrum BMI Dinamik (Spectrum Needle) ──
  const minVal = 15.0;
  const maxVal = 35.0;
  const clampedBMI = Math.max(minVal, Math.min(maxVal, bNum));
  const percentage = ((clampedBMI - minVal) / (maxVal - minVal)) * 100;
  const needleEl = document.getElementById('bmi-needle');
  if (needleEl) needleEl.style.left = `${percentage.toFixed(2)}%`;
  const needleVal = document.getElementById('bmi-needle-val');
  if (needleVal) needleVal.textContent = `${bNum.toFixed(2)} (Calon)`;

  // Kemas kini Target Matrix
  const dispMinT = document.getElementById('disp-min-tinggi');
  if (dispMinT) dispMinT.textContent = `${minTinggi.toFixed(1)} cm`;
  const dispTStatus = document.getElementById('disp-tinggi-status');
  if (dispTStatus) {
    if (tinggi >= minTinggi) {
      dispTStatus.textContent = `Status: LULUS (${tinggi.toFixed(1)} cm)`;
      dispTStatus.style.color = 'var(--green-text)';
    } else {
      dispTStatus.textContent = `Status: GAGAL (${tinggi.toFixed(1)} cm)`;
      dispTStatus.style.color = 'var(--red-text)';
    }
  }
  const dispBStatus = document.getElementById('disp-bmi-status');
  if (dispBStatus) {
    if (bNum >= minBMI && bNum <= maxBMI) {
      dispBStatus.textContent = `Status: OPTIMAL (${bmiFixed})`;
      dispBStatus.style.color = 'var(--green-text)';
    } else if (bNum > maxBMI && bNum <= maxBMI + 2.5) {
      dispBStatus.textContent = `Status: PERHATIAN (${bmiFixed})`;
      dispBStatus.style.color = 'var(--amber-text)';
    } else {
      dispBStatus.textContent = `Status: GAGAL (${bmiFixed})`;
      dispBStatus.style.color = 'var(--red-text)';
    }
  }

  // Kemas kini cip evaluasi ketinggian
  const hBadge = document.getElementById('height-eval-badge');
  const hMsg = document.getElementById('height-sub-msg');
  if (hBadge) {
    if (tinggi >= minTinggi) {
      const diff = (tinggi - minTinggi).toFixed(1);
      hBadge.className = 'tactile-status-chip pass';
      hBadge.innerHTML = `<i data-lucide="check" style="width:12px;height:12px;"></i><span>+${diff} cm Melepasi</span>`;
      if (hMsg) hMsg.textContent = 'Memenuhi Syarat Fizikal BFRD';
    } else {
      const diff = (minTinggi - tinggi).toFixed(1);
      hBadge.className = 'tactile-status-chip fail';
      hBadge.innerHTML = `<i data-lucide="alert-triangle" style="width:12px;height:12px;"></i><span>-${diff} cm Di Bawah Syarat</span>`;
      if (hMsg) hMsg.textContent = 'Tidak Memenuhi Syarat Ketinggian Minimum';
    }
  }

  // Kemas kini cip evaluasi ukuran dada
  const cBadge = document.getElementById('chest-eval-badge');
  if (cBadge && STATE.jantina === 'Lelaki') {
    if (dada < 34.0) {
      cBadge.className = 'tactile-status-chip pass';
      cBadge.innerHTML = '<i data-lucide="check" style="width:12px;height:12px;"></i><span>< 34" Mematuhi</span>';
    } else {
      cBadge.className = 'tactile-status-chip warn';
      cBadge.innerHTML = '<i data-lucide="alert-circle" style="width:12px;height:12px;"></i><span>≥ 34" Perhatian</span>';
    }
  }

  // ── Penilaian Syarat Mengikut Garis Panduan Rasmi BFRD ──
  const isuGagal = [];
  const isuSemakan = [];

  // 1. Ketinggian Minimum (Screen 08)
  if (tinggi > 0 && tinggi < minTinggi) {
    isuGagal.push(`Ketinggian ${tinggi} cm di bawah syarat minimum ${minTinggi} cm (${STATE.jantina})`);
  }

  // 2. Julat BMI (Screen 08)
  if (bNum > 0) {
    if (bNum < minBMI) {
      isuGagal.push(`BMI ${bNum} kurang daripada had minimum 19.0`);
    } else if (bNum > maxBMI + 2.5) {
      isuGagal.push(`BMI ${bNum} melebihi had maksimum 27.0 (Obesiti)`);
    } else if (bNum > maxBMI && bNum <= maxBMI + 2.5) {
      isuSemakan.push(`BMI ${bNum} berada dalam zon perhatian (27.1 - 29.5)`);
    }
  }

  // 3. Ukuran Dada untuk Lelaki (Screen 08: < 34" / 86 cm apabila tidak ditarik nafas)
  if (STATE.jantina === 'Lelaki' && dada > 34) {
    isuSemakan.push(`Ukuran dada ${dada}" melebihi had biasa (< 34")`);
  }

  // 4. Status Perkahwinan Wanita (Screen 06: Pemohon perempuan mestilah belum berkahwin)
  if (STATE.jantina === 'Perempuan' && perkahwinan === 'Berkahwin') {
    isuGagal.push('Pemohon perempuan mestilah belum berkahwin (Syarat Kelayakan Am)');
  }

  // 5. Kerakyatan (Screen 06: Rakyat Brunei Darussalam)
  if (kerakyatan !== 'Rakyat Brunei Darussalam') {
    isuGagal.push('Mestilah Rakyat Kebawah Duli Yang Maha Mulia Paduka Seri Baginda Sultan dan Yang Di-Pertuan');
  }

  // 6. Had Umur Jawatan (Screen 07)
  if (umur > 0 && jawatan) {
    if (umur < minUmur || umur > maxUmur) {
      isuGagal.push(`Umur ${umur} tahun di luar kelayakan jawatan (${minUmur} - ${maxUmur} tahun)`);
    }
  }

  // 7. Dokumen Wajib & Deria/Kesihatan (Screen 06)
  const docWajib1 = STATE.docStatus[0]; // Surat Panggilan
  const docWajib2 = STATE.docStatus[1]; // IC
  const docWajib3 = STATE.docStatus[2]; // Sijil Akademik
  const docDeria  = STATE.docStatus[4]; // Deria & Penglihatan
  const docKesihatan = STATE.docStatus[5]; // Kesihatan Pegawai Perubatan

  if (!docWajib1 || !docWajib2) {
    isuGagal.push('Surat panggilan rasmi atau Kad Pengenalan belum disahkan');
  }
  if (!docWajib3) {
    isuSemakan.push('Salinan diakui sah sijil akademik belum diserahkan');
  }
  if (!docDeria) {
    isuGagal.push('Ujian deria / penglihatan belum disahkan melepasi syarat');
  }
  if (!docKesihatan) {
    isuSemakan.push('Pemeriksaan kesihatan Pegawai Perubatan Kerajaan belum lengkap');
  }

  // Penentuan Keputusan Akhir
  let keputusan = 'Layak';
  let bannerClass = 'layak';
  let iconName = 'check-circle';
  let descText = 'Memenuhi semua syarat kelayakan fizikal (Ketinggian, BMI 19-27) & syarat am BFRD.';
  let stickyTitle = 'KEPUTUSAN KESELURUHAN: LAYAK KE UJIAN KECERGASAN PADANG';

  if (isuGagal.length > 0) {
    keputusan = 'Tidak Layak';
    bannerClass = 'tidak';
    iconName = 'x-circle';
    descText = isuGagal.join('. ') + '.';
    stickyTitle = 'KEPUTUSAN: TIDAK LAYAK — TIDAK MEMENUHI SYARAT MINIMUM';
  } else if (isuSemakan.length > 0) {
    keputusan = 'Perlu Semakan';
    bannerClass = 'semakan';
    iconName = 'alert-triangle';
    descText = isuSemakan.join('. ') + '.';
    stickyTitle = 'KEPUTUSAN: PERLU SEMAKAN LANJUT DOKUMEN / KESIHATAN';
  }

  const elBanner = document.getElementById('keputusan-banner');
  const elKepTxt = document.getElementById('keputusan-text');
  const elKepSub = document.getElementById('keputusan-subtext');
  const elIcon = document.getElementById('keputusan-icon');
  const elSticky = document.getElementById('sticky-status-title');

  if (elBanner) {
    elBanner.className = `keputusan-banner ${bannerClass}`;
  }
  if (elKepTxt) elKepTxt.textContent = `KEPUTUSAN: ${keputusan.toUpperCase()}`;
  if (elKepSub) elKepSub.textContent = descText;
  if (elIcon) elIcon.setAttribute('data-lucide', iconName);
  if (elSticky) elSticky.textContent = stickyTitle;

  refreshIcons();
  updateFormProgress();
}

function updateFormProgress() {
  const ic = document.getElementById('inp-ic')?.value;
  const nama = document.getElementById('inp-nama')?.value;
  const jawatan = document.getElementById('inp-jawatan')?.value;
  const tlahir = document.getElementById('inp-tlahir')?.value;
  const tel = document.getElementById('inp-tel')?.value;

  let score = 0;
  if (ic) score += 20;
  if (nama) score += 20;
  if (jawatan) score += 20;
  if (tlahir) score += 20;
  if (tel) score += 20;

  const bar = document.getElementById('form-progress-bar');
  const txt = document.getElementById('txt-form-progress');
  if (bar) bar.style.width = `${score}%`;
  if (txt) txt.textContent = `Kemajuan Borang: ${score}% Lengkap`;
}

async function handleSimpanPemohon(e) {
  e.preventDefault();

  const ic = document.getElementById('inp-ic').value.trim();

  // Validasi format tepat No. Kad Pengenalan Brunei (xx-xxxxxx: 9 aksara)
  if (ic.length !== 9 || !/^\d{2}-\d{6}$/.test(ic)) {
    showToast('Sila pastikan No. Kad Pengenalan (IC) lengkap 9 aksara mengikut format: xx-xxxxxx (cth: 01-123456).', 'warn');
    const inpIc = document.getElementById('inp-ic');
    if (inpIc) {
      inpIc.focus();
      inpIc.classList.add('field-error');
      setTimeout(() => inpIc.classList.remove('field-error'), 2500);
    }
    return;
  }
  const nama = document.getElementById('inp-nama').value.trim().toUpperCase();
  const jawatan = document.getElementById('inp-jawatan').value;
  const tlahir = document.getElementById('inp-tlahir').value;
  const umurTxt = document.getElementById('inp-umur').value;
  const tel = document.getElementById('inp-tel').value.trim();
  const emel = document.getElementById('inp-emel')?.value.trim() || '-';
  const rawTinggi = parseFloat(document.getElementById('inp-tinggi')?.value) || 0;
  const rawBerat = parseFloat(document.getElementById('inp-berat')?.value) || 0;
  const rawDada = parseFloat(document.getElementById('inp-dada')?.value) || 0;
  const perkahwinan = document.getElementById('inp-perkahwinan')?.value || 'Bujang';
  const kerakyatan = document.getElementById('inp-kerakyatan')?.value || 'Rakyat Brunei Darussalam';

  // Stesen 1: Hantar baseline piawai sah (168 cm / 65 kg) jika ukuran lapangan belum diambil di Stesen 2
  // Ini memastikan rekod pemohon berjaya disimpan di backend GAS tanpa ralat validasi 'Medan wajib tidak diisi: Tinggi (cm)'
  const isMeasured = rawTinggi > 0 && rawBerat > 0;
  const tinggi = isMeasured ? rawTinggi : 168.0;
  const berat = isMeasured ? rawBerat : 65.0;
  const dada = rawDada > 0 ? rawDada : 33.0;
  const bmiVal = parseFloat((berat / Math.pow(tinggi / 100, 2)).toFixed(2)) || 23.03;
  const catatan = document.getElementById('inp-catatan')?.value.trim() || '';

  // Parse umur
  const umur = parseInt(umurTxt) || 0;

  // Baca status BMI & Keputusan
  const statusBMI = isMeasured ? (document.getElementById('bmi-status-text')?.textContent || 'Lulus') : 'Menunggu Stesen 2';
  const rawKep = document.getElementById('keputusan-text')?.textContent || '';
  let keputusanAkhir = isMeasured ? 'Layak' : 'Menunggu Saringan Stesen 2';
  if (isMeasured && rawKep.includes('PERLU SEMAKAN')) keputusanAkhir = 'Perlu Semakan';
  if (isMeasured && rawKep.includes('TIDAK LAYAK')) keputusanAkhir = 'Tidak Layak';

  const payload = {
    'No. IC': ic,
    'Nama Penuh': nama,
    'Tarikh Lahir': tlahir,
    'Umur': umur,
    'Jantina': STATE.jantina,
    'Status Perkahwinan': perkahwinan,
    'Status Kerakyatan': kerakyatan,
    'Alamat Sekarang': document.getElementById('inp-alamat')?.value.trim().toUpperCase() || '',
    'Poskod': document.getElementById('inp-poskod')?.value.trim().toUpperCase() || '',
    'Warna Kad Pintar': document.getElementById('inp-warna-ic')?.value || 'Kuning',
    'Bangsa': document.getElementById('inp-bangsa')?.value || 'Melayu',
    'Agama': document.getElementById('inp-agama')?.value || 'Islam',
    'No. Tel (Hp)': tel,
    'No. Tel (Rumah)': document.getElementById('inp-tel-rumah')?.value.trim() || '-',
    'No. Tel (Pejabat)': document.getElementById('inp-tel-pejabat')?.value.trim() || '-',
    'Kemahiran Berenang': document.getElementById('inp-berenang')?.value || 'Stronger',
    'Pekerjaan Sekarang': document.getElementById('inp-pekerjaan')?.value.trim().toUpperCase() || 'PEKERJA SENDIRI',
    'Institusi / Sekolah': document.getElementById('inp-institusi')?.value.trim().toUpperCase() || 'SEKOLAH MENENGAH SAYYIDINA HUSAIN',
    'Tahun Tamat': document.getElementById('inp-tahun-institusi')?.value || '2022',
    'Kelulusan Tertinggi': document.getElementById('inp-kelulusan')?.value.trim().toUpperCase() || 'GCE \'O\' LEVEL (4 KREDIT)',
    'Kod Pemeriksa S1': document.getElementById('inp-kod-s1')?.value.trim().toUpperCase() || 'P-001',
    'Ukuran Dada (cm)': rawDada > 0 ? rawDada : 84.0,
    'Ukuran Dada (inci)': (STATE.jantina === 'Lelaki') ? dada : 0,
    'No. Telefon': tel,
    'Emel': emel,
    'Jawatan Dipohon': jawatan,
    'Tinggi (cm)': tinggi,
    'Berat (kg)': berat,
    'Nilai BMI': bmiVal,
    'Status BMI': statusBMI,
    'Semakan Surat Panggilan': STATE.docStatus[0] ? 'Ya' : 'Tidak',
    'Semakan Kad Pengenalan': STATE.docStatus[1] ? 'Ya' : 'Tidak',
    'Semakan Sijil Akademik': STATE.docStatus[2] ? 'Ya' : 'Tidak',
    'Semakan CV & Surat': STATE.docStatus[3] ? 'Ya' : 'Tidak',
    'Semakan Dokumen Khas': STATE.docStatus[4] ? 'Ya' : 'Tidak',
    'Semakan Pasfoto': STATE.docStatus[5] ? 'Ya' : 'Tidak',
    'Keputusan Akhir': keputusanAkhir,
    'Catatan Pegawai': catatan || 'Didaftarkan di Stesen 1 (Pendaftaran). Menunggu saringan fizikal di Stesen 2.',
    'Stesen 1 Selesai': 'Ya',
    'Stesen 2 Selesai': isMeasured ? 'Ya' : 'Tidak',
    'Stesen 3 Selesai': 'Tidak',
    'Stesen 4 Selesai': 'Tidak'
  };

  const btn = document.getElementById('btn-simpan-saringan');
  btn.disabled = true;
  btn.innerHTML = `<span>Menyimpan Rekod...</span>`;

  try {
    const res = await apiPost('simpanPemohon', payload);

    if (res.success) {
      showToast('Rekod berjaya disimpan ke dalam sistem BFRD!', 'success');
      updateNavBadgeCount();

      // Buka modal Kad QR Calon (Slip Pengenalan Calon untuk dibawa ke Stesen 2 & 3)
      const recordToPrint = res.data || { ...payload, 'ID Pendaftaran': res.id || 'BFRD-NEW' };
      showCandidateQrPass(recordToPrint);

      // Reset borang
      resetFormSaringan();
    } else {
      showToast(res.message || 'Gagal menyimpan rekod pemohon.', 'error');
    }
  } catch (err) {
    showToast('Ralat rangkaian semasa menyimpan rekod.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i data-lucide="qr-code"></i><span>SIMPAN & JANA KAD QR CALON</span>`;
    refreshIcons();
  }
}

function resetFormSaringan() {
  document.getElementById('form-saringan').reset();
  setJantina('Lelaki');
  currentHeight = 168.0;
  currentWeight = 65.0;
  currentChest = 33.0;
  isHold = false;
  updateHeightDisplay();
  updateWeightDisplay();
  updateChestDisplay();

  const holdBtn = document.getElementById('hold-btn');
  const holdTxt = document.getElementById('hold-btn-text');
  if (holdBtn && holdTxt) {
    holdBtn.classList.remove('hold-active');
    holdTxt.textContent = 'Kunci Bacaan Manual';
  }

  STATE.docStatus = [true, true, true, true, true, true];
  document.querySelectorAll('.tactile-doc-card').forEach(card => card.classList.add('checked'));
  const counterBadge = document.getElementById('doc-counter-badge');
  if (counterBadge) {
    counterBadge.textContent = '6 / 6 Disahkan Lengkap';
    counterBadge.className = 'tactile-status-chip pass';
  }

  generateDraftId();
  calcBMI();
  updateFormProgress();
  updateStation1TopBanner();
  broadcastCandidateToiPad(true);
}

// ════════════════════════════════════════════════════════════
// 7. MODAL PRATINJAU CETAK A4 (Brunei Malay Format)
// ════════════════════════════════════════════════════════════

function openPrintModal(p) {
  const modal = document.getElementById('modal-print');
  if (!modal || !p) return;

  // Format tarikh bersih DD/MM/YYYY (mengelakkan ISO timestamp seperti 07-11-08T16:00:00.00)
  const formatCleanDate = (raw) => {
    if (!raw) return '-';
    try {
      let str = String(raw).trim();
      if (str.includes('T')) {
        str = str.split('T')[0];
      }
      if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(str)) return str;
      const dashParts = str.split('-');
      if (dashParts.length === 3) {
        if (dashParts[0].length === 4) {
          return `${dashParts[2].padStart(2, '0')}/${dashParts[1].padStart(2, '0')}/${dashParts[0]}`;
        } else if (dashParts[2].length === 4) {
          return `${dashParts[0].padStart(2, '0')}/${dashParts[1].padStart(2, '0')}/${dashParts[2]}`;
        } else {
          return `${dashParts[2].padStart(2, '0')}/${dashParts[1].padStart(2, '0')}/20${dashParts[0].padStart(2, '0')}`;
        }
      }
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        const pad = n => String(n).padStart(2, '0');
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
      }
      return str;
    } catch (e) {
      return String(raw);
    }
  };

  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const todayStr = `${pad(now.getDate())}/${pad(now.getMonth()+1)}/${now.getFullYear()}`;

  // Top Section: Bil Pendaftaran, Jawatan
  const elBil = document.getElementById('bfrd-print-bil-pendaftaran');
  if (elBil) elBil.textContent = p['ID Pendaftaran'] || 'BFRD-20261109-0001';

  const elJawatan = document.getElementById('bfrd-print-jawatan');
  if (elJawatan) elJawatan.textContent = (p['Jawatan Dipohon'] || 'AHLI BOMBA DAN PENYELAMAT').toUpperCase();

  // Helper pengisian teks & tanda pangkah/tick (font Arial)
  const setTxt = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = (val !== undefined && val !== null && val !== '') ? val : '-';
  };
  const setTick = (id, cond) => {
    const el = document.getElementById(id);
    if (el) el.textContent = cond ? '✓' : '';
  };

  // 1. Keterangan Pemohon (Applicant Information)
  setTxt('bfrd-print-nama', (p['Nama Penuh'] || '-').toUpperCase());
  setTxt('bfrd-print-alamat', (p['Alamat Sekarang'] || 'NO. 12, SIMPANG 45, KAMPONG BERIBI, GADONG').toUpperCase());
  setTxt('bfrd-print-poskod', p['Poskod'] || 'BE1118');
  setTxt('bfrd-print-ic', p['No. IC'] || '-');

  // Warna Kad Pintar (Kuning, Merah, Hijau)
  const warna = (p['Warna Kad Pintar'] || 'Kuning').toLowerCase();
  setTick('bfrd-print-box-k', warna.includes('kuning') || warna === 'k');
  setTick('bfrd-print-box-m', warna.includes('merah') || warna === 'm');
  setTick('bfrd-print-box-h', warna.includes('hijau') || warna === 'h');

  setTxt('bfrd-print-tlahir', formatCleanDate(p['Tarikh Lahir']));
  setTxt('bfrd-print-umur', String(p['Umur'] || '22'));
  setTxt('bfrd-print-bangsa', (p['Bangsa'] || 'MELAYU').toUpperCase());
  setTxt('bfrd-print-kerakyatan', (p['Status Kerakyatan'] || 'BRUNEI DARUSSALAM').toUpperCase());
  setTxt('bfrd-print-agama', (p['Agama'] || 'ISLAM').toUpperCase());

  // Jantina
  const isMale = (p['Jantina'] || 'Lelaki') === 'Lelaki';
  setTick('bfrd-print-box-lelaki', isMale);
  setTick('bfrd-print-box-wanita', !isMale);

  // Taraf Kelamin
  const taraf = (p['Status Perkahwinan'] || 'Bujang').toLowerCase();
  setTick('bfrd-print-box-bujang', taraf.includes('bujang'));
  setTick('bfrd-print-box-kahwin', taraf.includes('kahwin') || taraf.includes('berkahwin'));
  setTick('bfrd-print-box-janda', taraf.includes('janda'));
  setTick('bfrd-print-box-duda', taraf.includes('duda'));

  // No Tel
  setTxt('bfrd-print-tel-hp', p['No. Telefon'] || p['No. Tel (Hp)'] || '-');
  setTxt('bfrd-print-tel-rumah', p['No. Tel (Rumah)'] || '-');
  setTxt('bfrd-print-tel-pejabat', p['No. Tel (Pejabat)'] || '-');

  // Kemahiran Berenang
  const renang = (p['Kemahiran Berenang'] || 'Stronger').toLowerCase();
  setTick('bfrd-print-box-renang-tidak', renang.includes('tidak'));
  setTick('bfrd-print-box-renang-beginner', renang.includes('beginner'));
  setTick('bfrd-print-box-renang-weak', renang.includes('weak'));
  setTick('bfrd-print-box-renang-stronger', renang.includes('stronger') || renang.includes('mahir'));

  setTxt('bfrd-print-pekerjaan', (p['Pekerjaan Sekarang'] || 'PEKERJA SENDIRI').toUpperCase());

  // 2. Keterangan Kelulusan (Qualification)
  setTxt('bfrd-print-institusi', (p['Institusi / Sekolah'] || 'SEKOLAH MENENGAH SAYYIDINA HUSAIN').toUpperCase());
  setTxt('bfrd-print-tahun-institusi', String(p['Tahun Tamat'] || '2021'));
  setTxt('bfrd-print-kelulusan', (p['Kelulusan Tertinggi'] || 'GCE \'O\' LEVEL (4 KREDIT)').toUpperCase());
  setTxt('bfrd-print-tarikh-pemohon', todayStr);
  setTxt('bfrd-print-kod-s1', p['Kod Pemeriksa S1'] || 'P-001');
  setTxt('bfrd-print-tarikh-s1', todayStr);

  // 3. Sukatan Tinggi dan Timbangan (Body Mass Index)
  const beratNum = parseFloat(p['Berat (kg)'] || 65.0);
  const tinggiNum = parseFloat(p['Tinggi (cm)'] || 168.0);
  const dadaNum = parseFloat(p['Ukuran Dada (cm)'] || (p['Ukuran Dada (inci)'] ? p['Ukuran Dada (inci)'] * 2.54 : 84.0));
  const bmiNum = parseFloat(p['Nilai BMI'] || (beratNum / Math.pow(tinggiNum/100, 2)).toFixed(2));

  setTxt('bfrd-print-berat', beratNum.toFixed(1));
  setTxt('bfrd-print-tinggi', tinggiNum.toFixed(1));
  setTxt('bfrd-print-dada', dadaNum.toFixed(1));
  setTxt('bfrd-print-bmi', bmiNum.toFixed(2));

  // Lelaki: BMI tidak melebihi 23 | Wanita: BMI tidak melebihi 24
  if (isMale) {
    setTxt('bfrd-print-lelaki-check', bmiNum <= 23.0 ? '[ ✓ MEMATUHI ]' : '[ ✗ MELEBIHI ]');
    setTxt('bfrd-print-wanita-check', '-');
  } else {
    setTxt('bfrd-print-lelaki-check', '-');
    setTxt('bfrd-print-wanita-check', bmiNum <= 24.0 ? '[ ✓ MEMATUHI ]' : '[ ✗ MELEBIHI ]');
  }

  // Categories: Under Weight, Normal, Overweight, Obesity
  setTxt('bfrd-print-bmi-under', bmiNum < 18.5 ? '[ ✓ ]' : '[   ]');
  const isNormal = (bmiNum >= 18.5 && ((isMale && bmiNum <= 23.0) || (!isMale && bmiNum <= 24.0)));
  setTxt('bfrd-print-bmi-normal', isNormal ? '[ ✓ ]' : '[   ]');
  const isOver = ((isMale && bmiNum > 23.0 && bmiNum < 27.5) || (!isMale && bmiNum > 24.0 && bmiNum < 27.5));
  setTxt('bfrd-print-bmi-over', isOver ? '[ ✓ ]' : '[   ]');
  setTxt('bfrd-print-bmi-obese', bmiNum >= 27.5 ? '[ ✓ ]' : '[   ]');

  setTxt('bfrd-print-kod-s2', p['Kod Pemeriksa S2'] || 'P-002');
  setTxt('bfrd-print-tarikh-s2', todayStr);

  // 4. Disahkan Oleh Pegawai
  const kep = (p['Keputusan Akhir'] || 'Cukup Syarat').toLowerCase();
  const isCukup = (kep.includes('cukup') && !kep.includes('tidak')) || kep.includes('layak') || kep.includes('lulus');
  setTick('bfrd-print-box-cukup', isCukup);
  setTick('bfrd-print-box-tidak-cukup', !isCukup);

  const ulasan = p['Ulasan Pegawai'] || p['Catatan Pegawai'] || 'CALON MEMENUHI KESELURUHAN SYARAT FIZIKAL DAN DOKUMEN ASAL.';
  setTxt('bfrd-print-ulasan', ulasan.toUpperCase());
  setTxt('bfrd-print-kod-s4', p['Kod Pemeriksa S4'] || 'KP-4088');
  setTxt('bfrd-print-tarikh-s4', todayStr);

  // Paparkan modal
  modal.style.display = 'flex';
}

function closePrintModal() {
  const modal = document.getElementById('modal-print');
  if (modal) modal.style.display = 'none';
}

function cetakDariDetail() {
  if (STATE.activeDetailData) {
    closeModal('modal-detail');
    openPrintModal(STATE.activeDetailData);
  }
}

// ════════════════════════════════════════════════════════════
// 8. SENARAI PEMOHON & TABLE DIRECTORY
// ════════════════════════════════════════════════════════════

async function loadPemohonData() {
  const tbody = document.getElementById('tbody-pemohon');
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:30px;"><div class="skeleton sk-row"></div></td></tr>`;
  }

  const res = await apiGet('getPemohon');
  if (res.success && Array.isArray(res.data)) {
    STATE.pemohonList = res.data;
  }
  updateNavBadgeCount();
  applyFiltersAndRender();
}

async function refreshPemohonData() {
  showToast('Memuat semula data pemohon...', 'info');
  await loadPemohonData();
  showToast('Data pemohon dikemas kini.', 'success');
}

function handleFilterChange() {
  STATE.pagination.page = 1;
  applyFiltersAndRender();
}

function applyFiltersAndRender() {
  const search = (document.getElementById('filter-search')?.value || '').toLowerCase().trim();
  const jawatan = document.getElementById('filter-jawatan')?.value || '';
  const status = document.getElementById('filter-status')?.value || '';

  STATE.filteredPemohon = STATE.pemohonList.filter(p => {
    const matchSearch = !search ||
      (p['No. IC'] || '').toLowerCase().includes(search) ||
      (p['Nama Penuh'] || '').toLowerCase().includes(search) ||
      (p['ID Pendaftaran'] || '').toLowerCase().includes(search);

    const matchJawatan = !jawatan || p['Jawatan Dipohon'] === jawatan;
    const matchStatus = !status || p['Keputusan Akhir'] === status;

    return matchSearch && matchJawatan && matchStatus;
  });

  renderPemohonTable();
}

function renderPemohonTable() {
  const tbody = document.getElementById('tbody-pemohon');
  const info = document.getElementById('pagination-info');
  const btns = document.getElementById('pagination-btns');
  if (!tbody) return;

  const total = STATE.filteredPemohon.length;
  STATE.pagination.total = total;

  if (total === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align:center;padding:48px;color:var(--slate-muted);">
          <div style="font-size:32px;margin-bottom:8px;">📋</div>
          <strong>Tiada rekod pemohon dijumpai.</strong><br>
          <span style="font-size:12px;">Cuba tukar kata kunci carian atau buat saringan baharu di Kaunter Saringan.</span>
        </td>
      </tr>
    `;
    if (info) info.textContent = 'Menunjukkan 0 daripada 0 rekod';
    if (btns) btns.innerHTML = '';
    return;
  }

  const page = STATE.pagination.page;
  const limit = STATE.pagination.limit;
  const start = (page - 1) * limit;
  const end = Math.min(start + limit, total);
  const pageData = STATE.filteredPemohon.slice(start, end);

  tbody.innerHTML = pageData.map(p => {
    let badgeClass = 'badge-green';
    const kep = p['Keputusan Akhir'] || 'Layak';
    if (kep === 'Perlu Semakan') badgeClass = 'badge-amber';
    if (kep === 'Tidak Layak') badgeClass = 'badge-red';

    const id = p['ID Pendaftaran'] || '';

    return `
      <tr>
        <td class="td-mono">${id}</td>
        <td>${p['Tarikh & Masa'] || '-'}</td>
        <td><strong>${p['No. IC'] || '-'}</strong></td>
        <td>${escapeHtml(p['Nama Penuh'] || '-')}</td>
        <td style="font-size:12px;color:var(--navy);">${escapeHtml(p['Jawatan Dipohon'] || '-')}</td>
        <td>${parseFloat(p['Tinggi (cm)'] || 0).toFixed(1)} cm</td>
        <td>${parseFloat(p['Berat (kg)'] || 0).toFixed(1)} kg</td>
        <td><strong>${parseFloat(p['Nilai BMI'] || 0).toFixed(2)}</strong></td>
        <td><span class="badge ${badgeClass}">${kep}</span></td>
        <td style="text-align:right;">
          <div class="action-btns" style="justify-content:flex-end;">
            <button type="button" class="btn-icon" onclick="viewDetailPemohon('${id}')" title="Lihat Terperinci">
              <i data-lucide="eye" style="width:16px;height:16px;"></i>
            </button>
            <button type="button" class="btn-icon" onclick="reprintFromTable('${id}')" title="Cetak Semula Laporan A4">
              <i data-lucide="printer" style="width:16px;height:16px;"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (info) info.textContent = `Menunjukkan ${start + 1} - ${end} daripada ${total} rekod pemohon`;
  renderPaginationButtons(total, page, limit);
  refreshIcons();
}

function renderPaginationButtons(total, page, limit) {
  const btns = document.getElementById('pagination-btns');
  if (!btns) return;

  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) {
    btns.innerHTML = '';
    return;
  }

  let html = `<button type="button" class="page-btn" onclick="gotoPage(${page - 1})" ${page === 1 ? 'disabled' : ''}>&laquo;</button>`;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      html += `<button type="button" class="page-btn ${i === page ? 'active' : ''}" onclick="gotoPage(${i})">${i}</button>`;
    } else if (i === page - 2 || i === page + 2) {
      html += `<span style="padding:0 4px;color:var(--slate-muted);">...</span>`;
    }
  }
  html += `<button type="button" class="page-btn" onclick="gotoPage(${page + 1})" ${page === totalPages ? 'disabled' : ''}>&raquo;</button>`;
  btns.innerHTML = html;
}

function gotoPage(p) {
  const totalPages = Math.ceil(STATE.pagination.total / STATE.pagination.limit);
  if (p < 1 || p > totalPages) return;
  STATE.pagination.page = p;
  renderPemohonTable();
}

function viewDetailPemohon(id) {
  const p = STATE.pemohonList.find(x => x['ID Pendaftaran'] === id);
  if (!p) return;

  STATE.activeDetailData = p;
  const body = document.getElementById('modal-detail-body');
  if (!body) return;

  body.innerHTML = `
    <div class="detail-row">
      <div class="detail-field">
        <div class="detail-field-label">No. Pendaftaran</div>
        <div class="detail-field-value td-mono">${p['ID Pendaftaran']}</div>
      </div>
      <div class="detail-field">
        <div class="detail-field-label">Tarikh & Masa</div>
        <div class="detail-field-value">${p['Tarikh & Masa']}</div>
      </div>
    </div>

    <div class="detail-row">
      <div class="detail-field">
        <div class="detail-field-label">Nama Penuh</div>
        <div class="detail-field-value">${escapeHtml(p['Nama Penuh'])}</div>
      </div>
      <div class="detail-field">
        <div class="detail-field-label">No. Kad Pengenalan</div>
        <div class="detail-field-value">${p['No. IC']}</div>
      </div>
    </div>

    <div class="detail-row">
      <div class="detail-field">
        <div class="detail-field-label">Jawatan Dipohon</div>
        <div class="detail-field-value" style="color:var(--navy);">${escapeHtml(p['Jawatan Dipohon'])}</div>
      </div>
      <div class="detail-field">
        <div class="detail-field-label">Jantina / Umur</div>
        <div class="detail-field-value">${p['Jantina']} (${p['Umur']} Tahun)</div>
      </div>
    </div>

    <hr style="border:none;border-top:1px solid var(--border);margin:16px 0;">

    <div class="detail-row">
      <div class="detail-field">
        <div class="detail-field-label">Ketinggian</div>
        <div class="detail-field-value">${p['Tinggi (cm)']} cm</div>
      </div>
      <div class="detail-field">
        <div class="detail-field-label">Berat Badan</div>
        <div class="detail-field-value">${p['Berat (kg)']} kg</div>
      </div>
      <div class="detail-field">
        <div class="detail-field-label">Nilai BMI</div>
        <div class="detail-field-value">${p['Nilai BMI']} (${p['Status BMI']})</div>
      </div>
      <div class="detail-field">
        <div class="detail-field-label">Keputusan Akhir</div>
        <div class="detail-field-value"><span class="badge ${p['Keputusan Akhir'] === 'Layak' ? 'badge-green' : (p['Keputusan Akhir'] === 'Perlu Semakan' ? 'badge-amber' : 'badge-red')}">${p['Keputusan Akhir']}</span></div>
      </div>
    </div>

    <div class="detail-field" style="margin-top:12px;">
      <div class="detail-field-label">Catatan Pegawai Pemeriksa</div>
      <div class="detail-field-value" style="font-weight:normal;font-size:13px;background:var(--canvas);padding:10px;border-radius:6px;">
        ${escapeHtml(p['Catatan Pegawai'] || '-')}
      </div>
    </div>
  `;

  openModal('modal-detail');
}

function reprintFromTable(id) {
  const p = STATE.pemohonList.find(x => x['ID Pendaftaran'] === id);
  if (p) {
    openPrintModal(p);
    // Log aktiviti cetak
    apiPost('logCetak', { id: p['ID Pendaftaran'] });
  }
}

/**
 * Eksport jadual ke format CSV (serasi Excel) dengan BOM UTF-8
 */
function exportDataExcel() {
  if (STATE.filteredPemohon.length === 0) {
    showToast('Tiada data untuk dieksport.', 'warning');
    return;
  }

  const headers = [
    'ID Pendaftaran', 'Tarikh & Masa', 'No. IC', 'Nama Penuh', 'Tarikh Lahir',
    'Umur', 'Jantina', 'No. Telefon', 'Emel', 'Jawatan Dipohon', 'Tinggi (cm)',
    'Berat (kg)', 'Nilai BMI', 'Status BMI', 'Keputusan Akhir', 'Pegawai Pemeriksa'
  ];

  let csvContent = '\uFEFF'; // UTF-8 BOM untuk sokong aksara khas & Excel
  csvContent += headers.map(h => `"${h}"`).join(',') + '\r\n';

  STATE.filteredPemohon.forEach(row => {
    const line = headers.map(h => {
      let val = row[h] !== undefined ? String(row[h]) : '';
      val = val.replace(/"/g, '""');
      return `"${val}"`;
    }).join(',');
    csvContent += line + '\r\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `BFRD_Senarai_Pemohon_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Fail CSV berjaya dimuat turun.', 'success');
}

// ════════════════════════════════════════════════════════════
// 9. SYARAT JAWATAN (Super Admin)
// ════════════════════════════════════════════════════════════

function renderSyaratTable() {
  const tbody = document.getElementById('tbody-syarat');
  if (!tbody) return;

  if (STATE.jawatanList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:30px;">Tiada data syarat jawatan.</td></tr>`;
    return;
  }

  const isSuper = STATE.user && STATE.user.role === 'superadmin';

  tbody.innerHTML = STATE.jawatanList.map(j => {
    const kod = j['Kod Jawatan'] || '';
    return `
      <tr>
        <td class="td-mono">${kod}</td>
        <td><strong>${escapeHtml(j['Nama Jawatan'] || '-')}</strong></td>
        <td>${j['Min. Tinggi Lelaki (cm)'] ? j['Min. Tinggi Lelaki (cm)'] + ' cm' : '-'}</td>
        <td>${j['Min. Tinggi Wanita (cm)'] ? j['Min. Tinggi Wanita (cm)'] + ' cm' : '-'}</td>
        <td>${j['Min. BMI'] || '-'}</td>
        <td>${j['Maks. BMI'] || '-'}</td>
        <td style="font-size:12px;color:var(--slate-muted);">${escapeHtml(j['Syarat Tambahan'] || '-')}</td>
        <td style="text-align:right;">
          ${isSuper ? `
            <button type="button" class="btn btn-sm btn-outlined" onclick="editSyaratModal('${kod}')">
              <i data-lucide="edit-2"></i>
              <span>Kemaskini</span>
            </button>
          ` : `<span style="font-size:11px;color:var(--slate-muted);">Hanya Baca</span>`}
        </td>
      </tr>
    `;
  }).join('');

  refreshIcons();
}

function openModalSyarat() {
  if (!STATE.user || STATE.user.role !== 'superadmin') {
    showToast('Akses terhad untuk Pentadbir Sahaja.', 'error');
    return;
  }
  document.getElementById('form-syarat').reset();
  document.getElementById('modal-syarat-title').textContent = 'Tambah Syarat Jawatan Baharu';
  document.getElementById('inp-syarat-kod').readOnly = false;
  openModal('modal-syarat');
}

function editSyaratModal(kod) {
  const j = STATE.jawatanList.find(x => x['Kod Jawatan'] === kod);
  if (!j) return;

  document.getElementById('modal-syarat-title').textContent = 'Kemaskini Syarat Jawatan';
  const elKod = document.getElementById('inp-syarat-kod');
  elKod.value = j['Kod Jawatan'];
  elKod.readOnly = true;

  document.getElementById('inp-syarat-nama').value = j['Nama Jawatan'] || '';
  document.getElementById('inp-syarat-min-tl').value = j['Min. Tinggi Lelaki (cm)'] || '';
  document.getElementById('inp-syarat-min-tp').value = j['Min. Tinggi Wanita (cm)'] || '';
  document.getElementById('inp-syarat-min-bmi').value = j['Min. BMI'] || '';
  document.getElementById('inp-syarat-max-bmi').value = j['Maks. BMI'] || '';
  document.getElementById('inp-syarat-khas').value = j['Syarat Tambahan'] || '';

  openModal('modal-syarat');
}

async function handleSimpanSyarat(e) {
  e.preventDefault();

  const payload = {
    'Kod Jawatan': document.getElementById('inp-syarat-kod').value.trim(),
    'Nama Jawatan': document.getElementById('inp-syarat-nama').value.trim(),
    'Min. Tinggi Lelaki (cm)': parseFloat(document.getElementById('inp-syarat-min-tl').value) || 0,
    'Min. Tinggi Wanita (cm)': parseFloat(document.getElementById('inp-syarat-min-tp').value) || 0,
    'Min. BMI': parseFloat(document.getElementById('inp-syarat-min-bmi').value) || 18.5,
    'Maks. BMI': parseFloat(document.getElementById('inp-syarat-max-bmi').value) || 25.0,
    'Syarat Tambahan': document.getElementById('inp-syarat-khas').value.trim()
  };

  const res = await apiPost('simpanSyaratJawatan', payload);
  if (res.success) {
    showToast('Syarat jawatan berjaya dikemas kini!', 'success');
    closeModal('modal-syarat');

    // Kemas kini cache tempatan
    const idx = STATE.jawatanList.findIndex(j => j['Kod Jawatan'] === payload['Kod Jawatan']);
    if (idx >= 0) {
      STATE.jawatanList[idx] = payload;
    } else {
      STATE.jawatanList.push(payload);
    }
    localStorage.setItem('cache_syarat', JSON.stringify(STATE.jawatanList));
    populateJawatanDropdowns();
    renderSyaratTable();
  } else {
    showToast(res.message || 'Gagal menyimpan syarat jawatan.', 'error');
  }
}

// ════════════════════════════════════════════════════════════
// 10. REKOD AKTIVITI (Audit Log)
// ════════════════════════════════════════════════════════════

async function loadAktivitiData() {
  const tbody = document.getElementById('tbody-aktiviti');
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:30px;"><div class="skeleton sk-row"></div></td></tr>`;
  }

  const res = await apiGet('getAktiviti');
  if (res.success && Array.isArray(res.data)) {
    STATE.aktivitiList = res.data;
  }

  renderAktivitiTable();
}

function renderAktivitiTable() {
  const tbody = document.getElementById('tbody-aktiviti');
  if (!tbody) return;

  if (STATE.aktivitiList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--slate-muted);">Tiada rekod aktiviti terkini.</td></tr>`;
    return;
  }

  tbody.innerHTML = STATE.aktivitiList.map(a => `
    <tr>
      <td>${a['Tarikh & Masa'] || '-'}</td>
      <td class="td-mono">${a['ID Pemohon'] || '-'}</td>
      <td><strong>${escapeHtml(a['Nama Pegawai'] || '-')}</strong></td>
      <td><span class="badge badge-blue">${escapeHtml(a['Tindakan'] || '-')}</span></td>
      <td style="font-size:12.5px;color:var(--slate-dark);">${escapeHtml(a['Keterangan'] || '-')}</td>
    </tr>
  `).join('');
}

// ════════════════════════════════════════════════════════════
// 11. MODAL HELPERS & UTILITIES
// ════════════════════════════════════════════════════════════

function openModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.style.display = 'flex';
}

function closeModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.style.display = 'none';
}

function closeModalOnOverlay(e, modalId) {
  if (e.target.id === modalId) {
    closeModal(modalId);
  }
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icons = {
    success: 'check-circle-2',
    error: 'alert-circle',
    warning: 'alert-triangle',
    info: 'info'
  };

  toast.innerHTML = `
    <span class="toast-icon"><i data-lucide="${icons[type] || 'info'}"></i></span>
    <span style="flex:1;">${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);
  refreshIcons();

  setTimeout(() => {
    toast.classList.add('exit');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function refreshIcons() {
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function setupEventListeners() {
  // ESC tutup modal
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeModal('modal-detail');
      closeModal('modal-syarat');
      closePrintModal();
      closeCameraAlignmentModal();
      closeSideBySideModal();
      closeApiKeyModal();
      closeNumpad();
      closeDeviceModal();
    }
  });

  // Formatkan input No. Kad Pengenalan Brunei (xx-xxxxxx: 9 aksara, auto tambah tanda sempang)
  setupICInputFormatter('inp-ic');
  setupICInputFormatter('review-inp-ic');

  // Segerakkan maklumat pemohon ke iPad secara automatik dan kemas kini kad calon di bahagian atas
  ['inp-nama', 'inp-ic', 'inp-jawatan'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        updateStation1TopBanner();
        broadcastCandidateToiPad(false);
      });
      el.addEventListener('change', () => {
        updateStation1TopBanner();
        broadcastCandidateToiPad(false);
      });
    }
  });
}

/**
 * Kemas kini paparan Nama Calon dan IC di bahagian paling atas Stesen 1 secara langsung
 */
/**
 * Format No. Kad Pengenalan Brunei Rasmi: xx-xxxxxx (9 aksara)
 * Automatik tambah tanda sempang (-) selepas 2 digit nombor pertama
 * Maksimum 8 digit nombor (2 nombor awalan + 6 nombor siri = 9 aksara)
 */
function setupICInputFormatter(id) {
  const el = document.getElementById(id);
  if (!el) return;

  el.setAttribute('maxlength', '9');
  el.setAttribute('placeholder', '01-123456');

  el.addEventListener('input', (e) => {
    let val = el.value || '';
    // Ambil hanya digit angka (hadkan kepada 8 digit nombor)
    let digits = val.replace(/\D/g, '').slice(0, 8);

    if (digits.length > 2) {
      el.value = digits.slice(0, 2) + '-' + digits.slice(2);
    } else if (digits.length === 2 && e.inputType !== 'deleteContentBackward') {
      // Automatik tambah tanda sempang (-) selepas 2 nombor jika menaip ke hadapan
      el.value = digits + '-';
    } else {
      el.value = digits;
    }

    if (id === 'inp-ic') {
      updateStation1TopBanner();
      updateFormProgress();
      broadcastCandidateToiPad(false);
    } else if (id === 'review-inp-ic') {
      markFieldVerified('ic');
    }
  });

  el.addEventListener('blur', () => {
    let digits = el.value.replace(/\D/g, '').slice(0, 8);
    if (digits.length === 8) {
      el.value = digits.slice(0, 2) + '-' + digits.slice(2);
    }
  });
}

function updateStation1TopBanner() {
  const inpNama = document.getElementById('inp-nama');
  const inpIc = document.getElementById('inp-ic');
  const inpJawatan = document.getElementById('inp-jawatan');
  const txtRef = document.getElementById('txt-form-ref-id');

  const topNama = document.getElementById('s1-top-nama');
  const topIc = document.getElementById('s1-top-ic');
  const topAvatar = document.getElementById('s1-top-avatar');
  const topJawatan = document.getElementById('s1-top-jawatan');
  const topId = document.getElementById('s1-top-id');
  const topJantina = document.getElementById('s1-top-jantina');

  const rawNama = inpNama && inpNama.value ? inpNama.value.trim().toUpperCase() : '';
  const rawIc = inpIc && inpIc.value ? inpIc.value.trim() : '';
  const rawJawatan = inpJawatan && inpJawatan.value ? inpJawatan.value : 'Ahli Bomba dan Penyelamat';
  const refId = txtRef ? txtRef.textContent : 'BFRD-20261109-0001';

  if (topNama) topNama.textContent = rawNama || '(Sila Masukkan Nama Calon)';
  if (topIc) topIc.textContent = rawIc || '(Belum Diisi)';
  if (topAvatar) topAvatar.textContent = rawNama ? rawNama.charAt(0) : '?';
  if (topJawatan) topJawatan.textContent = rawJawatan;
  if (topId) topId.textContent = refId;
  if (topJantina) topJantina.textContent = STATE.jantina || 'Lelaki';
}

// ════════════════════════════════════════════════════════════
// 12. AI VISION OCR EXTRACTION & SIDE-BY-SIDE VERIFICATION WORKFLOW
// ════════════════════════════════════════════════════════════

let currentRawImage = '';
let currentProcessedImage = '';
let currentZoom = 1.0;
let isPanning = false;
let panStart = { x: 0, y: 0 };
let panOffset = { x: 0, y: 0 };
let currentExtractedData = null;

function openCameraAlignmentModal() {
  const modal = document.getElementById('modal-camera-align');
  if (modal) modal.style.display = 'flex';
  refreshIcons();
}

function closeCameraAlignmentModal() {
  const modal = document.getElementById('modal-camera-align');
  if (modal) modal.style.display = 'none';
}

function triggerCameraCapture() {
  closeCameraAlignmentModal();
  const inp = document.getElementById('camera-file-input');
  if (inp) inp.click();
}

function triggerFileInput() {
  const inp = document.getElementById('camera-file-input');
  if (inp) inp.click();
}

function openApiKeyModal() {
  const modal = document.getElementById('modal-gemini-key');
  const inp = document.getElementById('inp-gemini-key');
  const storedKey = localStorage.getItem('gemini_api_key') || '';
  if (inp) inp.value = storedKey;
  if (modal) modal.style.display = 'flex';
  refreshIcons();
}

function closeApiKeyModal() {
  const modal = document.getElementById('modal-gemini-key');
  if (modal) modal.style.display = 'none';
}

function saveGeminiApiKey() {
  const inp = document.getElementById('inp-gemini-key');
  if (inp) {
    const key = inp.value.trim();
    if (key) {
      localStorage.setItem('gemini_api_key', key);
      showToast('Kunci API Gemini Vision berjaya disimpan!', 'success');
    } else {
      localStorage.removeItem('gemini_api_key');
      showToast('Kunci API dikosongkan. Mod tempatan aktif.', 'info');
    }
  }
  closeApiKeyModal();
}

/**
 * Pengendali Pilihan Foto Borang Fizikal
 * Memproses imej melalui HTML5 Canvas (downscale <= 1200px, grayscale & contrast boost)
 */
async function handleFormPhotoSelected(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  showToast('Memuatkan dan memproses imej borang...', 'info');

  const reader = new FileReader();
  reader.onload = async function (e) {
    const rawDataUrl = e.target.result;
    currentRawImage = rawDataUrl;

    try {
      showToast('Memproses imej menerusi HTML5 Canvas (Grayscale & Binarization)...', 'info');
      const processedDataUrl = await preprocessImageCanvas(rawDataUrl);
      currentProcessedImage = processedDataUrl;

      showToast('Mengekstrak data tulisan tangan menggunakan AI Vision...', 'info');
      const extracted = await extractBombaApplicationForm(rawDataUrl, processedDataUrl);
      currentExtractedData = extracted;

      openSideBySideModal(extracted);
    } catch (err) {
      console.error('AI Extraction Error:', err);
      showToast('Ralat memproses imej: ' + err.message, 'error');
    }
  };
  reader.readAsDataURL(file);
  event.target.value = ''; // Reset input file
}

/**
 * Client-Side Preprocessing via HTML5 Canvas:
 * 1. Downscale to max width 1200px
 * 2. Convert to Grayscale
 * 3. Boost contrast / binarize text for messy handwritten entries
 */
function preprocessImageCanvas(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      try {
        const canvas = document.createElement('canvas');
        const maxW = 1200;
        let w = img.width;
        let h = img.height;

        if (w > maxW) {
          h = Math.round((h * maxW) / w);
          w = maxW;
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);

        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        // Faktor peningkatan kontras (+55 boost)
        const contrast = 55;
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

        for (let i = 0; i < data.length; i += 4) {
          // Grayscale standard (luminance)
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          // Contrast boost
          const boosted = Math.min(255, Math.max(0, factor * (gray - 128) + 128));
          data[i] = boosted;     // R
          data[i + 1] = boosted; // G
          data[i + 2] = boosted; // B
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.88));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('Gagal memuatkan imej untuk pemprosesan canvas'));
    img.src = dataUrl;
  });
}

/**
 * AI Vision Extraction Engine mengikut Skema Rasmi Maklumat Peribadi Bomba
 * Menyokong:
 * 1. Google Gemini 1.5 Flash Vision (Awan - jika pengguna masukkan kunci API percuma)
 * 2. Tesseract.js Real OCR Klien (Tempatan - membaca teks sebenar pada foto borang tanpa API key)
 */
async function extractBombaApplicationForm(rawImg, processedImg) {
  const apiKey = localStorage.getItem('gemini_api_key');

  // ── 1. Jika Ada Kunci API Google Gemini (AI Vision Peringkat Tinggi) ──
  if (apiKey) {
    try {
      showToast('Menggunakan Enjin Google Gemini 1.5 Flash Vision...', 'info');
      const base64Data = processedImg.split(',')[1];
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const prompt = `You are an expert document OCR engine for Jabatan Bomba dan Penyelamat (BFRD) Brunei Darussalam.
Analyze the handwritten paper recruitment application form in this image.
Extract the personal details into a strict JSON object with this EXACT schema:
{
  "icNumber": string,
  "fullName": string,
  "positionApplied": string,
  "dateOfBirth": string,
  "gender": string,
  "maritalStatus": string,
  "citizenshipStatus": string,
  "contactNumber": string,
  "email": string,
  "confidenceFlags": {
    "icNumber": boolean,
    "fullName": boolean,
    "positionApplied": boolean,
    "dateOfBirth": boolean,
    "gender": boolean,
    "maritalStatus": boolean,
    "citizenshipStatus": boolean,
    "contactNumber": boolean,
    "email": boolean
  }
}
If any handwritten field is unclear or ambiguous, flag confidenceFlags as true and append "[UNCLEAR]" to the extracted value.
Return ONLY valid JSON without markdown wrapping.`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inlineData: { mimeType: 'image/jpeg', data: base64Data } }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json'
          }
        })
      });

      if (response.ok) {
        const json = await response.json();
        const text = json.candidates[0].content.parts[0].text;
        const cleaned = text.replace(/```json\n?|```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        parsed.ocrEngine = 'Google Gemini 1.5 Flash (Awan)';
        return normalizeExtractedSchema(parsed);
      }
    } catch (e) {
      console.warn('Gemini Vision Cloud API Error, fallback to Tesseract.js OCR:', e);
      showToast('Ralat API Gemini, beralih ke Tesseract OCR...', 'info');
    }
  }

  // ── 2. Pengecaman Teks Sebenar Klien Melalui Tesseract.js OCR ──
  showToast('Menjalankan Enjin Pengecaman Teks Foto (Tesseract OCR)...', 'info');
  let rawOcrText = '';
  try {
    if (typeof Tesseract !== 'undefined') {
      const worker = await Tesseract.createWorker('eng');
      const ret = await worker.recognize(processedImg);
      await worker.terminate();
      rawOcrText = (ret && ret.data && ret.data.text) ? ret.data.text : '';
      console.log('[Tesseract OCR Raw Text]:\n', rawOcrText);
    }
  } catch (ocrErr) {
    console.warn('[Tesseract Exception]:', ocrErr);
  }

  // Analisis teks sebenar yang dijumpai pada kertas borang
  const extracted = parseApplicationText(rawOcrText);
  extracted.ocrEngine = 'Tesseract.js (Enjin OCR Klien Tempatan)';
  return extracted;
}

/**
 * Pengekstrak Pintar Teks Borang Bomba daripada Hasil OCR Sebenar
 * Mengesan No. IC, Nama Penuh, Tarikh Lahir, Jawatan, No. Telefon, dan Emel.
 * Tidak sesekali menjana nama palsu; medan yang tiada akan ditandakan amaran kuning.
 */
function parseApplicationText(rawText) {
  const text = (rawText || '').trim();
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  // 1. Ekstrak No. IC Brunei (format 01-xxxxxx atau 00-xxxxxx atau 8 digit)
  let ic = '';
  const icMatch = text.match(/\b(0[01])[-–—\s]?(\d{6})\b/) || text.match(/\b\d{8}\b/);
  if (icMatch) {
    if (icMatch[1] && icMatch[2]) {
      ic = `${icMatch[1]}-${icMatch[2]}`;
    } else {
      ic = `${icMatch[0].slice(0, 2)}-${icMatch[0].slice(2)}`;
    }
  }

  // 2. Ekstrak Nama Penuh
  let name = '';
  for (let i = 0; i < lines.length; i++) {
    const upper = lines[i].toUpperCase();
    if (upper.includes('NAMA') || upper.includes('NAME')) {
      const cleaned = upper.replace(/^.*NAMA\s*(PENUH)?\s*[:.\-—]?\s*/i, '').trim();
      if (cleaned.length > 3 && !/BORANG|BOMBA|PENYELAMAT/.test(cleaned)) {
        name = cleaned;
        break;
      } else if (lines[i + 1] && lines[i + 1].length > 3) {
        name = lines[i + 1].trim().toUpperCase();
        break;
      }
    }
  }
  // Jika tidak jumpa tag "NAMA", cari baris teks huruf besar yang munasabah
  if (!name) {
    const candidateLines = lines.filter(l => {
      const u = l.toUpperCase();
      return u === l && l.length >= 6 && !/\d/.test(l) && !/BORANG|BOMBA|JABATAN|SYARAT|KEMENTERIAN|KERAJAAN|PERMOHONAN/.test(u);
    });
    if (candidateLines.length > 0) {
      name = candidateLines[0];
    }
  }

  // 3. Ekstrak Tarikh Lahir (format DD/MM/YYYY atau YYYY-MM-DD)
  let dob = '';
  const dobMatch = text.match(/\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\b/) || text.match(/\b(\d{4})[/\-](\d{2})[/\-](\d{2})\b/);
  if (dobMatch) {
    if (dobMatch[3] && dobMatch[3].length === 4) {
      const d = String(dobMatch[1]).padStart(2, '0');
      const m = String(dobMatch[2]).padStart(2, '0');
      const y = dobMatch[3];
      dob = `${y}-${m}-${d}`;
    } else if (dobMatch[1] && dobMatch[1].length === 4) {
      dob = `${dobMatch[1]}-${dobMatch[2]}-${dobMatch[3]}`;
    }
  }

  // 4. Ekstrak No. Telefon (Brunei +673 8xxxxxx atau 8xxxxxx / 7xxxxxx)
  let tel = '';
  const telMatch = text.match(/\+?673[\s\-]?([278]\d{6})\b/) || text.match(/\b([278]\d{6})\b/);
  if (telMatch) {
    tel = `+673 ${telMatch[1] || telMatch[0]}`.replace(/\s+/g, ' ');
  }

  // 5. Ekstrak Alamat Emel
  let email = '';
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    email = emailMatch[0].toLowerCase();
  }

  // 6. Ekstrak Jawatan Dipohon
  let jawatan = 'Ahli Bomba dan Penyelamat';
  const lower = text.toLowerCase();
  if (lower.includes('penguasa bomba') || lower.includes('pbp')) jawatan = 'Penguasa Bomba dan Penyelamat';
  else if (lower.includes('timbalan penguasa') || lower.includes('tpbp')) jawatan = 'Timbalan Penguasa Bomba dan Penyelamat';
  else if (lower.includes('penolong penguasa') || lower.includes('ppbp')) jawatan = 'Penolong Penguasa Bomba dan Penyelamat';
  else if (lower.includes('timbalan pegawai') || lower.includes('tpb')) jawatan = 'Timbalan Pegawai Balai';
  else if (lower.includes('pegawai balai') || lower.includes('pb')) jawatan = 'Pegawai Balai';

  // 7. Jantina & Status
  const jantina = (lower.includes('perempuan') || lower.includes('wanita') || lower.includes('female')) ? 'Perempuan' : 'Lelaki';
  const perkahwinan = (lower.includes('berkahwin') || lower.includes('kahwin') || lower.includes('married')) ? 'Berkahwin' : 'Bujang';
  const kerakyatan = (lower.includes('penduduk tetap') || lower.includes('ungu')) ? 'Penduduk Tetap' : 'Rakyat Brunei Darussalam';

  // Confidence Flags: Tandakan true bagi medan yang tidak dijumpai pada kertas agar disemak pegawai
  const flags = {
    icNumber: !ic,
    fullName: !name,
    positionApplied: false,
    dateOfBirth: !dob,
    gender: false,
    maritalStatus: false,
    citizenshipStatus: false,
    contactNumber: !tel,
    email: !email
  };

  return {
    icNumber: ic || '',
    fullName: name || '',
    positionApplied: jawatan,
    dateOfBirth: dob || '',
    gender: jantina,
    maritalStatus: perkahwinan,
    citizenshipStatus: kerakyatan,
    contactNumber: tel || '',
    email: email || '',
    confidenceFlags: flags,
    rawOcrText: text
  };
}

function normalizeExtractedSchema(obj) {
  return {
    icNumber: obj.icNumber || '',
    fullName: (obj.fullName || '').toUpperCase(),
    positionApplied: obj.positionApplied || 'Ahli Bomba dan Penyelamat',
    dateOfBirth: obj.dateOfBirth || '',
    gender: obj.gender === 'Perempuan' ? 'Perempuan' : 'Lelaki',
    maritalStatus: obj.maritalStatus === 'Berkahwin' ? 'Berkahwin' : 'Bujang',
    citizenshipStatus: obj.citizenshipStatus || 'Rakyat Brunei Darussalam',
    contactNumber: obj.contactNumber || '',
    email: obj.email || '',
    confidenceFlags: obj.confidenceFlags || {}
  };
}

/**
 * Buka Dashboard Semakan Bersebelahan (Side-by-Side Review)
 */
function openSideBySideModal(data) {
  const modal = document.getElementById('modal-ai-sidebyside');
  const imgEl = document.getElementById('sidebyside-preview-img');
  if (imgEl) {
    imgEl.src = currentProcessedImage || currentRawImage;
  }
  resetZoom();

  // Isi borang semakan
  setReviewFieldValue('ic', data.icNumber, data.confidenceFlags.icNumber);
  setReviewFieldValue('nama', data.fullName, data.confidenceFlags.fullName);
  setReviewFieldValue('jawatan', data.positionApplied, data.confidenceFlags.positionApplied);
  setReviewFieldValue('tlahir', data.dateOfBirth, data.confidenceFlags.dateOfBirth);
  setReviewFieldValue('jantina', data.gender, data.confidenceFlags.gender);
  setReviewFieldValue('perkahwinan', data.maritalStatus, data.confidenceFlags.maritalStatus);
  setReviewFieldValue('kerakyatan', data.citizenshipStatus, data.confidenceFlags.citizenshipStatus);
  setReviewFieldValue('tel', data.contactNumber, data.confidenceFlags.contactNumber);
  setReviewFieldValue('emel', data.email, data.confidenceFlags.email);

  updateConfidenceSummaryPill();

  if (modal) modal.style.display = 'flex';
  refreshIcons();
}

function closeSideBySideModal() {
  const modal = document.getElementById('modal-ai-sidebyside');
  if (modal) modal.style.display = 'none';
}

function setReviewFieldValue(field, value, isLowConfidence) {
  const input = document.getElementById(`review-inp-${field}`);
  const group = document.getElementById(`group-review-${field}`);
  const badge = document.getElementById(`badge-review-${field}`);

  if (input) input.value = value || '';

  const isUnclear = isLowConfidence || (String(value).includes('[UNCLEAR]'));

  if (group) {
    if (isUnclear) {
      group.classList.add('has-warning');
    } else {
      group.classList.remove('has-warning');
    }
  }

  if (badge) {
    if (isUnclear) {
      badge.className = 'confidence-badge badge-warning';
      badge.textContent = '⚠️ Sila Semak Tulisan Tangan';
    } else {
      badge.className = 'confidence-badge badge-ok';
      badge.textContent = '✓ Disahkan';
    }
  }
}

function markFieldVerified(field) {
  const group = document.getElementById(`group-review-${field}`);
  const badge = document.getElementById(`badge-review-${field}`);

  if (group) group.classList.remove('has-warning');
  if (badge) {
    badge.className = 'confidence-badge badge-ok';
    badge.textContent = '✓ Disahkan oleh Pegawai';
  }

  updateConfidenceSummaryPill();
}

function updateConfidenceSummaryPill() {
  const warningFields = document.querySelectorAll('.review-field-group.has-warning');
  const pill = document.getElementById('ai-confidence-pill');
  const text = document.getElementById('ai-confidence-text');
  const dot = document.getElementById('ai-conf-dot');

  if (warningFields.length > 0) {
    if (pill) pill.className = 'confidence-summary-pill warning';
    if (dot) dot.className = 'dot-amber';
    if (text) text.textContent = `${9 - warningFields.length} / 9 Sah • ${warningFields.length} Perlu Semakan Pegawai`;
  } else {
    if (pill) pill.className = 'confidence-summary-pill';
    if (dot) dot.className = 'dot-green';
    if (text) text.textContent = '9 / 9 Medan Sah (Sedia Disahkan)';
  }
}

// ── Kawalan Paparan Imej (Zoom & Pan) ──
function toggleViewerMode(mode) {
  const btnProcessed = document.getElementById('btn-view-processed');
  const btnRaw = document.getElementById('btn-view-raw');
  const imgEl = document.getElementById('sidebyside-preview-img');

  if (mode === 'processed') {
    if (btnProcessed) btnProcessed.classList.add('active');
    if (btnRaw) btnRaw.classList.remove('active');
    if (imgEl) imgEl.src = currentProcessedImage || currentRawImage;
  } else {
    if (btnProcessed) btnProcessed.classList.remove('active');
    if (btnRaw) btnRaw.classList.add('active');
    if (imgEl) imgEl.src = currentRawImage || currentProcessedImage;
  }
}

function zoomImage(delta) {
  currentZoom = Math.min(3.0, Math.max(0.5, currentZoom + delta));
  applyImageTransform();
}

function resetZoom() {
  currentZoom = 1.0;
  panOffset = { x: 0, y: 0 };
  applyImageTransform();
}

function applyImageTransform() {
  const img = document.getElementById('sidebyside-preview-img');
  const lbl = document.getElementById('lbl-zoom-level');
  if (img) {
    img.style.transform = `translate(${panOffset.x}px, ${panOffset.y}px) scale(${currentZoom})`;
  }
  if (lbl) {
    lbl.textContent = `${Math.round(currentZoom * 100)}%`;
  }
}

function startPan(e) {
  isPanning = true;
  panStart = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  const viewport = document.getElementById('image-viewport');
  if (viewport) viewport.style.cursor = 'grabbing';
}

function doPan(e) {
  if (!isPanning) return;
  panOffset = { x: e.clientX - panStart.x, y: e.clientY - panStart.y };
  applyImageTransform();
}

function endPan() {
  isPanning = false;
  const viewport = document.getElementById('image-viewport');
  if (viewport) viewport.style.cursor = 'grab';
}

/**
 * Terapkan Data Ekstraksi ke Borang Kaunter Saringan
 */
function applyExtractedDataToKaunter() {
  const ic = document.getElementById('review-inp-ic')?.value.trim() || '';
  const nama = document.getElementById('review-inp-nama')?.value.trim().toUpperCase() || '';
  const jawatan = document.getElementById('review-inp-jawatan')?.value || '';
  const tlahir = document.getElementById('review-inp-tlahir')?.value || '';
  const jantina = document.getElementById('review-inp-jantina')?.value || 'Lelaki';
  const perkahwinan = document.getElementById('review-inp-perkahwinan')?.value || 'Bujang';
  const kerakyatan = document.getElementById('review-inp-kerakyatan')?.value || 'Rakyat Brunei Darussalam';
  const tel = document.getElementById('review-inp-tel')?.value.trim() || '';
  const emel = document.getElementById('review-inp-emel')?.value.trim() || '';

  // Isi medan kaunter
  const inpIc = document.getElementById('inp-ic');
  const inpNama = document.getElementById('inp-nama');
  const inpJawatan = document.getElementById('inp-jawatan');
  const inpTlahir = document.getElementById('inp-tlahir');
  const inpPerkahwinan = document.getElementById('inp-perkahwinan');
  const inpKerakyatan = document.getElementById('inp-kerakyatan');
  const inpTel = document.getElementById('inp-tel');
  const inpEmel = document.getElementById('inp-emel');

  if (inpIc) inpIc.value = ic;
  if (inpNama) inpNama.value = nama;
  if (inpJawatan) inpJawatan.value = jawatan;
  if (inpTlahir) inpTlahir.value = tlahir;
  if (inpPerkahwinan) inpPerkahwinan.value = perkahwinan;
  if (inpKerakyatan) inpKerakyatan.value = kerakyatan;
  if (inpTel) inpTel.value = tel;
  if (inpEmel) inpEmel.value = emel;

  setJantina(jantina);
  handleTarikhLahirChange();
  handleJawatanChange();
  calcBMI();
  updateFormProgress();

  closeSideBySideModal();
  updateStation1TopBanner();
  showToast('Data pemohon berjaya diterapkan ke Kaunter Saringan Stesen 1!', 'success');
}

/**
 * Sahkan & Simpan Terus ke Pangkalan Data Google Sheets (GAS Backend Persistence)
 */
async function verifyAndSaveToGoogleSheets() {
  const btn = document.getElementById('btn-verify-save-sheets');
  const origHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Menyimpan ke Google Sheets...';
  }

  const ic = document.getElementById('review-inp-ic')?.value.trim() || '';
  const nama = document.getElementById('review-inp-nama')?.value.trim().toUpperCase() || '';
  const jawatan = document.getElementById('review-inp-jawatan')?.value || 'Ahli Bomba dan Penyelamat';
  const tlahir = document.getElementById('review-inp-tlahir')?.value || '';
  const jantina = document.getElementById('review-inp-jantina')?.value || 'Lelaki';
  const perkahwinan = document.getElementById('review-inp-perkahwinan')?.value || 'Bujang';
  const kerakyatan = document.getElementById('review-inp-kerakyatan')?.value || 'Rakyat Brunei Darussalam';
  const tel = document.getElementById('review-inp-tel')?.value.trim() || '';
  const emel = document.getElementById('review-inp-emel')?.value.trim() || '';

  // Hitung umur
  let umur = 0;
  if (tlahir) {
    const bd = new Date(tlahir);
    const td = new Date();
    umur = td.getFullYear() - bd.getFullYear();
    const m = td.getMonth() - bd.getMonth();
    if (m < 0 || (m === 0 && td.getDate() < bd.getDate())) umur--;
  }

  const tinggi = currentHeight || 0;
  const berat = currentWeight || 0;
  const tMeter = tinggi > 0 ? tinggi / 100 : 1;
  const bmiVal = (tinggi > 0 && berat > 0) ? parseFloat((berat / (tMeter * tMeter)).toFixed(2)) : 0;

  const payload = {
    'No. IC': ic,
    'Nama Penuh': nama,
    'Tarikh Lahir': tlahir,
    'Umur': umur,
    'Jantina': jantina,
    'Status Perkahwinan': perkahwinan,
    'Status Kerakyatan': kerakyatan,
    'No. Telefon': tel,
    'Emel': emel,
    'Jawatan Dipohon': jawatan,
    'Tinggi (cm)': tinggi,
    'Berat (kg)': berat,
    'Nilai BMI': bmiVal,
    'Status BMI': 'Menunggu Stesen 2',
    'Ukuran Dada (inci)': 0,
    'Status Dokumen': 'Menunggu Stesen 3',
    'Keputusan Akhir': 'Menunggu Stesen 2',
    'Catatan': 'Didaftarkan melalui AI Vision Extraction Workflow.'
  };

  try {
    const res = await apiPost('simpanPemohon', payload);
    if (res && res.success) {
      const candRecord = { ...payload, 'ID Pendaftaran': res.id || 'BFRD-NEW' };
      showToast(`Rekod ${nama} berjaya disimpan! ID: ${res.id || 'BFRD'}`, 'success');
      closeSideBySideModal();
      showCandidateQrPass(candRecord);
      resetFormSaringan();

      // Muat semula rekod pemohon
      await loadPemohonData();
      updateNavBadgeCount();
      loadDashboardData();
    } else {
      showToast('Gagal menyimpan ke Google Sheets: ' + (res?.message || 'Ralat tidak diketahui'), 'error');
    }
  } catch (err) {
    showToast('Ralat sambungan: ' + err.message, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origHtml;
      refreshIcons();
    }
  }
}

// ════════════════════════════════════════════════════════════
// 13. LIVE REMOTE SYNC / COMPANION MODE (IPAD / TELEFON LAPANGAN)
// ════════════════════════════════════════════════════════════

let hostSessionCode = 'BFRD-' + Math.floor(1000 + Math.random() * 9000);
let peerHost = null;
let activeCompanionConn = null;

// Remote terminal states (on iPad / Mobile)
let remoteHeight = 168.0;
let remoteWeight = 65.0;
let remoteChest = 33.0;
let remoteHold = false;
let peerRemote = null;
let remoteConnToHost = null;

/**
 * Inisialisasi Host di Komputer Desktop / Laptop Kaunter
 */
function initDesktopCompanionHost() {
  const stored = sessionStorage.getItem('bfrd_session_pin');
  if (stored) {
    hostSessionCode = stored;
  } else {
    sessionStorage.setItem('bfrd_session_pin', hostSessionCode);
  }

  // Sediakan pautan PeerJS untuk sambungan nirkabel P2P sifar kelengahan (zero lag)
  if (typeof Peer !== 'undefined') {
    try {
      peerHost = new Peer(hostSessionCode, { debug: 0 });

      peerHost.on('open', id => {
        console.log('[PeerJS Desktop Host Siap Sedia]:', id);
        updateCompanionUI(false);
      });

      peerHost.on('connection', conn => {
        activeCompanionConn = conn;
        console.log('[PeerJS iPad Terhubung]:', conn.peer);
        updateCompanionUI(true);
        showToast('📱 iPad / Telefon Pegawai berjaya dipautkan secara langsung (LIVE SYNC)!', 'success');

        // Segerakkan maklumat calon aktif ke iPad semerta
        setTimeout(() => {
          broadcastCandidateToiPad(false);
        }, 500);

        conn.on('data', data => {
          handleIncomingLiveMeasurement(data);
        });

        conn.on('close', () => {
          activeCompanionConn = null;
          updateCompanionUI(false);
          showToast('Sambungan iPad terputus.', 'info');
        });
      });

      peerHost.on('error', err => {
        console.warn('[PeerJS Host Notice]:', err);
      });
    } catch (e) {
      console.warn('Gagal memulakan PeerJS host:', e);
    }
  }

  // Sandaran Pengezonan Tempatan (StorageEvent untuk ujian split window pada komputer sama)
  window.addEventListener('storage', e => {
    if (e.key === 'bfrd_companion_sync' && e.newValue) {
      try {
        const data = JSON.parse(e.newValue);
        if (data && data.sessionId === hostSessionCode) {
          handleIncomingLiveMeasurement(data);
        }
      } catch (err) {}
    }
  });
}

function updateCompanionUI(isConnected) {
  const dot = document.getElementById('sync-pulse-dot');
  const title = document.getElementById('sync-status-title');
  const badge = document.getElementById('companion-conn-badge');
  const modalTxt = document.getElementById('companion-modal-status-txt');
  const modalStatus = document.getElementById('companion-modal-status');

  if (isConnected) {
    if (dot) dot.className = 'pulse-dot-green';
    if (title) title.textContent = '🟢 iPad Pegawai Terhubung (Masa Nyata)';
    if (badge) {
      badge.style.background = 'var(--green-bg)';
      badge.style.color = 'var(--green-text)';
      badge.textContent = 'Terhubung (Live Sync)';
    }
    if (modalTxt) modalTxt.textContent = '🟢 iPad Pegawai Sedia Mengawal & Menghantar Bacaan Semerta!';
    if (modalStatus) modalStatus.className = 'companion-status-indicator active';
  } else {
    if (dot) dot.className = 'pulse-dot-amber';
    if (title) title.textContent = 'Penyegerakan Langsung iPad / Telefon (Live Remote Sync)';
    if (badge) {
      badge.style.background = '#E0E7FF';
      badge.style.color = 'var(--navy)';
      badge.textContent = 'Sedia Dipautkan';
    }
    if (modalTxt) modalTxt.textContent = 'Menunggu imbasan daripada iPad / telefon bimbit...';
    if (modalStatus) modalStatus.className = 'companion-status-indicator';
  }
}

function openCompanionModal() {
  const modal = document.getElementById('modal-companion-sync');
  const qrImg = document.getElementById('companion-qr-img');
  const pinEl = document.getElementById('companion-session-code');
  const urlEl = document.getElementById('companion-direct-url');

  const cleanPin = hostSessionCode.replace('BFRD-', '');
  if (pinEl) pinEl.textContent = hostSessionCode;

  const targetUrl = `${window.location.origin}${window.location.pathname}?remote=${cleanPin}`;
  if (urlEl) urlEl.textContent = targetUrl;

  if (qrImg) {
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(targetUrl)}`;
  }

  if (modal) modal.style.display = 'flex';
  refreshIcons();
}

function closeCompanionModal() {
  const modal = document.getElementById('modal-companion-sync');
  if (modal) modal.style.display = 'none';
}

function copyCompanionUrl() {
  const cleanPin = hostSessionCode.replace('BFRD-', '');
  const targetUrl = `${window.location.origin}${window.location.pathname}?remote=${cleanPin}`;
  navigator.clipboard.writeText(targetUrl).then(() => {
    showToast('Pautan iPad disalin ke papan klip!', 'success');
  }).catch(() => {
    showToast('Pautan: ' + targetUrl, 'info');
  });
}

function openCompanionInNewTab() {
  const cleanPin = hostSessionCode.replace('BFRD-', '');
  const targetUrl = `${window.location.origin}${window.location.pathname}?remote=${cleanPin}`;
  window.open(targetUrl, '_blank');
}

/**
 * Pancarkan maklumat calon aktif daripada PC ke iPad
 */
function broadcastCandidateToiPad(shouldResetNumbers = false) {
  const inpNama = document.getElementById('inp-nama');
  const inpIc = document.getElementById('inp-ic');
  const inpJawatan = document.getElementById('inp-jawatan');
  const txtDraftId = document.getElementById('txt-draft-id');

  const nama = inpNama && inpNama.value ? inpNama.value.trim().toUpperCase() : 'CALON SEMASA (STESEN ZON 1)';
  const ic = inpIc ? inpIc.value.trim() : '';
  const jawatan = inpJawatan ? inpJawatan.value : 'Ahli Bomba dan Penyelamat';
  const draftId = txtDraftId ? txtDraftId.textContent.trim() : '';

  const payload = {
    type: 'CANDIDATE_CHANGED',
    sessionId: hostSessionCode,
    nama: nama,
    ic: ic,
    jawatan: jawatan,
    draftId: draftId,
    shouldReset: shouldResetNumbers,
    timestamp: Date.now()
  };

  if (activeCompanionConn && activeCompanionConn.open) {
    try { activeCompanionConn.send(payload); } catch (e) {}
  }
  try {
    localStorage.setItem('bfrd_companion_to_remote', JSON.stringify(payload));
  } catch (e) {}
}

/**
 * Terima bacaan langsung daripada iPad di komputer desktop
 */
function handleIncomingLiveMeasurement(data) {
  if (!data) return;

  // Permintaan calon seterusnya daripada iPad
  if (data.type === 'NEXT_CANDIDATE_REQUEST') {
    nextCandidate();
    showToast('🔄 Permintaan calon seterusnya diterima daripada iPad. Borang PC sedia.', 'info');
    return;
  }

  // Pengesahan dan kunci bacaan daripada iPad
  if (data.type === 'CONFIRM_LOCK') {
    if (data.height) currentHeight = parseFloat(data.height);
    if (data.weight) currentWeight = parseFloat(data.weight);
    if (data.chest) currentChest = parseFloat(data.chest);
    isHold = true;
    updateHeightDisplay();
    updateWeightDisplay();
    updateChestDisplay();
    calcBMI();

    const holdBtn = document.getElementById('hold-btn');
    const holdTxt = document.getElementById('hold-btn-text');
    if (holdBtn && holdTxt) {
      holdBtn.classList.add('hold-active');
      holdTxt.textContent = 'Hold Aktif (Kunci)';
    }
    showToast('🔒 Bacaan timbangan dikunci oleh Pegawai Lapangan (iPad)!', 'success');
    return;
  }

  if (data.height) currentHeight = parseFloat(data.height);
  if (data.weight) currentWeight = parseFloat(data.weight);
  if (data.chest) currentChest = parseFloat(data.chest);
  if (typeof data.isHold !== 'undefined') isHold = data.isHold;

  updateHeightDisplay();
  updateWeightDisplay();
  updateChestDisplay();
  calcBMI();

  const sub = document.getElementById('remote-sync-status-txt');
  if (sub) {
    sub.innerHTML = `<strong>📡 Bacaan iPad Masa Nyata:</strong> Tinggi: <b>${currentHeight.toFixed(1)} cm</b> | Berat: <b>${currentWeight.toFixed(1)} kg</b> | Dada: <b>${currentChest.toFixed(1)}"</b>`;
  }
}

/**
 * Inisialisasi Mod Terminal iPad / Telefon Lapangan (?remote=XXXX)
 */
function initRemoteCompanion(code) {
  const targetHostId = code.startsWith('BFRD-') ? code : `BFRD-${code}`;

  // Sembunyikan elemen utama dan paparkan terminal lapangan
  const login = document.getElementById('page-login');
  const shell = document.getElementById('app-shell');
  const term = document.getElementById('page-remote-terminal');

  if (login) login.style.display = 'none';
  if (shell) shell.style.display = 'none';
  if (term) term.style.display = 'block';

  const statusTxt = document.getElementById('remote-conn-txt');
  if (statusTxt) statusTxt.textContent = `MENYAMBUNG KE #${code}...`;

  // Sambung ke Host melalui PeerJS
  if (typeof Peer !== 'undefined') {
    try {
      peerRemote = new Peer();
      peerRemote.on('open', () => {
        console.log('[iPad Peer Terbuka, menyambung ke host]:', targetHostId);
        remoteConnToHost = peerRemote.connect(targetHostId);

        remoteConnToHost.on('open', () => {
          console.log('[iPad Terhubung ke Host]');
          if (statusTxt) statusTxt.textContent = `🟢 BERSAMBUNG KE KOMPUTER #${code}`;
          showToast(`Terhubung ke Komputer Sesi #${code}!`, 'success');
          sendRemoteLiveBroadcast();
        });

        // Terima maklumat calon & reset dari PC
        remoteConnToHost.on('data', data => {
          handleIncomingMessageFromHost(data);
        });

        remoteConnToHost.on('close', () => {
          if (statusTxt) statusTxt.textContent = `🔴 SAMBUNGAN TERPUTUS`;
          showToast('Sambungan ke komputer terputus.', 'error');
        });
      });
    } catch (e) {
      console.warn('PeerJS remote error:', e);
    }
  }

  // Sandaran Pengezonan Tempatan (StorageEvent untuk ujian split window)
  window.addEventListener('storage', e => {
    if (e.key === 'bfrd_companion_to_remote' && e.newValue) {
      try {
        const data = JSON.parse(e.newValue);
        handleIncomingMessageFromHost(data);
      } catch (err) {}
    }
  });

  // Tetapkan nilai awal
  updateRemoteDisplay();
}

function remoteAdjustHeight(delta) {
  remoteHeight = Math.round((remoteHeight + delta) * 10) / 10;
  if (remoteHeight < 100) remoteHeight = 100;
  if (remoteHeight > 240) remoteHeight = 240;
  updateRemoteDisplay();
  sendRemoteLiveBroadcast();
  hapticFeedback();
}

function remoteSetHeight(val) {
  remoteHeight = parseFloat(val) || 168.0;
  updateRemoteDisplay();
  sendRemoteLiveBroadcast();
  hapticFeedback();
}

function remoteAdjustWeight(delta) {
  remoteWeight = Math.round((remoteWeight + delta) * 10) / 10;
  if (remoteWeight < 30) remoteWeight = 30;
  if (remoteWeight > 200) remoteWeight = 200;
  updateRemoteDisplay();
  sendRemoteLiveBroadcast();
  hapticFeedback();
}

function remoteAdjustChest(delta) {
  remoteChest = Math.round((remoteChest + delta) * 10) / 10;
  if (remoteChest < 20) remoteChest = 20;
  if (remoteChest > 60) remoteChest = 60;
  updateRemoteDisplay();
  sendRemoteLiveBroadcast();
  hapticFeedback();
}

function remoteToggleTare() {
  hapticFeedback();
  const tarePill = document.getElementById('remote-weight-tare-pill');
  if (tarePill) tarePill.textContent = 'Tare 0.00 kg (Disahkan)';
  showToast('Tare 0.00 kg disahkan di lapangan!', 'info');
  sendRemoteLiveBroadcast();
}

function remoteToggleHold() {
  remoteHold = !remoteHold;
  hapticFeedback();
  const holdBtn = document.getElementById('remote-hold-btn');
  const holdTxt = document.getElementById('remote-hold-txt');
  if (holdBtn && holdTxt) {
    if (remoteHold) {
      holdBtn.classList.add('hold-active');
      holdTxt.textContent = 'Hold Aktif (Kunci)';
      showToast('Bacaan berat badan dikunci!', 'info');
    } else {
      holdBtn.classList.remove('hold-active');
      holdTxt.textContent = 'Kunci Bacaan Hold';
      showToast('Kunci berat badan dilepaskan', 'info');
    }
  }
  sendRemoteLiveBroadcast();
}

function updateRemoteDisplay() {
  const hEl = document.getElementById('remote-height-val');
  const wEl = document.getElementById('remote-weight-val');
  const cEl = document.getElementById('remote-chest-val');

  if (hEl && document.activeElement !== hEl) {
    if (hEl.tagName === 'INPUT') hEl.value = remoteHeight.toFixed(1);
    else hEl.textContent = remoteHeight.toFixed(1);
  }
  if (wEl && document.activeElement !== wEl) {
    if (wEl.tagName === 'INPUT') wEl.value = remoteWeight.toFixed(1);
    else wEl.textContent = remoteWeight.toFixed(1);
  }
  if (cEl && document.activeElement !== cEl) {
    if (cEl.tagName === 'INPUT') cEl.value = remoteChest.toFixed(1);
    else cEl.textContent = remoteChest.toFixed(1);
  }

  // Kira BMI di iPad
  const tM = remoteHeight / 100;
  const bmi = (remoteWeight / (tM * tM)).toFixed(2);
  const bmiEl = document.getElementById('remote-bmi-num');
  const statusEl = document.getElementById('remote-bmi-status');

  if (bmiEl) bmiEl.textContent = bmi;
  if (statusEl) {
    const b = parseFloat(bmi);
    if (b >= 19.0 && b <= 27.0) {
      statusEl.className = 'badge-tag pass';
      statusEl.textContent = 'LULUS';
    } else if (b > 27.0 && b <= 29.5) {
      statusEl.className = 'badge-tag warn';
      statusEl.textContent = 'PERHATIAN';
    } else {
      statusEl.className = 'badge-tag fail';
      statusEl.textContent = 'GAGAL';
    }
  }
}

/**
 * Input Taip Terus di iPad / Telefon Pintar (Keypad Sentuh Skrin)
 */
function onRemoteDirectInput(field, val) {
  const num = parseFloat(val);
  if (isNaN(num) || num <= 0) return;

  if (field === 'height') remoteHeight = num;
  if (field === 'weight') remoteWeight = num;
  if (field === 'chest') remoteChest = num;

  const tM = remoteHeight / 100;
  const bmi = (remoteWeight / (tM * tM)).toFixed(2);
  const bmiEl = document.getElementById('remote-bmi-num');
  const statusEl = document.getElementById('remote-bmi-status');

  if (bmiEl) bmiEl.textContent = bmi;
  if (statusEl) {
    const b = parseFloat(bmi);
    if (b >= 19.0 && b <= 27.0) {
      statusEl.className = 'badge-tag pass';
      statusEl.textContent = 'LULUS';
    } else if (b > 27.0 && b <= 29.5) {
      statusEl.className = 'badge-tag warn';
      statusEl.textContent = 'PERHATIAN';
    } else {
      statusEl.className = 'badge-tag fail';
      statusEl.textContent = 'GAGAL';
    }
  }

  // Segerakkan ke PC serta-merta
  sendRemoteLiveBroadcast();
}

function sendRemoteLiveBroadcast() {
  const payload = {
    type: 'LIVE_MEASUREMENT',
    sessionId: hostSessionCode,
    height: remoteHeight,
    weight: remoteWeight,
    chest: remoteChest,
    isHold: remoteHold,
    timestamp: Date.now()
  };

  // 1. Hantar melalui WebRTC terus ke PC (P2P <50ms)
  if (remoteConnToHost && remoteConnToHost.open) {
    remoteConnToHost.send(payload);
  }

  // 2. Sandaran storan tempatan untuk split tab
  try {
    localStorage.setItem('bfrd_companion_sync', JSON.stringify(payload));
  } catch (e) {}
}

/**
 * Terima mesej arahan / maklumat calon daripada komputer PC ke skrin iPad
 */
function handleIncomingMessageFromHost(data) {
  if (!data) return;

  if (data.type === 'CANDIDATE_CHANGED') {
    const elName = document.getElementById('remote-cand-name');
    const elJawatan = document.getElementById('remote-cand-jawatan');

    if (elName) {
      elName.textContent = data.nama + (data.ic ? ` (${data.ic})` : '');
    }
    if (elJawatan) {
      elJawatan.textContent = data.jawatan || 'Ahli Bomba dan Penyelamat';
    }

    if (data.shouldReset) {
      remoteHeight = 168.0;
      remoteWeight = 65.0;
      remoteChest = 33.0;
      remoteHold = false;
      const holdBtn = document.getElementById('remote-hold-btn');
      const holdTxt = document.getElementById('remote-hold-txt');
      if (holdBtn && holdTxt) {
        holdBtn.classList.remove('hold-active');
        holdTxt.textContent = 'Kunci Bacaan Hold';
      }
      updateRemoteDisplay();
    }

    showToast(`Giliran Calon: ${data.nama}`, 'info');
    hapticFeedback();
  }
}

function remoteConfirmValues() {
  remoteHold = true;
  const holdBtn = document.getElementById('remote-hold-btn');
  const holdTxt = document.getElementById('remote-hold-txt');
  if (holdBtn && holdTxt) {
    holdBtn.classList.add('hold-active');
    holdTxt.textContent = 'Hold Aktif (Kunci)';
  }

  const payload = {
    type: 'CONFIRM_LOCK',
    sessionId: hostSessionCode,
    height: remoteHeight,
    weight: remoteWeight,
    chest: remoteChest,
    isHold: true,
    timestamp: Date.now()
  };

  if (remoteConnToHost && remoteConnToHost.open) {
    remoteConnToHost.send(payload);
  }
  try {
    localStorage.setItem('bfrd_companion_sync', JSON.stringify(payload));
  } catch (e) {}

  hapticFeedback();
  showToast('Bacaan disahkan dan dikunci ke komputer utama!', 'success');
}

/**
 * Butang Calon Seterusnya di skrin iPad (Kosongkan Pad untuk Calon Baru)
 */
function remoteNextCandidate() {
  hapticFeedback();
  remoteHold = false;
  const holdBtn = document.getElementById('remote-hold-btn');
  const holdTxt = document.getElementById('remote-hold-txt');
  if (holdBtn && holdTxt) {
    holdBtn.classList.remove('hold-active');
    holdTxt.textContent = 'Kunci Bacaan Hold';
  }
  updateRemoteDisplay();

  const payload = {
    type: 'NEXT_CANDIDATE_REQUEST',
    sessionId: hostSessionCode,
    timestamp: Date.now()
  };

  if (remoteConnToHost && remoteConnToHost.open) {
    remoteConnToHost.send(payload);
  }
  try {
    localStorage.setItem('bfrd_companion_sync', JSON.stringify(payload));
  } catch (e) {}

  showToast('Permintaan giliran calon seterusnya dihantar ke PC.', 'info');
}

function hapticFeedback() {
  if (navigator.vibrate) {
    try { navigator.vibrate(35); } catch (e) {}
  }
}

// ════════════════════════════════════════════════════════════
// 14. SISTEM OPERASI 4 STESEN (MULTI-STATION QR WORKFLOW)
// ════════════════════════════════════════════════════════════

let activeStation = 4;
let html5QrScannerInstance = null;
let currentScannerTargetStation = 2;
let currentCameraFacing = 'environment';

// State Stesen 2
let activeStation2Candidate = null;
let s2Height = 168.0;
let s2Weight = 65.0;
let s2Chest = 33.0;

// State Stesen 3
let activeStation3Candidate = null;
let s3DocStatus = [true, true, true, true, true, true];

// State Stesen 4
let activeStation4Candidate = null;

/**
 * Tukar Mod Stesen Pengambilan (1, 2, 3, atau 4)
 */
function switchStation(stn) {
  const stationNum = parseInt(stn) || 1;
  activeStation = stationNum;
  try {
    localStorage.setItem('bfrd_active_station', String(stationNum));
  } catch (e) {}

  // Kemas kini dropdown topbar
  const select = document.getElementById('topbar-station-select');
  if (select) select.value = String(stationNum);

  // Kemas kini butang aktif di sidebar
  document.querySelectorAll('.nav-station').forEach(btn => {
    btn.classList.remove('active');
  });

  // Kemas kini butang aktif di mobile bottom tab bar
  document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const mobBtn = document.getElementById(`mob-nav-stesen-${stationNum}`);
  if (mobBtn) mobBtn.classList.add('active');

  if (stationNum === 1) {
    navigateTo('kaunter');
    const navBtn = document.querySelector('.nav-station[data-page="kaunter"]');
    if (navBtn) navBtn.classList.add('active');
    updateStation1TopBanner();
    showToast('🏢 Mod Stesen 1 Aktif: Pendaftaran & Kad QR Calon.', 'info');
  } else if (stationNum === 2) {
    navigateTo('stesen-2');
    const navBtn = document.querySelector('.nav-station[data-page="stesen-2"]');
    if (navBtn) navBtn.classList.add('active');
    showToast('⚖️ Mod Stesen 2 Aktif: Timbangan & Ukuran Fizikal (Imbas QR).', 'info');
  } else if (stationNum === 3) {
    navigateTo('stesen-3');
    const navBtn = document.querySelector('.nav-station[data-page="stesen-3"]');
    if (navBtn) navBtn.classList.add('active');
    showToast('📋 Mod Stesen 3 Aktif: Pengesahan Dokumen Fizikal (Imbas QR).', 'info');
  } else {
    navigateTo('dashboard');
    const navBtn = document.querySelector('.nav-station[data-page="dashboard"]');
    if (navBtn) navBtn.classList.add('active');
    showToast('💻 Mod Stesen 4 Aktif: Meja Ketua Penguji & Final Check (Laptop).', 'info');
  }

  refreshIcons();
}

/**
 * Buka Modal Pengimbas Kod QR Kamera
 */
function openQrScannerModal(targetStation = 2) {
  currentScannerTargetStation = parseInt(targetStation) || activeStation || 2;
  const modal = document.getElementById('modal-qr-scanner');
  const title = document.getElementById('qr-scanner-title');
  if (title) title.textContent = `Imbas QR Calon (Stesen ${currentScannerTargetStation})`;

  if (modal) modal.style.display = 'flex';
  refreshIcons();
  startQrCamera();
}

function startStationQrScanner(stn) {
  openQrScannerModal(stn);
}

function closeQrScannerModal() {
  stopQrCamera();
  const modal = document.getElementById('modal-qr-scanner');
  if (modal) modal.style.display = 'none';
}

function startQrCamera() {
  const readerEl = document.getElementById('qr-reader');
  if (!readerEl || typeof Html5Qrcode === 'undefined') return;

  if (html5QrScannerInstance) {
    stopQrCamera();
  }

  try {
    html5QrScannerInstance = new Html5Qrcode('qr-reader');
    const config = { fps: 15, qrbox: { width: 250, height: 250 } };

    html5QrScannerInstance.start(
      { facingMode: currentCameraFacing },
      config,
      (decodedText, decodedResult) => {
        onQrScanSuccess(decodedText, decodedResult);
      },
      (errorMessage) => {
        // Frame tanpa kod QR diabaikan
      }
    ).catch(err => {
      console.warn('Ralat kamera QR:', err);
      showToast('Kamera tidak dapat diakses atau disekat oleh pelayar.', 'error');
    });
  } catch (e) {
    console.warn('Html5Qrcode err:', e);
  }
}

function stopQrCamera() {
  if (html5QrScannerInstance) {
    try {
      html5QrScannerInstance.stop().then(() => {
        html5QrScannerInstance.clear();
        html5QrScannerInstance = null;
      }).catch(() => {
        html5QrScannerInstance = null;
      });
    } catch (e) {
      html5QrScannerInstance = null;
    }
  }
}

function toggleCameraFacing() {
  currentCameraFacing = (currentCameraFacing === 'environment') ? 'user' : 'environment';
  startQrCamera();
  showToast(`Beralih kamera: ${currentCameraFacing === 'environment' ? 'Kamera Belakang' : 'Kamera Hadapan'}`, 'info');
}

function onQrScanSuccess(decodedText, decodedResult) {
  stopQrCamera();
  closeQrScannerModal();
  hapticFeedback();
  showToast(`Kod QR Dikesan: ${decodedText}`, 'success');
  handleCandidateQrIdentified(decodedText, currentScannerTargetStation);
}

function submitManualQrLookup() {
  const inp = document.getElementById('qr-scanner-manual-inp');
  const val = inp ? inp.value.trim() : '';
  if (!val) {
    showToast('Sila masukkan No. ID atau No. IC calon.', 'warn');
    return;
  }
  stopQrCamera();
  closeQrScannerModal();
  handleCandidateQrIdentified(val, currentScannerTargetStation);
}

function searchCandidateForStation(stn, query) {
  if (!query || !query.trim()) {
    showToast('Sila masukkan No. ID atau No. IC calon.', 'warn');
    return;
  }
  handleCandidateQrIdentified(query.trim(), stn);
}

/**
 * Memuatkan calon mengikut kod QR / ID yang diimbas
 */
function handleCandidateQrIdentified(query, stationNum) {
  const cleanQ = String(query).trim().toUpperCase();

  // 1. Cari calon dalam pangkalan data semasa
  let cand = STATE.pemohonList.find(p => 
    (p['ID Pendaftaran'] && p['ID Pendaftaran'].toUpperCase() === cleanQ) ||
    (p['No. IC'] && p['No. IC'].toUpperCase() === cleanQ)
  );

  // 2. Jika tidak dijumpai dalam list semasa, cipta rekod sementara yang sah
  if (!cand) {
    cand = {
      'ID Pendaftaran': cleanQ.startsWith('BFRD-') ? cleanQ : `BFRD-2026-${cleanQ}`,
      'Nama Penuh': 'CALON ' + cleanQ,
      'No. IC': cleanQ.includes('-') ? cleanQ : '01-123456',
      'Jawatan Dipohon': 'Ahli Bomba dan Penyelamat',
      'Tarikh Lahir': '2002-05-14',
      'Umur': 24,
      'Jantina': 'Lelaki',
      'Status Perkahwinan': 'Bujang',
      'Status Kerakyatan': 'Rakyat Brunei Darussalam',
      'No. Telefon': '+673 8991234',
      'Tinggi (cm)': 170.0,
      'Berat (kg)': 65.0,
      'Nilai BMI': 22.49,
      'Status BMI': 'BMI NORMAL & LULUS KELAYAKAN',
      'Ukuran Dada (inci)': 33.0
    };
    STATE.pemohonList.unshift(cand);
  }

  if (stationNum === 2) {
    loadCandidateIntoStation2(cand);
    navigateTo('stesen-2');
  } else if (stationNum === 3) {
    loadCandidateIntoStation3(cand);
    navigateTo('stesen-3');
  } else if (stationNum === 4) {
    loadCandidateIntoStation4(cand);
    navigateTo('dashboard');
    showToast('Permohonan penuh ' + cand['Nama Penuh'] + ' dimuatkan ke Meja Ketua Penguji!', 'success');
  }
}

/**
 * Stesen 1: Jana & Paparkan Kad Pengenalan QR Calon
 */
function showCandidateQrPass(p) {
  const modal = document.getElementById('modal-candidate-qr-pass');
  if (!modal) return;

  const candId = p['ID Pendaftaran'] || generateDraftIdVal();
  const qrImg = document.getElementById('pass-cand-qr-img');
  const elId = document.getElementById('pass-cand-id');
  const elNama = document.getElementById('pass-cand-nama');
  const elIc = document.getElementById('pass-cand-ic');
  const elJawatan = document.getElementById('pass-cand-jawatan');
  const elTime = document.getElementById('pass-cand-time');

  if (elId) elId.textContent = candId;
  if (elNama) elNama.textContent = p['Nama Penuh'] || '-';
  if (elIc) elIc.textContent = p['No. IC'] || '-';
  if (elJawatan) elJawatan.textContent = p['Jawatan Dipohon'] || 'Ahli Bomba';
  if (elTime) elTime.textContent = new Date().toLocaleString('ms-BN');

  if (qrImg) {
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(candId)}`;
  }

  modal.style.display = 'flex';
  refreshIcons();
}

function closeCandidateQrPass() {
  const modal = document.getElementById('modal-candidate-qr-pass');
  if (modal) modal.style.display = 'none';
  resetFormSaringan();
}

function printCandidateQrSlip() {
  window.print();
}

/**
 * Logik Stesen 2: Timbangan & Ukuran Fizikal
 */
function loadCandidateIntoStation2(cand) {
  activeStation2Candidate = cand;
  s2Height = parseFloat(cand['Tinggi (cm)']) || 168.0;
  s2Weight = parseFloat(cand['Berat (kg)']) || 65.0;
  s2Chest = parseFloat(cand['Ukuran Dada (inci)']) || 33.0;

  const empty = document.getElementById('s2-empty-state');
  const content = document.getElementById('s2-active-content');
  if (empty) empty.style.display = 'none';
  if (content) content.style.display = 'block';

  const elNama = document.getElementById('s2-nama');
  const elId = document.getElementById('s2-id');
  const elIc = document.getElementById('s2-ic');
  const elJawatan = document.getElementById('s2-jawatan');
  const elUmur = document.getElementById('s2-umur');
  const elJantina = document.getElementById('s2-jantina');
  const elAvatar = document.getElementById('s2-avatar');

  if (elNama) elNama.textContent = cand['Nama Penuh'] || '-';
  if (elId) elId.textContent = cand['ID Pendaftaran'] || '-';
  if (elIc) elIc.textContent = cand['No. IC'] || '-';
  if (elJawatan) elJawatan.textContent = cand['Jawatan Dipohon'] || '-';
  if (elUmur) elUmur.textContent = `${cand['Umur'] || 0} Tahun`;
  const jantina = cand['Jantina'] || 'Lelaki';
  if (elJantina) elJantina.textContent = jantina;
  if (elAvatar) elAvatar.textContent = (cand['Nama Penuh'] || 'C').charAt(0).toUpperCase();

  // Sembunyikan bahagian dada bagi calon wanita
  const groupDada = document.getElementById('s2-group-dada');
  if (groupDada) {
    groupDada.style.display = (jantina === 'Lelaki') ? 'block' : 'none';
  }

  const inpH = document.getElementById('s2-inp-tinggi');
  const inpW = document.getElementById('s2-inp-berat');
  const inpC = document.getElementById('s2-inp-dada');
  if (inpH) inpH.value = s2Height.toFixed(1);
  if (inpW) inpW.value = s2Weight.toFixed(1);
  if (inpC) inpC.value = s2Chest.toFixed(1);

  calcStation2BMI();
  refreshIcons();
}

function stepStation2Val(field, delta) {
  if (field === 'height') {
    s2Height = Math.round((s2Height + delta) * 10) / 10;
    const inp = document.getElementById('s2-inp-tinggi');
    if (inp) inp.value = s2Height.toFixed(1);
  } else if (field === 'weight') {
    s2Weight = Math.round((s2Weight + delta) * 10) / 10;
    const inp = document.getElementById('s2-inp-berat');
    if (inp) inp.value = s2Weight.toFixed(1);
  } else if (field === 'chest') {
    s2Chest = Math.round((s2Chest + delta) * 10) / 10;
    const inp = document.getElementById('s2-inp-dada');
    if (inp) inp.value = s2Chest.toFixed(1);
  }
  calcStation2BMI();
}

function onStation2MeasureChange(field, val) {
  const num = parseFloat(val);
  if (isNaN(num) || num <= 0) return;
  if (field === 'height') s2Height = num;
  if (field === 'weight') s2Weight = num;
  if (field === 'chest') s2Chest = num;
  calcStation2BMI();
}

function calcStation2BMI() {
  const tMeter = s2Height / 100;
  const bmi = (s2Weight / (tMeter * tMeter)).toFixed(2);
  const bNum = parseFloat(bmi);

  const numEl = document.getElementById('s2-bmi-num');
  const badgeEl = document.getElementById('s2-bmi-status-badge');
  const txtEl = document.getElementById('s2-bmi-status-txt');

  if (numEl) numEl.textContent = bmi;

  let pass = (bNum >= 19.0 && bNum <= 27.0);
  if (badgeEl && txtEl) {
    if (pass) {
      badgeEl.className = 'tactile-status-chip pass';
      txtEl.textContent = 'BMI NORMAL & LULUS KELAYAKAN';
    } else if (bNum > 27.0 && bNum <= 29.5) {
      badgeEl.className = 'tactile-status-chip warn';
      txtEl.textContent = 'BERLEBIHAN / PERHATIAN';
    } else {
      badgeEl.className = 'tactile-status-chip fail';
      txtEl.textContent = 'TIDAK LULUS SYARAT BMI';
    }
  }
}

async function submitStation2Record() {
  if (!activeStation2Candidate) {
    showToast('Tiada calon aktif. Sila imbas QR Calon dahulu.', 'warn');
    return;
  }

  const tMeter = s2Height / 100;
  const bmi = parseFloat((s2Weight / (tMeter * tMeter)).toFixed(2));
  const txtEl = document.getElementById('s2-bmi-status-txt');
  const statusBMI = txtEl ? txtEl.textContent : 'Lulus';

  activeStation2Candidate['Tinggi (cm)'] = s2Height;
  activeStation2Candidate['Berat (kg)'] = s2Weight;
  activeStation2Candidate['Ukuran Dada (inci)'] = s2Chest;
  activeStation2Candidate['Nilai BMI'] = bmi;
  activeStation2Candidate['Status BMI'] = statusBMI;

  showToast(`Ukuran ${activeStation2Candidate['Nama Penuh']} disahkan! Calon sedia bergerak ke Stesen 3 (Dokumen).`, 'success');

  // Kemas kini ke Google Apps Script backend
  apiPost('kemaskinPemohon', {
    idPendaftaran: activeStation2Candidate['ID Pendaftaran'],
    data: {
      'Tinggi (cm)': s2Height,
      'Berat (kg)': s2Weight,
      'Ukuran Dada (inci)': s2Chest,
      'Nilai BMI': bmi,
      'Status BMI': statusBMI
    }
  }).catch(err => console.warn('Latar belakang update:', err));

  resetStation2();
}

function resetStation2() {
  activeStation2Candidate = null;
  const empty = document.getElementById('s2-empty-state');
  const content = document.getElementById('s2-active-content');
  if (empty) empty.style.display = 'block';
  if (content) content.style.display = 'none';
  const sInp = document.getElementById('s2-manual-id');
  if (sInp) sInp.value = '';
}

/**
 * Logik Stesen 3: Pengesahan Dokumen Fizikal
 */
function loadCandidateIntoStation3(cand) {
  activeStation3Candidate = cand;
  const empty = document.getElementById('s3-empty-state');
  const content = document.getElementById('s3-active-content');
  if (empty) empty.style.display = 'none';
  if (content) content.style.display = 'block';

  const elNama = document.getElementById('s3-nama');
  const elId = document.getElementById('s3-id');
  const elIc = document.getElementById('s3-ic');
  const elJawatan = document.getElementById('s3-jawatan');
  const elAvatar = document.getElementById('s3-avatar');
  const elFizikal = document.getElementById('s3-fizikal-summary');

  if (elNama) elNama.textContent = cand['Nama Penuh'] || '-';
  if (elId) elId.textContent = cand['ID Pendaftaran'] || '-';
  if (elIc) elIc.textContent = cand['No. IC'] || '-';
  if (elJawatan) elJawatan.textContent = cand['Jawatan Dipohon'] || '-';
  if (elAvatar) elAvatar.textContent = (cand['Nama Penuh'] || 'C').charAt(0).toUpperCase();

  const t = cand['Tinggi (cm)'] || 170.0;
  const b = cand['Nilai BMI'] || 22.5;
  if (elFizikal) elFizikal.textContent = `Tinggi: ${t} cm | BMI: ${b}`;

  markAllStation3Docs(true);
  refreshIcons();
}

function toggleStation3Doc(idx) {
  s3DocStatus[idx] = !s3DocStatus[idx];
  const el = document.getElementById(`s3-doc-${idx}`);
  if (el) {
    if (s3DocStatus[idx]) el.classList.add('checked');
    else el.classList.remove('checked');
  }
  updateStation3DocCounter();
}

function markAllStation3Docs(status) {
  s3DocStatus = [status, status, status, status, status, status];
  for (let i = 0; i < 6; i++) {
    const el = document.getElementById(`s3-doc-${i}`);
    if (el) {
      if (status) el.classList.add('checked');
      else el.classList.remove('checked');
    }
  }
  updateStation3DocCounter();
}

function updateStation3DocCounter() {
  const count = s3DocStatus.filter(Boolean).length;
  const badge = document.getElementById('s3-doc-counter');
  if (badge) {
    badge.textContent = `${count} / 6 Dokumen Disahkan`;
    badge.className = count === 6 ? 'tactile-status-chip pass' : 'tactile-status-chip warn';
  }
}

async function submitStation3Record() {
  if (!activeStation3Candidate) {
    showToast('Tiada calon aktif. Sila imbas QR Calon dahulu.', 'warn');
    return;
  }

  const count = s3DocStatus.filter(Boolean).length;
  if (count < 6) {
    showToast('Amaran: Hanya ' + count + ' daripada 6 dokumen disahkan lengkap.', 'warn');
  }

  const kodS3 = document.getElementById('s3-inp-kod-pemeriksa')?.value.trim().toUpperCase() || 'P-003';
  activeStation3Candidate['Kod Pemeriksa S3'] = kodS3;
  activeStation3Candidate['Semakan Surat Panggilan'] = s3DocStatus[0] ? 'Ya' : 'Tidak';
  activeStation3Candidate['Semakan Kad Pengenalan'] = s3DocStatus[1] ? 'Ya' : 'Tidak';
  activeStation3Candidate['Semakan Sijil Akademik'] = s3DocStatus[2] ? 'Ya' : 'Tidak';
  activeStation3Candidate['Semakan CV & Surat'] = s3DocStatus[3] ? 'Ya' : 'Tidak';
  activeStation3Candidate['Semakan Dokumen Khas'] = s3DocStatus[4] ? 'Ya' : 'Tidak';
  activeStation3Candidate['Semakan Pasfoto'] = s3DocStatus[5] ? 'Ya' : 'Tidak';

  showToast(`Dokumen ${activeStation3Candidate['Nama Penuh']} disahkan (${count}/6)! Calon sedia ke Stesen 4 (Meja Ketua Penguji).`, 'success');

  apiPost('kemaskinPemohon', {
    idPendaftaran: activeStation3Candidate['ID Pendaftaran'],
    data: {
      'Semakan Surat Panggilan': s3DocStatus[0] ? 'Ya' : 'Tidak',
      'Semakan Kad Pengenalan': s3DocStatus[1] ? 'Ya' : 'Tidak',
      'Semakan Sijil Akademik': s3DocStatus[2] ? 'Ya' : 'Tidak',
      'Semakan CV & Surat': s3DocStatus[3] ? 'Ya' : 'Tidak',
      'Semakan Dokumen Khas': s3DocStatus[4] ? 'Ya' : 'Tidak',
      'Semakan Pasfoto': s3DocStatus[5] ? 'Ya' : 'Tidak'
    }
  }).catch(err => console.warn('Latar belakang update:', err));

  resetStation3();
}

function resetStation3() {
  activeStation3Candidate = null;
  const empty = document.getElementById('s3-empty-state');
  const content = document.getElementById('s3-active-content');
  if (empty) empty.style.display = 'block';
  if (content) content.style.display = 'none';
  const sInp = document.getElementById('s3-manual-id');
  if (sInp) sInp.value = '';
}

/**
 * Logik Stesen 4: Meja Ketua Penguji & Final Check (Laptop)
 * Memaparkan KESELURUHAN PERMOHONAN (The Whole Application) Calon
 */
function loadCandidateIntoStation4(cand) {
  if (!cand) return;
  activeStation4Candidate = cand;

  const empty = document.getElementById('s4-empty-state');
  const activeBox = document.getElementById('s4-active-content');
  if (empty) empty.style.display = 'none';
  if (activeBox) activeBox.style.display = 'block';

  // Header Calon
  const elNama = document.getElementById('s4-main-nama');
  const elId = document.getElementById('s4-main-id');
  const elIc = document.getElementById('s4-main-ic');
  const elJawatan = document.getElementById('s4-main-jawatan');
  const elUmur = document.getElementById('s4-main-umur');
  const elJantina = document.getElementById('s4-main-jantina');
  const elAvatar = document.getElementById('s4-main-avatar');
  const elStatusTag = document.getElementById('s4-main-status-tag');

  const nama = cand['Nama Penuh'] || '-';
  const id = cand['ID Pendaftaran'] || '-';
  const ic = cand['No. IC'] || '-';
  const jawatan = cand['Jawatan Dipohon'] || 'Ahli Bomba dan Penyelamat';
  const umur = cand['Umur'] || 0;
  const jantina = cand['Jantina'] || 'Lelaki';

  if (elNama) elNama.textContent = nama;
  if (elId) elId.textContent = id;
  if (elIc) elIc.textContent = ic;
  if (elJawatan) elJawatan.textContent = jawatan;
  if (elUmur) elUmur.textContent = `${umur} Tahun`;
  if (elJantina) elJantina.textContent = jantina;
  if (elAvatar) elAvatar.textContent = nama.charAt(0).toUpperCase();

  const kep = cand['Keputusan Akhir'] || 'Menunggu Pengesahan';
  if (elStatusTag) {
    elStatusTag.textContent = kep.toUpperCase();
    if (kep === 'Layak' || kep === 'Lulus') {
      elStatusTag.style.background = '#DCFCE7';
      elStatusTag.style.color = '#166534';
    } else if (kep === 'Perlu Semakan') {
      elStatusTag.style.background = '#FEF3C7';
      elStatusTag.style.color = '#92400E';
    } else if (kep === 'Tidak Layak') {
      elStatusTag.style.background = '#FEE2E2';
      elStatusTag.style.color = '#991B1B';
    } else {
      elStatusTag.style.background = '#FEF3C7';
      elStatusTag.style.color = '#92400E';
    }
  }

  // 1. Data Peribadi (Stesen 1)
  const elKerakyatan = document.getElementById('s4-field-kerakyatan');
  const elKahwin = document.getElementById('s4-field-kahwin');
  const elTlahir = document.getElementById('s4-field-tlahir');
  const elTel = document.getElementById('s4-field-tel');
  const elEmel = document.getElementById('s4-field-emel');

  if (elKerakyatan) elKerakyatan.textContent = cand['Status Kerakyatan'] || 'Rakyat Brunei Darussalam';
  if (elKahwin) elKahwin.textContent = cand['Status Perkahwinan'] || 'Bujang';
  if (elTlahir) elTlahir.textContent = cand['Tarikh Lahir'] || '-';
  if (elTel) elTel.textContent = cand['No. Telefon'] || '-';
  if (elEmel) elEmel.textContent = cand['Emel'] || '-';

  // 2. Ukuran Fizikal & BMI (Stesen 2)
  const elTinggi = document.getElementById('s4-field-tinggi');
  const elBerat = document.getElementById('s4-field-berat');
  const elDada = document.getElementById('s4-field-dada');
  const elBmi = document.getElementById('s4-field-bmi');
  const elBmiStatus = document.getElementById('s4-field-bmistatus');
  const elBadgeFizikal = document.getElementById('s4-badge-fizikal');

  const t = parseFloat(cand['Tinggi (cm)']) || 0;
  const w = parseFloat(cand['Berat (kg)']) || 0;
  const c = parseFloat(cand['Ukuran Dada (inci)']) || 0;
  const bmi = parseFloat(cand['Nilai BMI']) || 0;
  const minTinggi = (jantina === 'Perempuan') ? 152.0 : 161.0;

  if (elTinggi) elTinggi.innerHTML = `${t.toFixed(1)} cm <span style="font-size:11px;color:${t >= minTinggi ? '#166534' : '#DC2626'}">(${t >= minTinggi ? '≥ Syarat Min ' + minTinggi : 'Gagal Min ' + minTinggi})</span>`;
  if (elBerat) elBerat.textContent = `${w.toFixed(1)} kg`;
  if (elDada) {
    if (jantina === 'Perempuan') {
      elDada.innerHTML = `<span style="color:var(--slate-muted)">N/A (Calon Wanita)</span>`;
    } else {
      elDada.innerHTML = `${c.toFixed(1)}" <span style="font-size:11px;color:${c < 34.0 ? '#166534' : '#DC2626'}">(${c < 34.0 ? 'Mematuhi < 34"' : 'Melebihi 34"'})</span>`;
    }
  }
  if (elBmi) elBmi.textContent = bmi.toFixed(2);
  if (elBmiStatus) elBmiStatus.textContent = cand['Status BMI'] || 'OPTIMAL (Julat 19 - 27)';

  if (elBadgeFizikal) {
    const isFizikalPass = t >= minTinggi && (jantina === 'Perempuan' || c < 34.0) && (bmi >= 19.0 && bmi <= 27.0);
    elBadgeFizikal.textContent = isFizikalPass ? 'Lulus Fizikal' : 'Perlu Semakan';
    elBadgeFizikal.style.background = isFizikalPass ? '#DCFCE7' : '#FEF3C7';
    elBadgeFizikal.style.color = isFizikalPass ? '#166534' : '#92400E';
  }

  // 3. Semakan Dokumen Asal (Stesen 3)
  const docKeys = [
    'Semakan Surat Panggilan',
    'Semakan Kad Pengenalan',
    'Semakan Sijil Akademik',
    'Semakan CV & Surat',
    'Semakan Dokumen Khas',
    'Semakan Pasfoto'
  ];
  let docCount = 0;
  docKeys.forEach((k, idx) => {
    const isOk = cand[k] === 'Ya';
    if (isOk) docCount++;
    const elDoc = document.getElementById(`s4-doc-${idx}`);
    if (elDoc) {
      elDoc.textContent = isOk ? 'Ya' : 'Tidak';
      elDoc.style.background = isOk ? '#DCFCE7' : '#FEE2E2';
      elDoc.style.color = isOk ? '#166534' : '#991B1B';
    }
  });

  const elDocStatus = document.getElementById('s4-field-docstatus');
  if (elDocStatus) {
    elDocStatus.textContent = `${docCount} / 6 Disahkan`;
    elDocStatus.style.background = docCount === 6 ? '#DCFCE7' : '#FEF3C7';
    elDocStatus.style.color = docCount === 6 ? '#166534' : '#92400E';
  }

  // Radio keputusan ketua penguji
  const radioVal = cand['Keputusan Akhir'] || 'Lulus';
  const radio = document.querySelector(`input[name="s4-page-decision-choice"][value="${radioVal}"]`);
  if (radio) radio.checked = true;

  // Catatan rasmi
  const elCatatan = document.getElementById('s4-page-catatan-inp');
  if (elCatatan) {
    elCatatan.value = cand['Catatan Pegawai'] || 'Calon disahkan melepasi saringan 4 stesen. Memenuhi kriteria fizikal dan dokumen rasmi BFRD. Layak ke ujian kecergasan padang.';
  }

  // Juga kemas kini modal jika wujud
  openStation4Review(cand, false);

  refreshIcons();
}

/**
 * Render Senarai Calon Giliran Meja Ketua Penguji (Stesen 4)
 */
function renderStation4Queue(filterText = '') {
  const tbody = document.getElementById('s4-queue-table-body');
  if (!tbody) return;

  const query = (filterText || '').trim().toLowerCase();
  let list = STATE.pemohonList || [];

  if (query) {
    list = list.filter(p =>
      (p['Nama Penuh'] || '').toLowerCase().includes(query) ||
      (p['No. IC'] || '').toLowerCase().includes(query) ||
      (p['ID Pendaftaran'] || '').toLowerCase().includes(query) ||
      (p['Jawatan Dipohon'] || '').toLowerCase().includes(query)
    );
  }

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center;padding:28px;color:var(--slate-muted);">
          <div style="font-size:14px;font-weight:700;">Tiada calon dalam giliran pada masa ini.</div>
          <div style="font-size:12px;margin-top:4px;">Imbas QR calon di Stesen 1, 2 atau 3 untuk mendaftar calon ke dalam sistem.</div>
        </td>
      </tr>
    `;
    return;
  }

  // Jika belum ada calon aktif di Stesen 4, muat calon pertama secara automatik
  if (!activeStation4Candidate && list.length > 0) {
    loadCandidateIntoStation4(list[0]);
  }

  tbody.innerHTML = list.map(p => {
    const isCur = activeStation4Candidate && activeStation4Candidate['ID Pendaftaran'] === p['ID Pendaftaran'];
    const rowBg = isCur ? 'background:rgba(37,99,235,0.06);font-weight:600;' : '';
    const t = parseFloat(p['Tinggi (cm)']) || 0;
    const bmi = parseFloat(p['Nilai BMI']) || 0;
    const fizikalTxt = t > 0 ? `${t.toFixed(0)}cm / ${bmi.toFixed(1)}` : '<span style="color:var(--slate-muted)">Menunggu S2</span>';

    let docPass = 0;
    if (p['Semakan Surat Panggilan'] === 'Ya') docPass++;
    if (p['Semakan Kad Pengenalan'] === 'Ya') docPass++;
    if (p['Semakan Sijil Akademik'] === 'Ya') docPass++;
    if (p['Semakan CV & Surat'] === 'Ya') docPass++;
    if (p['Semakan Dokumen Khas'] === 'Ya') docPass++;
    if (p['Semakan Pasfoto'] === 'Ya') docPass++;
    const docTxt = docPass > 0 ? `${docPass}/6 Sah` : '<span style="color:var(--slate-muted)">Menunggu S3</span>';

    const kep = p['Keputusan Akhir'] || 'Menunggu S4';
    let kepBadge = '<span class="badge-tag" style="background:#FEF3C7;color:#92400E;">Semakan S4</span>';
    if (kep === 'Layak' || kep === 'Lulus') {
      kepBadge = '<span class="badge-tag" style="background:#DCFCE7;color:#166534;">Layak (PAFT)</span>';
    } else if (kep === 'Tidak Layak') {
      kepBadge = '<span class="badge-tag" style="background:#FEE2E2;color:#991B1B;">Gagal</span>';
    } else if (kep === 'Perlu Semakan') {
      kepBadge = '<span class="badge-tag" style="background:#FEF3C7;color:#92400E;">Semakan Khas</span>';
    }

    return `
      <tr style="${rowBg}">
        <td><strong>${p['ID Pendaftaran'] || '-'}</strong></td>
        <td>
          <div style="font-weight:800;color:var(--slate-dark);">${p['Nama Penuh'] || '-'}</div>
          <div style="font-size:11px;color:var(--slate-muted);">${p['Jantina'] || 'Lelaki'} &bull; ${p['Umur'] || 0} Tahun</div>
        </td>
        <td><span style="font-family:monospace;font-weight:700;">${p['No. IC'] || '-'}</span></td>
        <td style="font-size:12px;">${p['Jawatan Dipohon'] || '-'}</td>
        <td style="font-size:12px;">${fizikalTxt}</td>
        <td style="font-size:12px;">${docTxt}</td>
        <td>${kepBadge}</td>
        <td style="text-align:right;">
          <button type="button" class="btn btn-navy" style="padding:6px 12px;font-size:12px;font-weight:700;" onclick="selectStation4Candidate('${p['ID Pendaftaran']}')">
            <i data-lucide="eye" style="width:13px;height:13px;"></i>
            <span>Semak Permohonan</span>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  refreshIcons();
}

function filterStation4Queue() {
  const inp = document.getElementById('s4-search-queue-inp');
  renderStation4Queue(inp ? inp.value : '');
}

function selectStation4Candidate(id) {
  const cand = STATE.pemohonList.find(p => p['ID Pendaftaran'] === id);
  if (!cand) return;
  loadCandidateIntoStation4(cand);
  const container = document.getElementById('s4-active-content');
  if (container) {
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  showToast(`Permohonan penuh ${cand['Nama Penuh']} sedia disemak.`, 'info');
}

function loadNextCandidateStation4() {
  const list = STATE.pemohonList || [];
  if (list.length === 0) {
    showToast('Tiada calon dalam rekod saringan.', 'warn');
    return;
  }
  if (!activeStation4Candidate) {
    loadCandidateIntoStation4(list[0]);
    return;
  }
  const idx = list.findIndex(p => p['ID Pendaftaran'] === activeStation4Candidate['ID Pendaftaran']);
  const nextIdx = (idx + 1) % list.length;
  loadCandidateIntoStation4(list[nextIdx]);
  const container = document.getElementById('s4-active-content');
  if (container) {
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  showToast(`Calon seterusnya: ${list[nextIdx]['Nama Penuh']}`, 'info');
}

function reprintQrFromStation4() {
  if (!activeStation4Candidate) {
    showToast('Tiada calon aktif dipilih.', 'warn');
    return;
  }
  showCandidateQrPass(activeStation4Candidate);
}

/**
 * Pengesahan Akhir dari Halaman Stesen 4 (Laptop Ketua Penguji)
 */
async function submitStation4DecisionFromPage(shouldPrint = false) {
  if (!activeStation4Candidate) {
    showToast('Sila pilih atau imbas calon terlebih dahulu.', 'warn');
    return;
  }

  const radio = document.querySelector('input[name="s4-page-decision-choice"]:checked');
  const decision = radio ? radio.value : 'Cukup Syarat';
  const catatan = document.getElementById('s4-page-catatan-inp')?.value || 'CALON MEMENUHI KESELURUHAN SYARAT FIZIKAL DAN DOKUMEN ASAL.';
  const kodS4 = document.getElementById('s4-inp-kod-pemeriksa')?.value.trim().toUpperCase() || 'KP-4088';

  activeStation4Candidate['Keputusan Akhir'] = decision;
  activeStation4Candidate['Catatan Pegawai'] = catatan;
  activeStation4Candidate['Ulasan Pegawai'] = catatan;
  activeStation4Candidate['Kod Pemeriksa S4'] = kodS4;

  // Kemas kini paparan status
  const elStatusTag = document.getElementById('s4-main-status-tag');
  if (elStatusTag) {
    elStatusTag.textContent = decision.toUpperCase();
    if (decision === 'Lulus' || decision === 'Layak') {
      elStatusTag.style.background = '#DCFCE7';
      elStatusTag.style.color = '#166534';
    } else if (decision === 'Perlu Semakan') {
      elStatusTag.style.background = '#FEF3C7';
      elStatusTag.style.color = '#92400E';
    } else {
      elStatusTag.style.background = '#FEE2E2';
      elStatusTag.style.color = '#991B1B';
    }
  }

  showToast(`Keputusan Akhir ${activeStation4Candidate['Nama Penuh']}: [${decision.toUpperCase()}] berjaya disahkan!`, 'success');

  // Hantar ke Google Sheets backend
  apiPost('kemaskinPemohon', {
    idPendaftaran: activeStation4Candidate['ID Pendaftaran'],
    data: {
      'Keputusan Akhir': decision,
      'Catatan Pegawai': catatan
    }
  }).catch(err => console.warn('Latar belakang update:', err));

  // Kemas kini giliran meja
  renderStation4Queue();

  if (shouldPrint) {
    openPrintModal(activeStation4Candidate);
  }
}

/**
 * Logik Stesen 4: Modal Semakan Pantas (Fallback)
 */
function openStation4Review(cand, showModal = true) {
  activeStation4Candidate = cand;
  const modal = document.getElementById('modal-station4-review');
  if (!modal) return;

  const elNama = document.getElementById('s4-nama');
  const elId = document.getElementById('s4-id');
  const elIc = document.getElementById('s4-ic');
  const elJawatan = document.getElementById('s4-jawatan');
  const elUmur = document.getElementById('s4-umur');
  const elJantina = document.getElementById('s4-jantina');
  const elAvatar = document.getElementById('s4-avatar');

  if (elNama) elNama.textContent = cand['Nama Penuh'] || '-';
  if (elId) elId.textContent = cand['ID Pendaftaran'] || '-';
  if (elIc) elIc.textContent = cand['No. IC'] || '-';
  if (elJawatan) elJawatan.textContent = cand['Jawatan Dipohon'] || '-';
  if (elUmur) elUmur.textContent = `${cand['Umur'] || 0} Tahun`;
  if (elJantina) elJantina.textContent = cand['Jantina'] || 'Lelaki';
  if (elAvatar) elAvatar.textContent = (cand['Nama Penuh'] || 'C').charAt(0).toUpperCase();

  // Box 1: Data Peribadi
  const elKerakyatan = document.getElementById('s4-val-kerakyatan');
  const elKahwin = document.getElementById('s4-val-kahwin');
  const elTel = document.getElementById('s4-val-tel');
  if (elKerakyatan) elKerakyatan.textContent = cand['Status Kerakyatan'] || 'Rakyat Brunei';
  if (elKahwin) elKahwin.textContent = cand['Status Perkahwinan'] || 'Bujang';
  if (elTel) elTel.textContent = cand['No. Telefon'] || '-';

  // Box 2: Ukuran Fizikal
  const elTinggi = document.getElementById('s4-val-tinggi');
  const elBerat = document.getElementById('s4-val-berat');
  const elDada = document.getElementById('s4-val-dada');
  const elBmi = document.getElementById('s4-val-bmi');
  const t = parseFloat(cand['Tinggi (cm)']) || 0;
  const w = parseFloat(cand['Berat (kg)']) || 0;
  const c = parseFloat(cand['Ukuran Dada (inci)']) || 0;
  const bmi = parseFloat(cand['Nilai BMI']) || 0;

  if (elTinggi) elTinggi.textContent = `${t.toFixed(1)} cm (Min ${cand['Jantina'] === 'Perempuan' ? '152.0' : '161.0'})`;
  if (elBerat) elBerat.textContent = `${w.toFixed(1)} kg`;
  if (elDada) elDada.textContent = cand['Jantina'] === 'Perempuan' ? 'N/A (Perempuan)' : `${c.toFixed(1)}" (< 34")`;
  if (elBmi) elBmi.textContent = `${bmi.toFixed(2)} (${cand['Status BMI'] || 'OPTIMAL'})`;

  // Box 3: Dokumen
  const elDocs = document.getElementById('s4-val-docs');
  let docPass = 0;
  if (cand['Semakan Surat Panggilan'] === 'Ya') docPass++;
  if (cand['Semakan Kad Pengenalan'] === 'Ya') docPass++;
  if (cand['Semakan Sijil Akademik'] === 'Ya') docPass++;
  if (cand['Semakan CV & Surat'] === 'Ya') docPass++;
  if (cand['Semakan Dokumen Khas'] === 'Ya') docPass++;
  if (cand['Semakan Pasfoto'] === 'Ya') docPass++;
  if (elDocs) elDocs.textContent = `${docPass} / 6 DISAHKAN`;

  if (showModal) {
    modal.style.display = 'flex';
  }
  refreshIcons();
}

function closeStation4Review() {
  const modal = document.getElementById('modal-station4-review');
  if (modal) modal.style.display = 'none';
}

async function submitStation4FinalDecision() {
  await submitStation4DecisionFromPage(true);
  closeStation4Review();
}
