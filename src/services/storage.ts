/**
 * Local Data Storage Engine for LPJ BOS Desktop
 * Uses LocalStorage/IndexedDB in Web Mode, with IPC bridge when packaged with Electron + SQLite.
 */

import {
  SchoolProfile,
  FiscalYear,
  LocalUser,
  BkuTransaction,
  Pemasok,
  BudgetCategory,
  SpjDocumentArchive,
  AuditLog,
} from '../types';
import { LOGO_TUT_WURI_B64 } from '../assets/logoTutWuri';

const STORAGE_KEYS = {
  SCHOOL: 'lpj_bos_school',
  FISCAL_YEARS: 'lpj_bos_fiscal_years',
  ACTIVE_YEAR_ID: 'lpj_bos_active_year_id',
  CURRENT_USER: 'lpj_bos_current_user',
  USERS: 'lpj_bos_users',
  CATEGORIES: 'lpj_bos_categories',
  PEMASOK: 'lpj_bos_pemasok',
  TRANSACTIONS: 'lpj_bos_transactions',
  ARCHIVES: 'lpj_bos_archives',
  AUDIT_LOGS: 'lpj_bos_audit_logs',
  SETTINGS: 'lpj_bos_settings',
};

// Initial Seed School Data based on Aceh Tamiang reference
const DEFAULT_SCHOOL: SchoolProfile = {
  id: 'sch-001',
  namaSekolah: 'SD NEGERI BANGUN SARI',
  npsn: '10103248',
  jenjang: 'SD',
  status: 'Negeri',
  kabupaten: 'Kabupaten Aceh Tamiang',
  kecamatan: 'Kecamatan Tamiang Hulu',
  desa: 'Desa Perkebunan Pulau Tiga',
  alamat: 'Dsn. Bangun Sari - Desa Perkebunan Pulau Tiga',
  kodePos: '24478',
  namaKepalaSekolah: 'BUDY DARMADI, S.Pd',
  nipKepalaSekolah: '198404042014101002',
  namaBendahara: 'BUDY DARMADI, S.Pd',
  nipBendahara: '198404042014101002',
  namaPengurusBarang: 'BUDY DARMADI, S.Pd',
  nipPengurusBarang: '198404042014101002',
  rekeningBank: '012-00-112233-4',
  namaBank: 'Bank Aceh Syariah',
  emailSekolah: 'sdnbangunsari.acehtamiang@gmail.com',
  telepon: '0812-6543-9870',
  logoUrl: '/logo_aceh_tamiang.jpg',
  logoKabupatenUrl: '/logo_aceh_tamiang.jpg',
  logoSekolahUrl: LOGO_TUT_WURI_B64,
  namaPemda: 'PEMERINTAH KABUPATEN ACEH TAMIANG',
  namaDinas: 'DINAS PENDIDIKAN DAN KEBUDAYAAN',
  ukuranKertas: 'A4',
  marginTopCm: 2,
  ttdKepalaSekolah: 'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="70" viewBox="0 0 200 70"><path d="M20,45 Q40,15 55,40 T90,20 Q120,50 150,30 T180,45" fill="none" stroke="%230B2545" stroke-width="2.5" stroke-linecap="round"/><path d="M45,25 Q70,55 95,28" fill="none" stroke="%230B2545" stroke-width="2" stroke-linecap="round"/><circle cx="165" cy="40" r="2" fill="%230B2545"/></svg>',
  ttdBendahara: 'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="70" viewBox="0 0 200 70"><path d="M20,45 Q40,15 55,40 T90,20 Q120,50 150,30 T180,45" fill="none" stroke="%230B2545" stroke-width="2.5" stroke-linecap="round"/><path d="M45,25 Q70,55 95,28" fill="none" stroke="%230B2545" stroke-width="2" stroke-linecap="round"/><circle cx="165" cy="40" r="2" fill="%230B2545"/></svg>',
  ttdPengurusBarang: 'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="70" viewBox="0 0 200 70"><path d="M20,45 Q40,15 55,40 T90,20 Q120,50 150,30 T180,45" fill="none" stroke="%230B2545" stroke-width="2.5" stroke-linecap="round"/><path d="M45,25 Q70,55 95,28" fill="none" stroke="%230B2545" stroke-width="2" stroke-linecap="round"/><circle cx="165" cy="40" r="2" fill="%230B2545"/></svg>',
  stempelSekolah: 'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><circle cx="60" cy="60" r="54" fill="none" stroke="%239333ea" stroke-width="2" stroke-dasharray="4,2"/><circle cx="60" cy="60" r="48" fill="none" stroke="%239333ea" stroke-width="1.5"/><text x="50%25" y="45%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="8" font-weight="bold" fill="%239333ea">SDN BANGUN SARI</text><text x="50%25" y="60%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="7" fill="%239333ea">DANA BOS</text></svg>',
};

const DEFAULT_FISCAL_YEARS: FiscalYear[] = [
  {
    id: 'fy-2022',
    tahun: 2022,
    isActive: true,
    paguTotal: 96000000,
    tahap1: 28800000,
    tahap2: 38400000,
    tahap3: 28800000,
    saldoAwal: 0,
  },
  {
    id: 'fy-2024',
    tahun: 2024,
    isActive: false,
    paguTotal: 104500000,
    tahap1: 52250000,
    tahap2: 52250000,
    saldoAwal: 0,
  },
];

const DEFAULT_USERS: LocalUser[] = [
  {
    id: 'usr-1',
    username: 'bendahara',
    fullName: 'BUDY DARMADI, S.Pd',
    role: 'bendahara',
    createdAt: '2022-01-01',
  },
  {
    id: 'usr-2',
    username: 'kepsek',
    fullName: 'BUDY DARMADI, S.Pd (Kepala Sekolah)',
    role: 'kepala_sekolah',
    createdAt: '2022-01-01',
  },
  {
    id: 'usr-3',
    username: 'operator',
    fullName: 'Operator LPJ Sekolah',
    role: 'operator',
    createdAt: '2022-01-01',
  },
  {
    id: 'usr-4',
    username: 'admin',
    fullName: 'Administrator LPJ BOS',
    role: 'admin',
    createdAt: '2022-01-01',
  },
];

const DEFAULT_CATEGORIES: BudgetCategory[] = [
  { id: 'cat-1', kode: '5.1.02.01', nama: 'Pengembangan Perpustakaan & Buku', anggaran: 12000000, realisasi: 3500000 },
  { id: 'cat-2', kode: '5.1.02.02', nama: 'Kegiatan Penerimaan Peserta Didik Baru (PPDB)', anggaran: 8500000, realisasi: 1100000 },
  { id: 'cat-3', kode: '5.1.02.03', nama: 'Kegiatan Pembelajaran dan Ekstrakurikuler', anggaran: 20000000, realisasi: 6400000 },
  { id: 'cat-4', kode: '5.1.02.04', nama: 'Kegiatan Asesmen & Evaluasi Pembelajaran', anggaran: 10000000, realisasi: 2800000 },
  { id: 'cat-5', kode: '5.1.02.05', nama: 'Pengelolaan dan Administrasi Sekolah (ATK & Cetak)', anggaran: 16000000, realisasi: 5250000 },
  { id: 'cat-6', kode: '5.1.02.06', nama: 'Pengembangan Profesi Guru dan Tenaga Kependidikan', anggaran: 7500000, realisasi: 1500000 },
  { id: 'cat-7', kode: '5.1.02.07', nama: 'Langganan Daya dan Jasa (Listrik/Internet)', anggaran: 9000000, realisasi: 3000000 },
  { id: 'cat-8', kode: '5.1.02.08', nama: 'Pemeliharaan Sarana dan Prasarana Sekolah', anggaran: 13000000, realisasi: 4200000 },
];

const DEFAULT_PEMASOK: Pemasok[] = [
  {
    id: 'pem-1',
    namaToko: 'IZZI Fotocopy',
    namaPemilik: 'ROMA DANI',
    alamat: 'Harum Sari, Kec. Tamiang Hulu',
    telepon: '0852-7711-2299',
    npwp: '89.123.456.7-101.000',
    bidangUsaha: 'Penggandaan, Alat Tulis Kantor & Cetak',
    catatan: 'Penyedia formulir pendaftaran, buku catatan, pulpen, dan ATK',
    isActive: true,
    createdAt: '2022-01-10',
    ttdRekanan: 'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="70" viewBox="0 0 200 70"><path d="M25,50 Q45,10 65,35 T110,18 Q140,45 175,25" fill="none" stroke="%23000000" stroke-width="2.5" stroke-linecap="round"/><path d="M35,35 Q60,60 100,30" fill="none" stroke="%23000000" stroke-width="1.8" stroke-linecap="round"/></svg>',
  },
  {
    id: 'pem-2',
    namaToko: 'Toko Buku & ATK Sinar Harapan',
    namaPemilik: 'M. Yusuf',
    alamat: 'Jl. Cut Nyak Dien No. 12, Kualasimpang',
    telepon: '0813-9821-3344',
    npwp: '72.345.678.9-102.000',
    bidangUsaha: 'Buku Pelajaran & Kebutuhan Sekolah',
    catatan: 'Penyedia buku teks kurikulum merdeka dan kamus',
    isActive: true,
    createdAt: '2022-02-15',
  },
  {
    id: 'pem-3',
    namaToko: 'CV Jaya Komputer Mandiri',
    namaPemilik: 'Hendra Gunawan',
    alamat: 'Jl. Rantau Pertamina No. 45, Rantau',
    telepon: '0812-3344-5566',
    npwp: '91.876.543.2-103.000',
    bidangUsaha: 'Komputer, Printer, & Tinta',
    catatan: 'Penyedia cartridge tinta dan servis printer berkala',
    isActive: true,
    createdAt: '2022-03-01',
  },
];

// Initial seeded transactions matching user's exact PDF reference
const DEFAULT_TRANSACTIONS: BkuTransaction[] = [
  {
    id: 'tx-001',
    fiscalYearId: 'fy-2022',
    tanggal: '2022-01-15',
    nomorBukti: 'BOS-01/I/2022',
    jenis: 'penerimaan',
    uraian: 'Penerimaan Dana BOS Reguler Tahap I Tahun 2022 melalui Bank Aceh Syariah',
    sumberDana: 'BOS Reguler',
    kategoriId: 'cat-5',
    kategoriNama: 'Pengelolaan dan Administrasi Sekolah',
    kodeRekening: '4.1.04.01',
    pihakTerkait: 'Kas Daerah / Penyalur BOS',
    nominal: 28800000,
    status: 'disahkan',
    catatan: 'Penyaluran resmi tahap 1 dari rekening kas umum negara/daerah',
    dibuatOleh: 'BUDY DARMADI, S.Pd',
    diperbaruiPada: '2022-01-15 10:00:00',
  },
  {
    id: 'tx-002',
    fiscalYearId: 'fy-2022',
    tanggal: '2022-02-10',
    nomorBukti: 'BOS-02/II/2022',
    jenis: 'pengeluaran',
    uraian: 'Pembayaran langganan daya dan jasa internet bulan Januari - Februari 2022',
    sumberDana: 'BOS Reguler',
    kategoriId: 'cat-7',
    kategoriNama: 'Langganan Daya dan Jasa (Listrik/Internet)',
    kodeRekening: '5.1.02.07',
    pihakTerkait: 'Telkom Indonesia / ISP',
    nominal: 750000,
    status: 'disahkan',
    catatan: 'Bukti pembayaran tagihan internet sekolah',
    dibuatOleh: 'BUDY DARMADI, S.Pd',
    diperbaruiPada: '2022-02-10 11:30:00',
  },
  {
    id: 'tx-003',
    fiscalYearId: 'fy-2022',
    tanggal: '2022-09-15',
    nomorBukti: '421.2/01/2022',
    jenis: 'pengeluaran',
    uraian: 'Pembayaran lunas pengadaan foto copy Formulir Pendaftaran Kelas I SD Negeri Bangun Sari Tahun Pelajaran 2022/2023. Sumber Dana BOS 2022 Sebagaimana faktur terlampir.',
    sumberDana: 'BOS Reguler',
    kategoriId: 'cat-2',
    kategoriNama: 'Kegiatan Penerimaan Peserta Didik Baru (PPDB)',
    kodeRekening: '5.1.02.02',
    pemasokId: 'pem-1',
    pihakTerkait: 'ROMA DANI (IZZI Fotocopy)',
    nominal: 1100000,
    status: 'disahkan',
    catatan: 'Faktur & Surat Pesanan No. 421.2/01/2022 lengkap dengan BAST dan kuitansi',
    dibuatOleh: 'BUDY DARMADI, S.Pd',
    diperbaruiPada: '2022-09-15 14:00:00',
    items: [
      {
        id: 'item-01',
        transaksiId: 'tx-003',
        namaBarang: 'Buku mirage 20 lembar',
        banyaknya: 20,
        satuan: 'Bungkus',
        hargaSatuan: 50000,
        jumlahHarga: 1000000,
        keterangan: 'Untuk formulir dan administrasi peserta didik',
      },
      {
        id: 'item-02',
        transaksiId: 'tx-003',
        namaBarang: 'Pulpen standar',
        banyaknya: 6,
        satuan: 'Kotak',
        hargaSatuan: 15000,
        jumlahHarga: 90000,
        keterangan: 'ATK panitia pendaftaran',
      },
      {
        id: 'item-03',
        transaksiId: 'tx-003',
        namaBarang: 'Kertas Kado',
        banyaknya: 10,
        satuan: 'Lembar',
        hargaSatuan: 1000,
        jumlahHarga: 10000,
        keterangan: 'Penyampulan arsip berkas',
      },
    ],
    fotoBarang: [
      {
        id: 'foto-01',
        transaksiId: 'tx-003',
        namaFile: 'dokumentasi_buku_mirage_pulpen.jpg',
        dataUrl: 'data:image/svg+xml;charset=UTF-8,<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="300" fill="%23e2e8f0"/><text x="50%25" y="45%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%23475569">Dokumentasi Fisik Barang</text><text x="50%25" y="60%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="13" fill="%2364748b">Buku Mirage 20 Bks + Pulpen 6 Ktk</text><rect x="40" y="230" width="320" height="40" fill="%230f172a" rx="4"/><text x="50%25" y="255" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="11" fill="%23ffffff">SD NEGERI BANGUN SARI - DANA BOS 2022</text></svg>',
        keterangan: 'Kondisi fisik barang pesanan saat diterima dari IZZI Fotocopy dalam keadaan baik dan lengkap',
        diunggahPada: '2022-09-15 14:15:00',
        ukuranBytes: 124500,
      },
    ],
  },
  {
    id: 'tx-004',
    fiscalYearId: 'fy-2022',
    tanggal: '2022-09-20',
    nomorBukti: 'BOS-04/IX/2022',
    jenis: 'pengeluaran',
    uraian: 'Pembelian kertas HVS A4 & F4 70gr untuk administrasi penilaian tengah semester',
    sumberDana: 'BOS Reguler',
    kategoriId: 'cat-5',
    kategoriNama: 'Pengelolaan dan Administrasi Sekolah (ATK & Cetak)',
    kodeRekening: '5.1.02.05',
    pemasokId: 'pem-1',
    pihakTerkait: 'ROMA DANI (IZZI Fotocopy)',
    nominal: 850000,
    status: 'siap_periksa',
    catatan: 'Kertas HVS 10 rim',
    dibuatOleh: 'BUDY DARMADI, S.Pd',
    diperbaruiPada: '2022-09-20 09:30:00',
    items: [
      {
        id: 'item-04',
        transaksiId: 'tx-004',
        namaBarang: 'Kertas HVS A4 70gr Sinar Dunia',
        banyaknya: 10,
        satuan: 'Rim',
        hargaSatuan: 55000,
        jumlahHarga: 550000,
      },
      {
        id: 'item-05',
        transaksiId: 'tx-004',
        namaBarang: 'Kertas HVS F4 70gr Sinar Dunia',
        banyaknya: 5,
        satuan: 'Rim',
        hargaSatuan: 60000,
        jumlahHarga: 300000,
      },
    ],
  },
  {
    id: 'tx-005',
    fiscalYearId: 'fy-2022',
    tanggal: '2022-06-12',
    nomorBukti: 'BOS-05/VI/2022',
    jenis: 'penerimaan',
    uraian: 'Penerimaan Dana BOS Reguler Tahap II Tahun 2022',
    sumberDana: 'BOS Reguler',
    kategoriId: 'cat-5',
    kategoriNama: 'Pengelolaan dan Administrasi Sekolah',
    kodeRekening: '4.1.04.01',
    pihakTerkait: 'Kas Daerah / Penyalur BOS',
    nominal: 38400000,
    status: 'disahkan',
    dibuatOleh: 'BUDY DARMADI, S.Pd',
    diperbaruiPada: '2022-06-12 11:00:00',
  },
];

const DEFAULT_ARCHIVES: SpjDocumentArchive[] = [
  {
    id: 'arc-001',
    transaksiId: 'tx-003',
    nomorSpj: 'SPJ-2022/421.2-01',
    nomorBukti: '421.2/01/2022',
    tanggalSpj: '2022-09-15',
    tahunAnggaran: 2022,
    pemasokNama: 'IZZI Fotocopy (ROMA DANI)',
    totalNilai: 1100000,
    jenisDokumenTermasuk: ['surat_pesanan', 'faktur', 'bast', 'kuitansi', 'foto'],
    pdfFileName: 'SPJ_421.2_01_2022_SDN_Bangun_Sari.pdf',
    versi: 1,
    status: 'Disahkan',
    dibuatPada: '2022-09-15 15:00:00',
    dibuatOleh: 'BUDY DARMADI, S.Pd',
  },
];

const DEFAULT_AUDIT: AuditLog[] = [
  {
    id: 'aud-1',
    waktu: '2022-09-15 14:00:00',
    user: 'BUDY DARMADI, S.Pd',
    aksi: 'SIMPAN_TRANSAKSI',
    detail: 'Menyimpan transaksi belanja formulir pendaftaran Rp 1.100.000 No 421.2/01/2022',
    ip: '127.0.0.1 (Localhost)',
  },
  {
    id: 'aud-2',
    waktu: '2022-09-15 15:00:00',
    user: 'BUDY DARMADI, S.Pd',
    aksi: 'GENERATE_SPJ_PDF',
    detail: 'Menghasilkan dokumen resmi SPJ 4-in-1 dan pengarsipan lokal',
    ip: '127.0.0.1 (Localhost)',
  },
];

class LocalStorageEngine {
  private isInitialized = false;

  constructor() {
    this.init();
  }

  public init() {
    if (this.isInitialized) return;
    try {
      if (!localStorage.getItem(STORAGE_KEYS.SCHOOL)) {
        localStorage.setItem(STORAGE_KEYS.SCHOOL, JSON.stringify(DEFAULT_SCHOOL));
      }
      if (!localStorage.getItem(STORAGE_KEYS.FISCAL_YEARS)) {
        localStorage.setItem(STORAGE_KEYS.FISCAL_YEARS, JSON.stringify(DEFAULT_FISCAL_YEARS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.ACTIVE_YEAR_ID)) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_YEAR_ID, 'fy-2022');
      }
      if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(DEFAULT_USERS[0]));
      }
      if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
      }
      if (!localStorage.getItem(STORAGE_KEYS.PEMASOK)) {
        localStorage.setItem(STORAGE_KEYS.PEMASOK, JSON.stringify(DEFAULT_PEMASOK));
      }
      if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(DEFAULT_TRANSACTIONS));
      }
      if (!localStorage.getItem(STORAGE_KEYS.ARCHIVES)) {
        localStorage.setItem(STORAGE_KEYS.ARCHIVES, JSON.stringify(DEFAULT_ARCHIVES));
      }
      if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
        localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(DEFAULT_AUDIT));
      }
      this.isInitialized = true;
    } catch (e) {
      console.warn('Storage init warning:', e);
    }
  }

  // School Profile
  getSchoolProfile(): SchoolProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SCHOOL);
      if (data) {
        const parsed = JSON.parse(data);
        return {
          ...DEFAULT_SCHOOL,
          ...parsed,
          ukuranKertas: parsed.ukuranKertas || DEFAULT_SCHOOL.ukuranKertas || 'A4',
          marginTopCm: typeof parsed.marginTopCm === 'number' ? parsed.marginTopCm : DEFAULT_SCHOOL.marginTopCm,
          logoKabupatenUrl: parsed.logoKabupatenUrl || parsed.logoUrl || DEFAULT_SCHOOL.logoKabupatenUrl,
          logoSekolahUrl: parsed.logoSekolahUrl || DEFAULT_SCHOOL.logoSekolahUrl,
        };
      }
      return DEFAULT_SCHOOL;
    } catch {
      return DEFAULT_SCHOOL;
    }
  }

  saveSchoolProfile(profile: SchoolProfile): void {
    localStorage.setItem(STORAGE_KEYS.SCHOOL, JSON.stringify(profile));
    this.logAction('UBAH_PROFIL_SEKOLAH', `Memperbarui data sekolah: ${profile.namaSekolah}`);
  }

  // Fiscal Years
  getFiscalYears(): FiscalYear[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FISCAL_YEARS);
      return data ? JSON.parse(data) : DEFAULT_FISCAL_YEARS;
    } catch {
      return DEFAULT_FISCAL_YEARS;
    }
  }

  getActiveFiscalYear(): FiscalYear {
    const years = this.getFiscalYears();
    const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_YEAR_ID) || 'fy-2022';
    return years.find((y) => y.id === activeId) || years[0];
  }

  setActiveFiscalYear(yearId: string): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_YEAR_ID, yearId);
    const years = this.getFiscalYears().map((y) => ({
      ...y,
      isActive: y.id === yearId,
    }));
    localStorage.setItem(STORAGE_KEYS.FISCAL_YEARS, JSON.stringify(years));
    this.logAction('GANTI_TAHUN_ANGGARAN', `Mengganti tahun anggaran aktif ke ID ${yearId}`);
  }

  saveFiscalYear(year: FiscalYear): void {
    const years = this.getFiscalYears();
    const index = years.findIndex((y) => y.id === year.id);
    if (index >= 0) {
      years[index] = year;
    } else {
      years.push(year);
    }
    localStorage.setItem(STORAGE_KEYS.FISCAL_YEARS, JSON.stringify(years));
  }

  // Users & Auth
  getUsers(): LocalUser[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      return data ? JSON.parse(data) : DEFAULT_USERS;
    } catch {
      return DEFAULT_USERS;
    }
  }

  getCurrentUser(): LocalUser {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return data ? JSON.parse(data) : DEFAULT_USERS[0];
    } catch {
      return DEFAULT_USERS[0];
    }
  }

  setCurrentUser(user: LocalUser): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    this.logAction('LOGIN', `Pengguna ${user.fullName} (${user.role}) aktif`);
  }

  saveUser(user: LocalUser): void {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      users[idx] = user;
    } else {
      users.push(user);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  // Budget Categories
  getCategories(): BudgetCategory[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return data ? JSON.parse(data) : DEFAULT_CATEGORIES;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  }

  saveCategory(cat: BudgetCategory): void {
    const list = this.getCategories();
    const idx = list.findIndex((c) => c.id === cat.id);
    if (idx >= 0) {
      list[idx] = cat;
    } else {
      list.push(cat);
    }
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(list));
  }

  // Pemasok
  getPemasok(): Pemasok[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PEMASOK);
      return data ? JSON.parse(data) : DEFAULT_PEMASOK;
    } catch {
      return DEFAULT_PEMASOK;
    }
  }

  savePemasok(pemasok: Pemasok): void {
    const list = this.getPemasok();
    const idx = list.findIndex((p) => p.id === pemasok.id);
    if (idx >= 0) {
      list[idx] = pemasok;
    } else {
      list.push(pemasok);
    }
    localStorage.setItem(STORAGE_KEYS.PEMASOK, JSON.stringify(list));
    this.logAction('SIMPAN_PEMASOK', `Menyimpan data pemasok ${pemasok.namaToko}`);
  }

  // Transactions (BKU)
  getTransactions(fiscalYearId?: string): BkuTransaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      const all: BkuTransaction[] = data ? JSON.parse(data) : DEFAULT_TRANSACTIONS;
      if (fiscalYearId) {
        return all.filter((t) => t.fiscalYearId === fiscalYearId);
      }
      return all;
    } catch {
      return DEFAULT_TRANSACTIONS;
    }
  }

  getTransactionById(id: string): BkuTransaction | undefined {
    return this.getTransactions().find((t) => t.id === id);
  }

  saveTransaction(tx: BkuTransaction): { success: boolean; error?: string } {
    try {
      const list = this.getTransactions();
      const activeYear = this.getActiveFiscalYear();
      if (!tx.fiscalYearId) {
        tx.fiscalYearId = activeYear.id;
      }

      // Check unique nomor bukti in same year if not same tx id
      const duplicate = list.find(
        (item) =>
          item.id !== tx.id &&
          item.fiscalYearId === tx.fiscalYearId &&
          item.nomorBukti.trim().toLowerCase() === tx.nomorBukti.trim().toLowerCase() &&
          item.status !== 'dibatalkan'
      );

      if (duplicate) {
        return {
          success: false,
          error: `Nomor Bukti "${tx.nomorBukti}" sudah pernah digunakan pada transaksi lain tahun ${activeYear.tahun}!`,
        };
      }

      const idx = list.findIndex((t) => t.id === tx.id);
      if (idx >= 0) {
        list[idx] = { ...tx, diperbaruiPada: new Date().toISOString() };
      } else {
        list.push({ ...tx, diperbaruiPada: new Date().toISOString() });
      }

      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(list));
      this.recalculateCategoryRealization();
      this.logAction('SIMPAN_BKU', `Transaksi ${tx.nomorBukti} (${tx.jenis}) Rp ${tx.nominal.toLocaleString('id-ID')}`);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal menyimpan transaksi.' };
    }
  }

  cancelTransaction(id: string, reason: string): boolean {
    const list = this.getTransactions();
    const idx = list.findIndex((t) => t.id === id);
    if (idx >= 0) {
      list[idx].status = 'dibatalkan';
      list[idx].alasanBatal = reason;
      list[idx].dibatalkanPada = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(list));
      this.recalculateCategoryRealization();
      this.logAction('BATAL_TRANSAKSI', `Membatalkan transaksi ${list[idx].nomorBukti}: ${reason}`);
      return true;
    }
    return false;
  }

  // Calculate Real-time BKU Balances
  calculateBalances(fiscalYearId: string) {
    const txs = this.getTransactions(fiscalYearId)
      .filter((t) => t.status !== 'dibatalkan')
      .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

    let totalPenerimaan = 0;
    let totalPengeluaran = 0;

    const computed = txs.map((tx) => {
      if (tx.jenis === 'penerimaan') {
        totalPenerimaan += tx.nominal;
      } else {
        totalPengeluaran += tx.nominal;
      }
      return {
        ...tx,
        runningSaldo: totalPenerimaan - totalPengeluaran,
      };
    });

    const year = this.getFiscalYears().find((y) => y.id === fiscalYearId);
    const paguTotal = year?.paguTotal || 0;
    const sisaAnggaran = Math.max(0, paguTotal - totalPengeluaran);
    const saldoKasSaatIni = totalPenerimaan - totalPengeluaran;
    const progressLpj = paguTotal > 0 ? Math.min(100, Math.round((totalPengeluaran / paguTotal) * 100)) : 0;

    return {
      transactionsWithSaldo: computed,
      totalPenerimaan,
      totalPengeluaran,
      saldoKasSaatIni,
      paguTotal,
      sisaAnggaran,
      progressLpj,
    };
  }

  recalculateCategoryRealization() {
    const activeYear = this.getActiveFiscalYear();
    const txs = this.getTransactions(activeYear.id).filter(
      (t) => t.status !== 'dibatalkan' && t.jenis === 'pengeluaran'
    );
    const categories = this.getCategories();

    const sumMap: Record<string, number> = {};
    for (const t of txs) {
      sumMap[t.kategoriId] = (sumMap[t.kategoriId] || 0) + t.nominal;
    }

    const updated = categories.map((c) => ({
      ...c,
      realisasi: sumMap[c.id] || 0,
    }));

    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updated));
  }

  // Archives
  getArchives(fiscalYear?: number): SpjDocumentArchive[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ARCHIVES);
      const all: SpjDocumentArchive[] = data ? JSON.parse(data) : DEFAULT_ARCHIVES;
      if (fiscalYear) {
        return all.filter((a) => a.tahunAnggaran === fiscalYear);
      }
      return all;
    } catch {
      return DEFAULT_ARCHIVES;
    }
  }

  saveArchive(archive: SpjDocumentArchive): void {
    const list = this.getArchives();
    const idx = list.findIndex((a) => a.id === archive.id);
    if (idx >= 0) {
      list[idx] = archive;
    } else {
      list.unshift(archive);
    }
    localStorage.setItem(STORAGE_KEYS.ARCHIVES, JSON.stringify(list));
    this.logAction('ARSIP_DOKUMEN', `Menyimpan arsip SPJ ${archive.nomorSpj} (${archive.pdfFileName})`);
  }

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      return data ? JSON.parse(data) : DEFAULT_AUDIT;
    } catch {
      return DEFAULT_AUDIT;
    }
  }

  logAction(aksi: string, detail: string): void {
    try {
      const logs = this.getAuditLogs();
      const currentUser = this.getCurrentUser();
      const newLog: AuditLog = {
        id: 'aud-' + Date.now(),
        waktu: new Date().toLocaleString('id-ID'),
        user: currentUser?.fullName || 'Pengguna Lokal',
        aksi,
        detail,
        ip: '127.0.0.1 (Lokal Windows)',
      };
      logs.unshift(newLog);
      // keep max 200 logs
      if (logs.length > 200) logs.pop();
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
    } catch (e) {
      console.warn('Logging error:', e);
    }
  }

  // Full Local Backup & Restore
  exportFullBackup(): string {
    const backupData = {
      app: 'LPJ BOS Desktop',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      school: this.getSchoolProfile(),
      fiscalYears: this.getFiscalYears(),
      categories: this.getCategories(),
      pemasok: this.getPemasok(),
      transactions: this.getTransactions(),
      archives: this.getArchives(),
      auditLogs: this.getAuditLogs(),
    };
    this.logAction('BACKUP_DATA', 'Melakukan backup penuh database lokal ke format arsip');
    return JSON.stringify(backupData, null, 2);
  }

  importFullBackup(jsonContent: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonContent);
      if (!parsed.school || !parsed.transactions || !Array.isArray(parsed.transactions)) {
        return { success: false, message: 'Format file cadangan tidak valid atau rusak.' };
      }

      // Safety check: Create emergency auto-backup first before overwrite
      const emergencyKey = 'lpj_bos_emergency_pre_restore';
      localStorage.setItem(emergencyKey, this.exportFullBackup());

      localStorage.setItem(STORAGE_KEYS.SCHOOL, JSON.stringify(parsed.school));
      if (parsed.fiscalYears) localStorage.setItem(STORAGE_KEYS.FISCAL_YEARS, JSON.stringify(parsed.fiscalYears));
      if (parsed.categories) localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(parsed.categories));
      if (parsed.pemasok) localStorage.setItem(STORAGE_KEYS.PEMASOK, JSON.stringify(parsed.pemasok));
      if (parsed.transactions) localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(parsed.transactions));
      if (parsed.archives) localStorage.setItem(STORAGE_KEYS.ARCHIVES, JSON.stringify(parsed.archives));

      this.logAction('RESTORE_DATA', `Memulihkan database dari file cadangan (${parsed.transactions.length} transaksi)`);
      return {
        success: true,
        message: `Data berhasil dipulihkan: ${parsed.transactions.length} transaksi, ${parsed.pemasok?.length || 0} pemasok, dan profil sekolah diperbarui.`,
      };
    } catch (err: any) {
      return { success: false, message: 'Gagal memproses file: ' + err.message };
    }
  }

  // Reset to initial clean state if requested
  resetToDefault(): void {
    localStorage.removeItem(STORAGE_KEYS.SCHOOL);
    localStorage.removeItem(STORAGE_KEYS.FISCAL_YEARS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_YEAR_ID);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.PEMASOK);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.ARCHIVES);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    this.isInitialized = false;
    this.init();
  }
}

export const localDB = new LocalStorageEngine();
