import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  PieChart,
  BookOpenCheck,
} from 'lucide-react';
import { BkuTransaction, SchoolProfile, FiscalYear, BudgetCategory } from '../../types';
import { formatRupiah, formatTanggalIndo } from '../../utils/formatters';
import { exportBkuToExcel, exportRealisasiToExcel } from '../../services/excelExport';
import { KopSurat } from '../common/KopSurat';

interface LaporanViewProps {
  transactions: BkuTransaction[];
  school: SchoolProfile;
  fiscalYear: FiscalYear;
  categories: BudgetCategory[];
}

export const LaporanView: React.FC<LaporanViewProps> = ({
  transactions,
  school,
  fiscalYear,
  categories,
}) => {
  const [activeReportTab, setActiveReportTab] = useState<'bku' | 'realisasi'>('bku');

  const validTransactions = transactions
    .filter((t) => t.status !== 'dibatalkan')
    .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

  let running = fiscalYear.saldoAwal || 0;
  let totalMasuk = 0;
  let totalKeluar = 0;

  const [paperSize, setPaperSize] = useState<'A4' | 'F4'>(school.ukuranKertas || 'A4');

  const bkuRows = validTransactions.map((tx) => {
    const masuk = tx.jenis === 'penerimaan' ? tx.nominal : 0;
    const keluar = tx.jenis === 'pengeluaran' ? tx.nominal : 0;
    totalMasuk += masuk;
    totalKeluar += keluar;
    running = running + masuk - keluar;
    return {
      ...tx,
      masuk,
      keluar,
      saldo: running,
    };
  });

  return (
    <div className="space-y-6">
      {/* 1. Header & Report Selector */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-emerald-600" />
            Laporan Keuangan & Rekapitulasi BOS
          </h3>
          <p className="text-xs text-slate-500">
            Cetak dan ekspor laporan pembukuan resmi Tahun Anggaran {fiscalYear.tahun}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveReportTab('bku')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeReportTab === 'bku'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Laporan BKU Lengkap
          </button>
          <button
            onClick={() => setActiveReportTab('realisasi')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeReportTab === 'realisasi'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Laporan Realisasi Pagu
          </button>
        </div>
      </div>

      {/* 2. Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Paper Selector for Reports */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 px-2">Ukuran Cetak:</span>
          <button
            type="button"
            onClick={() => setPaperSize('A4')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              paperSize === 'A4'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-50'
            }`}
          >
            📄 A4 (210×297 mm)
          </button>
          <button
            type="button"
            onClick={() => setPaperSize('F4')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              paperSize === 'F4'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-50'
            }`}
          >
            📜 F4 / Folio (8,5" × 13")
          </button>
        </div>

        <div>
          {activeReportTab === 'bku' ? (
            <button
              onClick={() => exportBkuToExcel(transactions, school, fiscalYear)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 active:scale-95 transition-all"
            >
              <Download size={14} />
              <span>Unduh Laporan BKU (.XLSX)</span>
            </button>
          ) : (
            <button
              onClick={() => exportRealisasiToExcel(categories, school, fiscalYear)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 active:scale-95 transition-all"
            >
              <Download size={14} />
              <span>Unduh Realisasi Belanja (.XLSX)</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Printable Report Card */}
      <div
        className={`bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6 font-bookman ${
          paperSize === 'F4' ? 'max-w-5xl mx-auto' : ''
        }`}
        style={{ fontFamily: "'Bookman Old Style', 'URW Bookman', 'Bookman', 'TeX Gyre Bonum', 'Lora', serif" }}
      >
        {/* Printable Header Sesuai Aturan Kop Surat Resmi (Logo Kabupaten Kiri & Tulisan Center) */}
        <KopSurat
          school={school}
          subTitle={
            activeReportTab === 'bku'
              ? `BUKU KAS UMUM (BKU) DANA BOS TAHUN ANGGARAN ${fiscalYear.tahun}`
              : `LAPORAN REALISASI ANGGARAN BOS TAHUN ${fiscalYear.tahun}`
          }
          showBadges={true}
          paperSize={paperSize}
          marginTopCm={school.marginTopCm ?? 2}
        />

        {/* Tab 1: Table BKU */}
        {activeReportTab === 'bku' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-300">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold">
                  <th className="p-2.5 border-r border-slate-300 w-10 text-center">No</th>
                  <th className="p-2.5 border-r border-slate-300 w-28 text-center">Tanggal</th>
                  <th className="p-2.5 border-r border-slate-300 w-32 text-center">Nomor Bukti</th>
                  <th className="p-2.5 border-r border-slate-300 text-center">Uraian Transaksi</th>
                  <th className="p-2.5 border-r border-slate-300 w-28 text-center">Penerimaan</th>
                  <th className="p-2.5 border-r border-slate-300 w-28 text-center">Pengeluaran</th>
                  <th className="p-2.5 w-32 text-center">Saldo Kas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr className="bg-slate-50 font-semibold text-slate-600">
                  <td className="p-2 border-r border-slate-300 text-center">-</td>
                  <td className="p-2 border-r border-slate-300">{fiscalYear.tahun}-01-01</td>
                  <td className="p-2 border-r border-slate-300 font-mono">SALDO-AWAL</td>
                  <td className="p-2 border-r border-slate-300">Saldo Kas Awal Tahun Anggaran</td>
                  <td className="p-2 border-r border-slate-300 text-right">{formatRupiah(fiscalYear.saldoAwal || 0)}</td>
                  <td className="p-2 border-r border-slate-300 text-right">-</td>
                  <td className="p-2 text-right font-bold text-blue-900">{formatRupiah(fiscalYear.saldoAwal || 0)}</td>
                </tr>

                {bkuRows.map((r, i) => (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="p-2 border-r border-slate-300 text-center text-slate-400">{i + 1}</td>
                    <td className="p-2 border-r border-slate-300 whitespace-nowrap">{formatTanggalIndo(r.tanggal)}</td>
                    <td className="p-2 border-r border-slate-300 font-mono font-bold text-blue-800">{r.nomorBukti}</td>
                    <td className="p-2 border-r border-slate-300">{r.uraian}</td>
                    <td className="p-2 border-r border-slate-300 text-right font-mono text-emerald-700">
                      {r.masuk > 0 ? formatRupiah(r.masuk) : '-'}
                    </td>
                    <td className="p-2 border-r border-slate-300 text-right font-mono text-rose-700">
                      {r.keluar > 0 ? formatRupiah(r.keluar) : '-'}
                    </td>
                    <td className="p-2 text-right font-mono font-bold text-slate-900 bg-slate-50/50">
                      {formatRupiah(r.saldo)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold">
                  <td colSpan={4} className="p-2.5 text-right border-r border-slate-300">TOTAL</td>
                  <td className="p-2.5 text-right font-mono text-emerald-800 border-r border-slate-300">{formatRupiah(totalMasuk)}</td>
                  <td className="p-2.5 text-right font-mono text-rose-800 border-r border-slate-300">{formatRupiah(totalKeluar)}</td>
                  <td className="p-2.5 text-right font-mono text-blue-900">{formatRupiah(running)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Tab 2: Table Realisasi */}
        {activeReportTab === 'realisasi' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-300">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold">
                  <th className="p-2.5 border-r border-slate-300 w-12 text-center">No</th>
                  <th className="p-2.5 border-r border-slate-300 w-28 text-center">Kode Rekening</th>
                  <th className="p-2.5 border-r border-slate-300 text-center">Komponen Penggunaan BOS</th>
                  <th className="p-2.5 border-r border-slate-300 text-center">Pagu Anggaran</th>
                  <th className="p-2.5 border-r border-slate-300 text-center">Realisasi Belanja</th>
                  <th className="p-2.5 border-r border-slate-300 text-center">Sisa Anggaran</th>
                  <th className="p-2.5 text-center w-24">Capaian (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {categories.map((c, i) => {
                  const sisa = Math.max(0, c.anggaran - c.realisasi);
                  const pct = c.anggaran > 0 ? ((c.realisasi / c.anggaran) * 100).toFixed(1) : '0';
                  return (
                    <tr key={c.id}>
                      <td className="p-2 border-r border-slate-300 text-center text-slate-400">{i + 1}</td>
                      <td className="p-2 border-r border-slate-300 font-mono font-bold text-blue-800">{c.kode}</td>
                      <td className="p-2 border-r border-slate-300">{c.nama}</td>
                      <td className="p-2 border-r border-slate-300 text-right font-mono">{formatRupiah(c.anggaran)}</td>
                      <td className="p-2 border-r border-slate-300 text-right font-mono text-rose-700">{formatRupiah(c.realisasi)}</td>
                      <td className="p-2 border-r border-slate-300 text-right font-mono text-emerald-700">{formatRupiah(sisa)}</td>
                      <td className="p-2 text-center font-mono font-bold">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Official Signatures Section */}
        <div className="grid grid-cols-2 gap-8 pt-8 text-xs text-center">
          <div>
            <p>Mengetahui,</p>
            <p className="font-bold">Kepala {school.namaSekolah}</p>
            <div className="h-16"></div>
            <p className="font-bold underline uppercase">{school.namaKepalaSekolah}</p>
            <p className="text-[11px] text-slate-500 font-mono">NIP. {school.nipKepalaSekolah}</p>
          </div>

          <div>
            <p>Tamiang Hulu, {formatTanggalIndo(new Date().toISOString().split('T')[0])}</p>
            <p className="font-bold">Bendahara BOS</p>
            <div className="h-16"></div>
            <p className="font-bold underline uppercase">{school.namaBendahara}</p>
            <p className="text-[11px] text-slate-500 font-mono">NIP. {school.nipBendahara}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
