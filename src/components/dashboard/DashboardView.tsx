import React from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Percent,
  FileCheck2,
  PlusCircle,
  ShoppingBag,
  Camera,
  Archive,
  HardDriveDownload,
  Building,
  School,
  ExternalLink,
  ChevronRight,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  Printer,
  Sparkles,
} from 'lucide-react';
import { SchoolProfile, FiscalYear, BkuTransaction, BudgetCategory } from '../../types';
import { formatRupiah, formatTanggalIndo } from '../../utils/formatters';
import { ActivePage } from '../layout/Sidebar';

interface DashboardViewProps {
  school: SchoolProfile;
  fiscalYear: FiscalYear;
  fiscalYears: FiscalYear[];
  onChangeFiscalYear: (id: string) => void;
  categories: BudgetCategory[];
  transactions: BkuTransaction[];
  balanceData: {
    totalPenerimaan: number;
    totalPengeluaran: number;
    saldoKasSaatIni: number;
    paguTotal: number;
    sisaAnggaran: number;
    progressLpj: number;
  };
  setActivePage: (p: ActivePage) => void;
  onOpenNewTxModal: () => void;
  onSelectTxForSpj: (tx: BkuTransaction) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  school,
  fiscalYear,
  fiscalYears,
  onChangeFiscalYear,
  categories,
  transactions,
  balanceData,
  setActivePage,
  onOpenNewTxModal,
  onSelectTxForSpj,
}) => {
  const recentTransactions = transactions
    .slice()
    .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
    .slice(0, 6);

  // Status documents counts
  const spjCount = {
    disahkan: transactions.filter((t) => t.status === 'disahkan' && t.jenis === 'pengeluaran').length,
    siapPeriksa: transactions.filter((t) => t.status === 'siap_periksa').length,
    proses: transactions.filter((t) => t.status === 'proses').length,
    konsep: transactions.filter((t) => t.status === 'konsep').length,
    perluPerbaikan: transactions.filter((t) => t.status === 'dibatalkan').length,
  };

  const totalBelanjaItemsCount = transactions.reduce((acc, t) => acc + (t.items?.length || 0), 0);
  const totalFotoCount = transactions.reduce((acc, t) => acc + (t.fotoBarang?.length || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0D2345] via-[#122e5a] to-[#1769E0] text-white p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-400/20 via-transparent to-transparent pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-semibold text-blue-200 mb-2 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Sistem Pelaporan Dana BOS Offline Windows (.EXE)
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              {school.namaSekolah}
            </h2>
            <p className="text-sm text-slate-200 mt-1 max-w-2xl leading-relaxed">
              Selamat datang di dashboard pengelolaan Laporan Pertanggungjawaban BOS. Seluruh pembukuan BKU, dokumentasi foto fisik barang, pembuatan kuitansi & Berita Acara (BAST), dan ekspor SPJ PDF tersimpan aman di database lokal Anda.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            <div className="bg-black/25 backdrop-blur-xs border border-white/15 px-4 py-2.5 rounded-xl">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 block">
                Tahun Anggaran
              </span>
              <select
                value={fiscalYear.id}
                onChange={(e) => onChangeFiscalYear(e.target.value)}
                className="bg-transparent text-white font-extrabold text-sm focus:outline-none cursor-pointer mt-0.5"
              >
                {fiscalYears.map((fy) => (
                  <option key={fy.id} value={fy.id} className="bg-[#0D2345] text-white">
                    Tahun {fy.tahun}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setActivePage('spj')}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2"
            >
              <FileCheck2 size={16} />
              <span>Generator SPJ PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Lima Kartu Ringkasan Keuangan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Pagu Dana BOS */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pagu Dana BOS</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1769E0] flex items-center justify-center">
              <Wallet size={16} />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 tracking-tight">
            {formatRupiah(balanceData.paguTotal)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Alokasi resmi tahun {fiscalYear.tahun}</p>
        </div>

        {/* Card 2: Dana Diterima */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Dana Diterima</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowDownLeft size={16} />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-700 tracking-tight">
            {formatRupiah(balanceData.totalPenerimaan)}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">
            {balanceData.paguTotal > 0
              ? `${((balanceData.totalPenerimaan / balanceData.paguTotal) * 100).toFixed(0)}% dari pagu tersalurkan`
              : 'Penyaluran bertahap'}
          </p>
        </div>

        {/* Card 3: Total Realisasi Belanja */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Realisasi</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowUpRight size={16} />
            </div>
          </div>
          <div className="text-xl font-black text-rose-700 tracking-tight">
            {formatRupiah(balanceData.totalPengeluaran)}
          </div>
          <p className="text-[11px] text-rose-600 font-medium mt-1">
            {transactions.filter((t) => t.jenis === 'pengeluaran' && t.status !== 'dibatalkan').length} transaksi belanja
          </p>
        </div>

        {/* Card 4: Sisa Kas Tersedia */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Sisa Saldo Kas</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 tracking-tight">
            {formatRupiah(balanceData.saldoKasSaatIni)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Sisa Pagu: {formatRupiah(balanceData.sisaAnggaran)}
          </p>
        </div>

        {/* Card 5: Progres LPJ */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Progres LPJ BOS</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Percent size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-indigo-700">{balanceData.progressLpj}%</span>
            <span className="text-xs text-slate-500 font-medium">Terserap</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${balanceData.progressLpj}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 3. Grid Tengah: Realisasi per Kategori & Status Ringkasan SPJ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom 1 & 2: Grafik Realisasi Anggaran per Kategori */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp size={16} className="text-blue-600" />
                Realisasi Anggaran per Kategori Belanja BOS
              </h3>
              <p className="text-xs text-slate-500">
                Perbandingan alokasi pagu vs realisasi belanja per komponen BOS
              </p>
            </div>
            <button
              onClick={() => setActivePage('anggaran')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Kelola Pagu <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-3.5">
            {categories.slice(0, 6).map((cat) => {
              const percentage = cat.anggaran > 0 ? Math.min(100, Math.round((cat.realisasi / cat.anggaran) * 100)) : 0;
              const isOverBudget = cat.realisasi > cat.anggaran;
              return (
                <div key={cat.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 truncate max-w-sm">
                      <span className="font-mono text-slate-400 mr-1.5">{cat.kode}</span>
                      {cat.nama}
                    </span>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-slate-500 text-[11px]">
                        {formatRupiah(cat.realisasi)} / {formatRupiah(cat.anggaran)}
                      </span>
                      <span
                        className={`font-bold font-mono px-1.5 py-0.5 rounded text-[10px] ${
                          isOverBudget
                            ? 'bg-rose-100 text-rose-700'
                            : percentage > 75
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isOverBudget
                          ? 'bg-rose-500'
                          : percentage > 75
                          ? 'bg-amber-500'
                          : 'bg-[#1769E0]'
                      }`}
                      style={{ width: `${Math.min(100, percentage)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Kolom 3: Status Ringkasan Dokumen LPJ & SPJ */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileCheck2 size={16} className="text-amber-500" />
                Status Dokumen LPJ & SPJ
              </h3>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Tahun {fiscalYear.tahun}
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-900">Disahkan (Sah)</span>
                </div>
                <span className="font-extrabold text-sm text-emerald-700">{spjCount.disahkan}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/70 border border-blue-100">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-blue-600" />
                  <span className="text-xs font-semibold text-blue-900">Siap Diperiksa</span>
                </div>
                <span className="font-extrabold text-sm text-blue-700">{spjCount.siapPeriksa}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/70 border border-amber-100">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-amber-600" />
                  <span className="text-xs font-semibold text-amber-900">Dalam Proses / Konsep</span>
                </div>
                <span className="font-extrabold text-sm text-amber-700">{spjCount.proses + spjCount.konsep}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-slate-500" />
                  <span className="text-xs font-semibold text-slate-700">Dibatalkan / Koreksi</span>
                </div>
                <span className="font-extrabold text-sm text-slate-600">{spjCount.perluPerbaikan}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Item Belanja Tersimpan:</span>
              <span className="font-bold font-mono text-slate-900">{totalBelanjaItemsCount} item</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Foto Fisik Barang:</span>
              <span className="font-bold font-mono text-slate-900">{totalFotoCount} file lokal</span>
            </div>
            <button
              onClick={() => setActivePage('arsip')}
              className="w-full mt-2 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <Archive size={14} />
              <span>Buka Ruang Arsip SPJ</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Panel Aksi Cepat (Quick Actions) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
          <Sparkles size={14} className="text-amber-500" />
          Aksi Cepat Pengelolaan LPJ BOS
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={onOpenNewTxModal}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200/60 text-blue-800 transition-all active:scale-95 text-center group"
          >
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs group-hover:scale-110 transition-transform mb-2">
              <PlusCircle size={18} />
            </div>
            <span className="text-xs font-bold leading-tight">Input Transaksi BKU</span>
          </button>

          <button
            onClick={() => setActivePage('belanja')}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200/60 text-emerald-800 transition-all active:scale-95 text-center group"
          >
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs group-hover:scale-110 transition-transform mb-2">
              <ShoppingBag size={18} />
            </div>
            <span className="text-xs font-bold leading-tight">Rincian Belanja</span>
          </button>

          <button
            onClick={() => setActivePage('belanja')}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-purple-50/70 hover:bg-purple-100/70 border border-purple-200/60 text-purple-800 transition-all active:scale-95 text-center group"
          >
            <div className="p-2 rounded-xl bg-purple-600 text-white shadow-xs group-hover:scale-110 transition-transform mb-2">
              <Camera size={18} />
            </div>
            <span className="text-xs font-bold leading-tight">Foto Barang & Kamera</span>
          </button>

          <button
            onClick={() => setActivePage('spj')}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200/60 text-amber-800 transition-all active:scale-95 text-center group"
          >
            <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs group-hover:scale-110 transition-transform mb-2">
              <FileCheck2 size={18} />
            </div>
            <span className="text-xs font-bold leading-tight">Buat SPJ 4-in-1</span>
          </button>

          <button
            onClick={() => setActivePage('arsip')}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 transition-all active:scale-95 text-center group"
          >
            <div className="p-2 rounded-xl bg-slate-700 text-white shadow-xs group-hover:scale-110 transition-transform mb-2">
              <Archive size={18} />
            </div>
            <span className="text-xs font-bold leading-tight">Lihat Arsip Lokal</span>
          </button>

          <button
            onClick={() => setActivePage('backup')}
            className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-teal-50/70 hover:bg-teal-100/70 border border-teal-200/60 text-teal-800 transition-all active:scale-95 text-center group"
          >
            <div className="p-2 rounded-xl bg-teal-600 text-white shadow-xs group-hover:scale-110 transition-transform mb-2">
              <HardDriveDownload size={18} />
            </div>
            <span className="text-xs font-bold leading-tight">Backup Data SQLite</span>
          </button>
        </div>
      </div>

      {/* 5. Tabel Transaksi Terbaru & Informasi Sekolah */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom 1 & 2: Tabel Transaksi Terbaru */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Transaksi Terbaru Buku Kas Umum (BKU)</h3>
              <p className="text-xs text-slate-500">Pencatatan kas dan belanja terkini pada sistem lokal</p>
            </div>
            <button
              onClick={() => setActivePage('bku')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Buka Semua BKU <ChevronRight size={14} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3 text-center">Tanggal</th>
                  <th className="py-2.5 px-3 text-center">No. Bukti</th>
                  <th className="py-2.5 px-3 text-center">Uraian Transaksi</th>
                  <th className="py-2.5 px-3 text-center">Jenis</th>
                  <th className="py-2.5 px-3 text-center">Nominal (Rp)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Aksi SPJ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-500">
                      {formatTanggalIndo(tx.tanggal)}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {tx.nomorBukti}
                    </td>
                    <td className="py-3 px-3 max-w-xs truncate" title={tx.uraian}>
                      <p className="font-semibold text-slate-800 truncate">{tx.uraian}</p>
                      <p className="text-[10px] text-slate-400 truncate">{tx.pihakTerkait}</p>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.jenis === 'penerimaan'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {tx.jenis === 'penerimaan' ? 'Penerimaan' : 'Pengeluaran'}
                      </span>
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-mono font-bold whitespace-nowrap ${
                        tx.jenis === 'penerimaan' ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {formatRupiah(tx.nominal)}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          tx.status === 'disahkan'
                            ? 'bg-emerald-100 text-emerald-800'
                            : tx.status === 'siap_periksa'
                            ? 'bg-blue-100 text-blue-800'
                            : tx.status === 'dibatalkan'
                            ? 'bg-rose-100 text-rose-800 line-through'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {tx.jenis === 'pengeluaran' && tx.status !== 'dibatalkan' ? (
                        <button
                          onClick={() => {
                            onSelectTxForSpj(tx);
                            setActivePage('spj');
                          }}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-[10px] font-bold transition-colors inline-flex items-center gap-1"
                        >
                          <Printer size={11} />
                          Cetak SPJ
                        </button>
                      ) : (
                        <span className="text-slate-300 text-[11px]">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Kolom 3: Panel Informasi Sekolah & Pejabat Sekolah */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <School size={16} className="text-blue-600" />
                Informasi Resmi Sekolah
              </h3>
              <button
                onClick={() => setActivePage('profil')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800"
              >
                Ubah
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Nama Sekolah & NPSN</span>
                <p className="font-bold text-slate-900 text-sm">{school.namaSekolah}</p>
                <p className="text-slate-500 font-mono">NPSN: {school.npsn}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Wilayah Pemerintahan</span>
                <p className="text-slate-800 font-medium">
                  {school.kecamatan}, {school.kabupaten}
                </p>
                <p className="text-[11px] text-slate-500">{school.alamat}</p>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Kepala Sekolah</span>
                <p className="font-bold text-slate-900">{school.namaKepalaSekolah}</p>
                <p className="text-[11px] text-slate-500 font-mono">NIP. {school.nipKepalaSekolah}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Bendahara BOS</span>
                <p className="font-bold text-slate-900">{school.namaBendahara}</p>
                <p className="text-[11px] text-slate-500 font-mono">NIP. {school.nipBendahara}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Pengurus Barang</span>
                <p className="font-bold text-slate-900">{school.namaPengurusBarang}</p>
                <p className="text-[11px] text-slate-500 font-mono">NIP. {school.nipPengurusBarang}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
              <span>Database Lokasi:</span>
              <span className="font-mono text-slate-800 font-semibold">%APPDATA%\LPJ BOS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
