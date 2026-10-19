/**
 * Currency, Date & Number-to-Words (Terbilang) utilities in Indonesian
 */

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatAngka(amount: number): string {
  return new Intl.NumberFormat('id-ID').format(amount);
}

const SATUAN = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

export function terbilang(n: number): string {
  n = Math.floor(Math.abs(n));
  if (n === 0) return 'Nol';
  if (n < 12) return SATUAN[n];
  if (n < 20) return terbilang(n - 10) + ' Belas';
  if (n < 100) return terbilang(Math.floor(n / 10)) + ' Puluh ' + terbilang(n % 10);
  if (n < 200) return 'Seratus ' + terbilang(n - 100);
  if (n < 1000) return terbilang(Math.floor(n / 100)) + ' Ratus ' + terbilang(n % 100);
  if (n < 2000) return 'Seribu ' + terbilang(n - 1000);
  if (n < 1000000) return terbilang(Math.floor(n / 1000)) + ' Ribu ' + terbilang(n % 1000);
  if (n < 1000000000) return terbilang(Math.floor(n / 1000000)) + ' Juta ' + terbilang(n % 1000000);
  if (n < 1000000000000) return terbilang(Math.floor(n / 1000000000)) + ' Milyar ' + terbilang(n % 1000000000);
  return terbilang(Math.floor(n / 1000000000000)) + ' Triliun ' + terbilang(n % 1000000000000);
}

export function terbilangRupiah(amount: number): string {
  const result = terbilang(amount).trim().replace(/\s+/g, ' ');
  return result ? `${result} Rupiah` : 'Nol Rupiah';
}

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function formatTanggalIndo(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const tgl = d.getDate();
    const bln = BULAN[d.getMonth()];
    const thn = d.getFullYear();
    return `${tgl} ${bln} ${thn}`;
  } catch {
    return dateStr;
  }
}

export function getHariDanTanggalLengkap(dateStr: string): { hari: string; tanggal: string; bulan: string; tahun: number; terbilangTanggal: string } {
  try {
    const d = new Date(dateStr);
    const hari = HARI[d.getDay()] || 'Senin';
    const tgl = d.getDate();
    const bulan = BULAN[d.getMonth()] || 'Januari';
    const tahun = d.getFullYear();
    const terbilangTanggal = terbilang(tgl).toLowerCase();
    return {
      hari,
      tanggal: `${tgl}`,
      bulan,
      tahun,
      terbilangTanggal,
    };
  } catch {
    return {
      hari: 'Senin',
      tanggal: '15',
      bulan: 'September',
      tahun: 2022,
      terbilangTanggal: 'lima belas',
    };
  }
}
