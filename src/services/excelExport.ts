/**
 * Excel Export Service for LPJ BOS Desktop
 * Generates XLSX workbooks for BKU, Belanja, and SPJ
 */

import * as XLSX from 'xlsx';
import { BkuTransaction, SchoolProfile, FiscalYear, BudgetCategory } from '../types';
import { formatTanggalIndo } from '../utils/formatters';

export function exportBkuToExcel(
  transactions: BkuTransaction[],
  school: SchoolProfile,
  year: FiscalYear
) {
  const wb = XLSX.utils.book_new();

  // Prepare header info
  const headerRows = [
    ['PEMERINTAH KABUPATEN ACEH TAMIANG'],
    ['DINAS PENDIDIKAN DAN KEBUDAYAAN'],
    [school.namaSekolah.toUpperCase()],
    [`BUKU KAS UMUM (BKU) DANA BOS TAHUN ANGGARAN ${year.tahun}`],
    [`Alamat: ${school.alamat}`],
    [],
    ['No', 'Tanggal', 'Nomor Bukti', 'Kode Rekening', 'Uraian Transaksi', 'Penerimaan (Rp)', 'Pengeluaran (Rp)', 'Saldo (Rp)', 'Status'],
  ];

  let runningSaldo = year.saldoAwal || 0;
  let totalPenerimaan = 0;
  let totalPengeluaran = 0;

  const dataRows: any[] = [];

  // Saldo awal row
  dataRows.push([
    '-',
    `${year.tahun}-01-01`,
    'SALDO-AWAL',
    '-',
    'Saldo Kas Awal Tahun Anggaran',
    runningSaldo,
    0,
    runningSaldo,
    'Sah',
  ]);

  transactions
    .filter((t) => t.status !== 'dibatalkan')
    .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime())
    .forEach((tx, idx) => {
      const penerimaan = tx.jenis === 'penerimaan' ? tx.nominal : 0;
      const pengeluaran = tx.jenis === 'pengeluaran' ? tx.nominal : 0;
      totalPenerimaan += penerimaan;
      totalPengeluaran += pengeluaran;
      runningSaldo = runningSaldo + penerimaan - pengeluaran;

      dataRows.push([
        idx + 1,
        formatTanggalIndo(tx.tanggal),
        tx.nomorBukti,
        tx.kodeRekening || '-',
        tx.uraian,
        penerimaan,
        pengeluaran,
        runningSaldo,
        tx.status.toUpperCase(),
      ]);
    });

  // Total summary row
  dataRows.push([]);
  dataRows.push([
    '',
    '',
    '',
    'TOTAL',
    'Jumlah Penerimaan & Pengeluaran',
    totalPenerimaan,
    totalPengeluaran,
    runningSaldo,
    '',
  ]);

  // Signatures
  dataRows.push([]);
  dataRows.push([]);
  dataRows.push([
    '',
    'Mengetahui,',
    '',
    '',
    '',
    '',
    `Tamiang Hulu, ${formatTanggalIndo(new Date().toISOString().split('T')[0])}`,
  ]);
  dataRows.push([
    '',
    `Kepala ${school.namaSekolah}`,
    '',
    '',
    '',
    '',
    'Bendahara BOS',
  ]);
  dataRows.push([]);
  dataRows.push([]);
  dataRows.push([
    '',
    school.namaKepalaSekolah,
    '',
    '',
    '',
    '',
    school.namaBendahara,
  ]);
  dataRows.push([
    '',
    `NIP. ${school.nipKepalaSekolah}`,
    '',
    '',
    '',
    '',
    `NIP. ${school.nipBendahara}`,
  ]);

  const allRows = [...headerRows, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  // Column widths
  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 16 }, // Tanggal
    { wch: 20 }, // Nomor Bukti
    { wch: 14 }, // Kode Rek
    { wch: 45 }, // Uraian
    { wch: 18 }, // Penerimaan
    { wch: 18 }, // Pengeluaran
    { wch: 18 }, // Saldo
    { wch: 12 }, // Status
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'BKU BOS ' + year.tahun);

  // Download trigger
  const fileName = `BKU_BOS_${year.tahun}_${school.namaSekolah.replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export function exportRealisasiToExcel(
  categories: BudgetCategory[],
  school: SchoolProfile,
  year: FiscalYear
) {
  const wb = XLSX.utils.book_new();

  const header = [
    [school.namaSekolah.toUpperCase()],
    [`LAPORAN REALISASI ANGGARAN BOS TAHUN ${year.tahun}`],
    [],
    ['No', 'Kode Rekening', 'Komponen / Kategori Anggaran', 'Pagu Anggaran (Rp)', 'Realisasi (Rp)', 'Sisa Anggaran (Rp)', '% Capaian'],
  ];

  let totalAnggaran = 0;
  let totalRealisasi = 0;

  const rows = categories.map((c, i) => {
    totalAnggaran += c.anggaran;
    totalRealisasi += c.realisasi;
    const sisa = Math.max(0, c.anggaran - c.realisasi);
    const pct = c.anggaran > 0 ? ((c.realisasi / c.anggaran) * 100).toFixed(1) + '%' : '0%';

    return [
      i + 1,
      c.kode,
      c.nama,
      c.anggaran,
      c.realisasi,
      sisa,
      pct,
    ];
  });

  rows.push([]);
  const totalSisa = Math.max(0, totalAnggaran - totalRealisasi);
  const totalPct = totalAnggaran > 0 ? ((totalRealisasi / totalAnggaran) * 100).toFixed(1) + '%' : '0%';
  rows.push(['', '', 'TOTAL SELURUH KOMPONEN', totalAnggaran, totalRealisasi, totalSisa, totalPct]);

  const ws = XLSX.utils.aoa_to_sheet([...header, ...rows]);
  ws['!cols'] = [
    { wch: 5 },
    { wch: 14 },
    { wch: 45 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 12 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Realisasi Anggaran');
  XLSX.writeFile(wb, `Realisasi_BOS_${year.tahun}_${school.namaSekolah.replace(/\s+/g, '_')}.xlsx`);
}
