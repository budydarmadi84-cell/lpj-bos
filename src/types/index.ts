/**
 * Data Types for LPJ BOS Desktop
 */

export type UserRole = 'admin' | 'bendahara' | 'kepala_sekolah' | 'pengawas' | 'operator';

export interface LocalUser {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  passwordHash?: string;
  avatar?: string;
  lastLogin?: string;
  createdAt: string;
}

export interface SchoolProfile {
  id: string;
  namaSekolah: string;
  npsn: string;
  jenjang: string;
  status: 'Negeri' | 'Swasta';
  kabupaten: string;
  kecamatan: string;
  desa: string;
  alamat: string;
  kodePos: string;
  namaKepalaSekolah: string;
  nipKepalaSekolah: string;
  namaBendahara: string;
  nipBendahara: string;
  namaPengurusBarang: string;
  nipPengurusBarang: string;
  rekeningBank: string;
  namaBank: string;
  emailSekolah: string;
  telepon: string;
  logoUrl?: string;
  logoKabupatenUrl?: string; // Logo Pemerintah Daerah / Kabupaten (di sebelah kiri kop surat)
  logoSekolahUrl?: string; // Logo Satuan Pendidikan / Sekolah (di sebelah kanan kop surat)
  namaPemda?: string; // Format teks baris 1 kop surat (misal: PEMERINTAH KABUPATEN ACEH TAMIANG)
  namaDinas?: string; // Format teks baris 2 kop surat (misal: DINAS PENDIDIKAN DAN KEBUDAYAAN)
  ukuranKertas?: 'A4' | 'F4'; // Pilihan ukuran kertas: 'A4' (210 x 297 mm) atau 'F4' (8.5" x 13" / 215.9 x 330.2 mm)
  marginTopCm?: number; // Margin atas kop surat dalam cm (default 2 cm)
  ttdKepalaSekolah?: string; // base64 dataUrl of electronic signature
  ttdBendahara?: string; // base64 dataUrl of electronic signature
  ttdPengurusBarang?: string; // base64 dataUrl of electronic signature
  stempelSekolah?: string; // base64 dataUrl of school stamp
}

export interface FiscalYear {
  id: string;
  tahun: number;
  isActive: boolean;
  paguTotal: number;
  tahap1: number;
  tahap2: number;
  tahap3?: number;
  saldoAwal: number;
}

export type TransactionType = 'penerimaan' | 'pengeluaran';
export type TransactionStatus = 'disahkan' | 'siap_periksa' | 'proses' | 'konsep' | 'dibatalkan';

export interface BkuTransaction {
  id: string;
  fiscalYearId: string;
  tanggal: string; // YYYY-MM-DD
  nomorBukti: string;
  jenis: TransactionType;
  uraian: string;
  sumberDana: 'BOS Reguler' | 'BOS Kinerja' | 'BOS Afirmasi' | 'BOSDA' | 'Silpa BOS';
  kategoriId: string;
  kategoriNama: string;
  kodeRekening: string;
  pemasokId?: string;
  pihakTerkait: string;
  nominal: number;
  status: TransactionStatus;
  catatan?: string;
  alasanBatal?: string;
  dibatalkanPada?: string;
  dibuatOleh: string;
  diperbaruiPada: string;
  items?: BelanjaItem[];
  fotoBarang?: FotoBarang[];
  spjId?: string;
}

export interface BelanjaItem {
  id: string;
  transaksiId: string;
  namaBarang: string;
  banyaknya: number;
  satuan: string; // misal: Bungkus, Kotak, Lembar, Rim, Pcs, Paket
  hargaSatuan: number;
  jumlahHarga: number; // banyaknya * hargaSatuan
  keterangan?: string;
}

export interface FotoBarang {
  id: string;
  transaksiId: string;
  itemId?: string;
  namaFile: string;
  dataUrl: string; // base64 representation for offline portability
  keterangan: string;
  diunggahPada: string;
  ukuranBytes: number;
}

export interface Pemasok {
  id: string;
  namaToko: string;
  namaPemilik: string;
  alamat: string;
  telepon: string;
  npwp?: string;
  bidangUsaha: string;
  catatan?: string;
  isActive: boolean;
  createdAt: string;
  ttdRekanan?: string;
  stempelToko?: string;
}

export interface BudgetCategory {
  id: string;
  kode: string;
  nama: string;
  anggaran: number;
  realisasi: number;
}

export interface SpjDocumentArchive {
  id: string;
  transaksiId: string;
  nomorSpj: string;
  nomorBukti: string;
  tanggalSpj: string;
  tahunAnggaran: number;
  pemasokNama: string;
  totalNilai: number;
  jenisDokumenTermasuk: string[]; // ['surat_pesanan', 'faktur', 'bast', 'kuitansi', 'foto']
  pdfFileName: string;
  versi: number;
  status: 'Disahkan' | 'Siap Diperiksa' | 'Konsep';
  dibuatPada: string;
  dibuatOleh: string;
  pdfDataUrl?: string; // stored locally
}

export interface AuditLog {
  id: string;
  waktu: string;
  user: string;
  aksi: string;
  detail: string;
  ip: string;
}
