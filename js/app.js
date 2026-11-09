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

// ── Data Contoh Asas (Digunakan untuk mod pratonton jika GAS_URL belum disambung) ──
const SEED_JAWATAN = [
  {
    'Kod Jawatan': 'AB-01',
    'Nama Jawatan': 'Ahli Bomba Lelaki Gred AB1',
    'Min. Tinggi Lelaki (cm)': 165.0,
    'Min. Tinggi Wanita (cm)': 0,
    'Min. BMI': 18.5,
    'Maks. BMI': 25.0,
    'Syarat Tambahan': 'Memegang Lesen Memandu Kelas 3 & 4 yang sah'
  },
  {
    'Kod Jawatan': 'PB-01',
    'Nama Jawatan': 'Pegawai Bomba Wanita Gred C1',
    'Min. Tinggi Lelaki (cm)': 0,
    'Min. Tinggi Wanita (cm)': 157.0,
    'Min. BMI': 18.0,
    'Maks. BMI': 24.5,
    'Syarat Tambahan': 'Lulus Ujian Penglihatan & Pendengaran'
  },
  {
    'Kod Jawatan': 'PB-02',
    'Nama Jawatan': 'Pegawai Bomba Lelaki Gred C1',
    'Min. Tinggi Lelaki (cm)': 167.0,
    'Min. Tinggi Wanita (cm)': 0,
    'Min. BMI': 18.5,
    'Maks. BMI': 25.0,
    'Syarat Tambahan': 'Ijazah Sarjana Muda & Ujian Kecergasan Fizikal'
  }
];

const SEED_PEMOHON = [
  {
    'ID Pendaftaran': 'BFRD-20261109-0001',
    'Tarikh & Masa': '09/11/2026 09:15',
    'No. IC': '01-123456',
    'Nama Penuh': 'AWANG MOHAMMAD HARIS BIN ABDULLAH',
    'Tarikh Lahir': '2003-05-14',
    'Umur': 23,
    'Jantina': 'Lelaki',
    'No. Telefon': '+673 8765432',
    'Emel': 'haris.abdullah@example.com',
    'Jawatan Dipohon': 'Ahli Bomba Lelaki Gred AB1',
    'Tinggi (cm)': 172.0,
    'Berat (kg)': 68.5,
    'Nilai BMI': 23.15,
    'Status BMI': 'Lulus',
    'Semakan Surat Panggilan': 'Ya',
    'Semakan Kad Pengenalan': 'Ya',
    'Semakan Sijil Akademik': 'Ya',
    'Semakan CV & Surat': 'Ya',
    'Semakan Dokumen Khas': 'Ya',
    'Semakan Pasfoto': 'Ya',
    'Keputusan Akhir': 'Layak',
    'Catatan Pegawai': 'Calon dalam keadaan fizikal cergas dan memenuhi syarat asas bomba.',
    'Pegawai Pemeriksa': 'p001'
  },
  {
    'ID Pendaftaran': 'BFRD-20261109-0002',
    'Tarikh & Masa': '09/11/2026 09:30',
    'No. IC': '01-234567',
    'Nama Penuh': 'DAYANG NURUL AIN BINTI HAJI IBRAHIM',
    'Tarikh Lahir': '2002-11-20',
    'Umur': 24,
    'Jantina': 'Perempuan',
    'No. Telefon': '+673 8899112',
    'Emel': 'nurul.ain@example.com',
    'Jawatan Dipohon': 'Pegawai Bomba Wanita Gred C1',
    'Tinggi (cm)': 159.0,
    'Berat (kg)': 54.0,
    'Nilai BMI': 21.36,
    'Status BMI': 'Lulus',
    'Semakan Surat Panggilan': 'Ya',
    'Semakan Kad Pengenalan': 'Ya',
    'Semakan Sijil Akademik': 'Ya',
    'Semakan CV & Surat': 'Ya',
    'Semakan Dokumen Khas': 'Ya',
    'Semakan Pasfoto': 'Ya',
    'Keputusan Akhir': 'Layak',
    'Catatan Pegawai': 'Dokumen lengkap. Keputusan fizikal sangat memuaskan.',
    'Pegawai Pemeriksa': 'p001'
  },
  {
    'ID Pendaftaran': 'BFRD-20261109-0003',
    'Tarikh & Masa': '09/11/2026 09:45',
    'No. IC': '01-345678',
    'Nama Penuh': 'AWANG AHMAD SYAFIQ BIN ROSLI',
    'Tarikh Lahir': '2004-03-08',
    'Umur': 22,
    'Jantina': 'Lelaki',
    'No. Telefon': '+673 7123456',
    'Emel': 'syafiq.rosli@example.com',
    'Jawatan Dipohon': 'Ahli Bomba Lelaki Gred AB1',
    'Tinggi (cm)': 162.0,
    'Berat (kg)': 76.0,
    'Nilai BMI': 28.96,
    'Status BMI': 'Tidak Lulus',
    'Semakan Surat Panggilan': 'Ya',
    'Semakan Kad Pengenalan': 'Ya',
    'Semakan Sijil Akademik': 'Ya',
    'Semakan CV & Surat': 'Ya',
    'Semakan Dokumen Khas': 'Tidak',
    'Semakan Pasfoto': 'Ya',
    'Keputusan Akhir': 'Tidak Layak',
    'Catatan Pegawai': 'Tinggi tidak mencapai 165cm dan BMI kategori obesiti.',
    'Pegawai Pemeriksa': 'p001'
  }
];

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
    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // Non-negotiable CORS rule
      body: JSON.stringify({ action, token, data })
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
    const pin = data.pin || '';
    if ((id === 'p001' && pin === 'P001@bomba') || (id === 'admin01' && pin === 'Admin@2026!')) {
      const role = id === 'admin01' ? 'superadmin' : 'pegawai';
      const nama = id === 'admin01' ? 'Pentadbir Kanan BFRD' : 'Hj. Razali bin Mahmud';
      return {
        success: true,
        message: 'Log masuk berjaya',
        token: 'demo-hmac-token-' + Date.now(),
        user: { idPegawai: id, role, nama }
      };
    }
    // Benarkan sebarang input bermula p atau admin jika mod demo
    if (id.length >= 3 && pin.length >= 4) {
      const role = id.startsWith('admin') ? 'superadmin' : 'pegawai';
      return {
        success: true,
        message: 'Log masuk mod demo diterima',
        token: 'demo-hmac-token-' + Date.now(),
        user: { idPegawai: id, role, nama: 'Pegawai Pemeriksa (' + id + ')' }
      };
    }
    return { success: false, message: 'ID Pegawai atau PIN tidak sah (Demo: gunakan p001 / P001@bomba)' };
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
  initAppSession();
  setupEventListeners();

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

  // Semak status pengesahan sesi
  checkAuth();
});

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
    navigateTo('dashboard');
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
      STATE.user = {
        token: res.token,
        idPegawai: res.user.idPegawai,
        role: res.user.role,
        nama: res.user.nama
      };

      sessionStorage.setItem('bfrdToken', res.token);
      sessionStorage.setItem('bfrdId', res.user.idPegawai);
      sessionStorage.setItem('bfrdRole', res.user.role);
      sessionStorage.setItem('bfrdNama', res.user.nama);

      showToast(`Selamat bertugas, ${res.user.nama}!`, 'success');
      updateUserInterface();
      checkAuth();
    } else {
      showToast(res.message || 'Log masuk gagal.', 'error');
    }
  } catch (err) {
    showToast('Ralat sambungan pelayan semasa log masuk.', 'error');
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

  // Kemas kini tajuk topbar
  const titles = {
    'dashboard': 'Papan Pemuka Kaunter',
    'kaunter': 'Borang Saringan Fizikal Pemohon',
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
      STATE.jawatanList = JSON.parse(cachedSyarat);
    } catch (e) {
      STATE.jawatanList = SEED_JAWATAN;
    }
  } else {
    // Muat dari API
    const res = await apiGet('getSyaratJawatan');
    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
      STATE.jawatanList = res.data;
      localStorage.setItem('cache_syarat', JSON.stringify(res.data));
      localStorage.setItem('cache_syarat_time', String(Date.now()));
    } else {
      STATE.jawatanList = SEED_JAWATAN;
    }
  }

  // Isi dropdown jawatan
  populateJawatanDropdowns();

  // Muat data pemohon awal
  const resP = await apiGet('getPemohon');
  if (resP.success && Array.isArray(resP.data) && resP.data.length > 0) {
    STATE.pemohonList = resP.data;
  } else {
    STATE.pemohonList = SEED_PEMOHON;
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
  document.getElementById('kpi-hadir').textContent = stats.hadir;
  document.getElementById('kpi-layak').textContent = stats.layak;
  document.getElementById('kpi-semakan').textContent = stats.semakan;
  document.getElementById('kpi-gagal').textContent = stats.gagal;

  const pct = v => stats.hadir > 0 ? Math.round((v / stats.hadir) * 100) : 0;
  document.getElementById('kpi-layak-pct').textContent = `${pct(stats.layak)}% daripada hadir`;
  document.getElementById('kpi-semakan-pct').textContent = `${pct(stats.semakan)}% daripada hadir`;
  document.getElementById('kpi-gagal-pct').textContent = `${pct(stats.gagal)}% daripada hadir`;

  // Render carta
  renderChart(stats);

  // Render aktiviti terkini
  renderDashboardActivity();
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
  handleJawatanChange();
}

function stepVal(id, delta) {
  const input = document.getElementById(id);
  if (!input) return;
  let val = parseFloat(input.value) || 0;
  val = Math.max(parseFloat(input.min) || 0, Math.min(parseFloat(input.max) || 300, val + delta));
  input.value = val.toFixed(1);
  calcBMI();
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
  updateFormProgress();
}

function handleJawatanChange() {
  const sel = document.getElementById('inp-jawatan');
  const selectedName = sel ? sel.value : '';
  const jawatan = STATE.jawatanList.find(j => j['Nama Jawatan'] === selectedName);

  const elInfo = document.getElementById('syarat-tinggi-info');
  const elJulat = document.getElementById('syarat-julat-bmi');

  if (jawatan) {
    const minT = STATE.jantina === 'Lelaki'
      ? (jawatan['Min. Tinggi Lelaki (cm)'] || 0)
      : (jawatan['Min. Tinggi Wanita (cm)'] || 0);

    if (elInfo) elInfo.textContent = minT > 0 ? `Syarat minimum jawatan: ≥ ${minT} cm (${STATE.jantina})` : 'Tiada syarat ketinggian minimum khusus';
    if (elJulat) elJulat.textContent = `BMI ${jawatan['Min. BMI'] || 18.5} - ${jawatan['Maks. BMI'] || 25.0}`;
  } else {
    if (elInfo) elInfo.textContent = 'Syarat minimum jawatan: -';
    if (elJulat) elJulat.textContent = 'BMI 18.5 - 25.0 (Standard)';
  }

  calcBMI();
}

function toggleDoc(idx) {
  STATE.docStatus[idx] = !STATE.docStatus[idx];
  const card = document.querySelector(`.doc-card[data-idx="${idx}"]`);
  if (!card) return;

  const checkbox = card.querySelector('.doc-checkbox');
  const icon = checkbox ? checkbox.querySelector('i') : null;

  if (STATE.docStatus[idx]) {
    card.classList.add('checked');
    if (icon) icon.style.display = 'block';
  } else {
    card.classList.remove('checked');
    if (icon) icon.style.display = 'none';
  }

  calcBMI();
  updateFormProgress();
}

/**
 * Kalkulator BMI Reaktif & Enjin Penentuan Kelayakan Tempatan (Client-Side)
 */
function calcBMI() {
  const inpTinggi = document.getElementById('inp-tinggi');
  const inpBerat = document.getElementById('inp-berat');

  const tinggi = parseFloat(inpTinggi ? inpTinggi.value : 0) || 0;
  const berat = parseFloat(inpBerat ? inpBerat.value : 0) || 0;

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

  const minBMI = jawatan ? parseFloat(jawatan['Min. BMI']) || 18.5 : 18.5;
  const maxBMI = jawatan ? parseFloat(jawatan['Maks. BMI']) || 25.0 : 25.0;
  const minTinggi = jawatan ? (STATE.jantina === 'Lelaki' ? parseFloat(jawatan['Min. Tinggi Lelaki (cm)']) || 0 : parseFloat(jawatan['Min. Tinggi Wanita (cm)']) || 0) : 0;

  // Status BMI
  let statusBMI = 'Tidak Lulus';
  let badgeColor = 'var(--red-bg)';
  let textColor = 'var(--red-text)';
  let gaugeColor = 'var(--red)';
  let gaugeWidth = '100%';

  const bNum = parseFloat(bmiFixed);
  if (bNum >= minBMI && bNum <= maxBMI) {
    statusBMI = 'LULUS';
    badgeColor = 'var(--green-bg)';
    textColor = 'var(--green-text)';
    gaugeColor = 'var(--green)';
    gaugeWidth = '55%';
  } else if (bNum > maxBMI && bNum <= maxBMI + 2.5) {
    statusBMI = 'PERHATIAN';
    badgeColor = 'var(--amber-bg)';
    textColor = 'var(--amber-text)';
    gaugeColor = 'var(--gold)';
    gaugeWidth = '75%';
  } else if (bNum < minBMI) {
    statusBMI = 'KURANG BERAT';
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

  // Enjin Penentuan Kelayakan Akhir
  const docWajib1 = STATE.docStatus[0]; // Surat Panggilan
  const docWajib2 = STATE.docStatus[1]; // Kad Pengenalan
  const docSemuaLengkap = STATE.docStatus.every(d => d === true);
  const tinggiMelepasi = minTinggi === 0 || tinggi >= minTinggi;

  let keputusan = 'Layak';
  let bannerClass = 'layak';
  let iconName = 'check-circle';
  let descText = 'Memenuhi kriteria ketinggian, BMI, serta 6 dokumen lengkap disahkan.';

  if (!docWajib1 || !docWajib2 || statusBMI.includes('GAGAL') || statusBMI.includes('KURANG') || !tinggiMelepasi) {
    keputusan = 'Tidak Layak';
    bannerClass = 'tidak';
    iconName = 'x-circle';
    descText = 'Tidak memenuhi syarat ketinggian minimum, BMI di luar julat, atau dokumen identiti asas tidak lengkap.';
  } else if (!docSemuaLengkap || statusBMI === 'PERHATIAN') {
    keputusan = 'Perlu Semakan';
    bannerClass = 'semakan';
    iconName = 'alert-triangle';
    descText = 'Perlu semakan lanjut panel pemeriksa (BMI dalam zon perhatian atau dokumen sokongan khas belum diserahkan).';
  }

  const elBanner = document.getElementById('keputusan-banner');
  const elKepTxt = document.getElementById('keputusan-text');
  const elKepSub = document.getElementById('keputusan-subtext');
  const elIcon = document.getElementById('keputusan-icon');

  if (elBanner) {
    elBanner.className = `keputusan-banner ${bannerClass}`;
  }
  if (elKepTxt) elKepTxt.textContent = `KEPUTUSAN: ${keputusan.toUpperCase()}`;
  if (elKepSub) elKepSub.textContent = descText;
  if (elIcon) elIcon.setAttribute('data-lucide', iconName);

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
  const nama = document.getElementById('inp-nama').value.trim().toUpperCase();
  const jawatan = document.getElementById('inp-jawatan').value;
  const tlahir = document.getElementById('inp-tlahir').value;
  const umurTxt = document.getElementById('inp-umur').value;
  const tel = document.getElementById('inp-tel').value.trim();
  const emel = document.getElementById('inp-emel').value.trim();
  const tinggi = parseFloat(document.getElementById('inp-tinggi').value) || 0;
  const berat = parseFloat(document.getElementById('inp-berat').value) || 0;
  const bmiVal = parseFloat(document.getElementById('bmi-display-val').textContent) || 0;
  const catatan = document.getElementById('inp-catatan').value.trim();

  // Parse umur
  const umur = parseInt(umurTxt) || 0;

  // Baca status BMI & Keputusan
  const statusBMI = document.getElementById('bmi-status-text').textContent;
  const rawKep = document.getElementById('keputusan-text').textContent;
  let keputusanAkhir = 'Layak';
  if (rawKep.includes('PERLU SEMAKAN')) keputusanAkhir = 'Perlu Semakan';
  if (rawKep.includes('TIDAK LAYAK')) keputusanAkhir = 'Tidak Layak';

  const payload = {
    'No. IC': ic,
    'Nama Penuh': nama,
    'Tarikh Lahir': tlahir,
    'Umur': umur,
    'Jantina': STATE.jantina,
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
    'Catatan Pegawai': catatan || 'Pemeriksaan fizikal selesai tanpa insiden.'
  };

  const btn = document.getElementById('btn-simpan-saringan');
  btn.disabled = true;
  btn.innerHTML = `<span>Menyimpan Rekod...</span>`;

  try {
    const res = await apiPost('simpanPemohon', payload);

    if (res.success) {
      showToast('Rekod berjaya disimpan ke dalam sistem BFRD!', 'success');
      updateNavBadgeCount();

      // Buka modal pratinjau cetak A4
      const recordToPrint = res.data || { ...payload, 'ID Pendaftaran': res.id || 'BFRD-NEW' };
      openPrintModal(recordToPrint);

      // Reset borang
      resetFormSaringan();
    } else {
      showToast(res.message || 'Gagal menyimpan rekod pemohon.', 'error');
    }
  } catch (err) {
    showToast('Ralat rangkaian semasa menyimpan rekod.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i data-lucide="printer"></i><span>Simpan & Cetak Laporan Rasmi</span>`;
    refreshIcons();
  }
}

function resetFormSaringan() {
  document.getElementById('form-saringan').reset();
  setJantina('Lelaki');
  STATE.docStatus = [true, true, true, true, false, true];

  const cards = document.querySelectorAll('.doc-card');
  cards.forEach((card, idx) => {
    const icon = card.querySelector('.doc-checkbox i');
    if (STATE.docStatus[idx]) {
      card.classList.add('checked');
      if (icon) icon.style.display = 'block';
    } else {
      card.classList.remove('checked');
      if (icon) icon.style.display = 'none';
    }
  });

  generateDraftId();
  calcBMI();
  updateFormProgress();
}

// ════════════════════════════════════════════════════════════
// 7. MODAL PRATINJAU CETAK A4 (Brunei Malay Format)
// ════════════════════════════════════════════════════════════

function openPrintModal(p) {
  const modal = document.getElementById('modal-print');
  if (!modal) return;

  // Isi data ke dokumen A4
  document.getElementById('print-ref-id').textContent = p['ID Pendaftaran'] || 'BFRD-20261109-0001';
  document.getElementById('print-tarikh-masa').textContent = p['Tarikh & Masa'] || new Date().toLocaleString('ms-BN');

  document.getElementById('print-nama').textContent = p['Nama Penuh'] || '-';
  document.getElementById('print-ic').textContent = p['No. IC'] || '-';
  document.getElementById('print-umur').textContent = `${p['Tarikh Lahir'] || '-'} (${p['Umur'] || 0} Tahun)`;
  document.getElementById('print-jantina').textContent = p['Jantina'] || 'Lelaki';
  document.getElementById('print-tel').textContent = p['No. Telefon'] || '-';
  document.getElementById('print-jawatan').textContent = p['Jawatan Dipohon'] || '-';

  document.getElementById('print-tinggi').textContent = `${parseFloat(p['Tinggi (cm)'] || 0).toFixed(1)} cm`;
  document.getElementById('print-berat').textContent = `${parseFloat(p['Berat (kg)'] || 0).toFixed(1)} kg`;
  document.getElementById('print-bmi').textContent = parseFloat(p['Nilai BMI'] || 0).toFixed(2);

  const elStatBMI = document.getElementById('print-status-bmi');
  const sBmi = (p['Status BMI'] || 'Lulus').toUpperCase();
  elStatBMI.textContent = sBmi;
  elStatBMI.className = `a4-status-box ${sBmi.includes('LULUS') ? 'a4-status-lulus' : (sBmi.includes('PERHATIAN') ? 'a4-status-perhatian' : 'a4-status-gagal')}`;

  // 6 Dokumen status
  const docFields = [
    'Semakan Surat Panggilan',
    'Semakan Kad Pengenalan',
    'Semakan Sijil Akademik',
    'Semakan CV & Surat',
    'Semakan Dokumen Khas',
    'Semakan Pasfoto'
  ];
  docFields.forEach((field, i) => {
    const el = document.getElementById(`print-doc-${i}`);
    const isOk = p[field] === 'Ya';
    if (el) {
      el.textContent = isOk ? '[ LENGKAP ]' : '[ TIDAK LENGKAP ]';
      el.className = isOk ? 'a4-doc-status-ok' : 'a4-doc-status-miss';
    }
  });

  // Keputusan akhir
  const kep = p['Keputusan Akhir'] || 'Layak';
  const boxKep = document.getElementById('print-keputusan-box');
  const titleKep = document.getElementById('print-keputusan-title');
  const descKep = document.getElementById('print-keputusan-desc');

  if (kep === 'Layak') {
    boxKep.className = 'a4-keputusan layak';
    titleKep.textContent = 'STATUS: LAYAK KE PERINGKAT SETERUSNYA';
    descKep.textContent = 'Pemohon melepasi keseluruhan standard kecergasan fizikal BFRD dan menyerahkan dokumen rasmi yang sah.';
  } else if (kep === 'Perlu Semakan') {
    boxKep.className = 'a4-keputusan semakan';
    titleKep.textContent = 'STATUS: PERLU SEMAKAN LANJUT';
    descKep.textContent = 'Keputusan memerlukan kelulusan khas pegawai atasan atau penyerahan dokumen sokongan tambahan.';
  } else {
    boxKep.className = 'a4-keputusan tidak';
    titleKep.textContent = 'STATUS: TIDAK MELEPASI SYARAT (GAGAL)';
    descKep.textContent = 'Pemohon tidak memenuhi kriteria minimum fizikal (ketinggian/BMI) atau ketiadaan dokumen identiti asas.';
  }

  document.getElementById('print-catatan').textContent = p['Catatan Pegawai'] || 'Tiada catatan tambahan.';

  // Pegawai Bertugas & QR Code
  const officerName = (STATE.user && STATE.user.nama) || 'HJ. RAZALI BIN HJ. MAHMUD';
  document.getElementById('print-officer-name').textContent = officerName;

  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  document.getElementById('print-sign-date').textContent = `${pad(now.getDate())} / ${pad(now.getMonth()+1)} / ${now.getFullYear()}`;

  // QR Code URL
  const qrData = encodeURIComponent(`BFRD|${p['ID Pendaftaran']}|${p['No. IC']}|${kep}`);
  const qrImg = document.getElementById('print-qr-img');
  if (qrImg) {
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${qrData}`;
  }

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
    }
  });
}
