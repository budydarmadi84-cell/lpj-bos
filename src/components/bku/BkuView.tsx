import React, { useState, useMemo } from 'react';
import {
  BookOpenCheck,
  PlusCircle,
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  Printer,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Calendar,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  ShoppingBag,
} from 'lucide-react';
import { BkuTransaction, FiscalYear, SchoolProfile, BudgetCategory, Pemasok, TransactionType, TransactionStatus } from '../../types';
import { formatRupiah, formatTanggalIndo } from '../../utils/formatters';
import { localDB } from '../../services/storage';
import { exportBkuToExcel } from '../../services/excelExport';

interface BkuViewProps {
  fiscalYear: FiscalYear;
  school: SchoolProfile;
  categories: BudgetCategory[];
  pemasokList: Pemasok[];
  transactions: BkuTransaction[];
  onRefresh: () => void;
  onOpenBelanja: (tx: BkuTransaction) => void;
  onOpenSpj: (tx: BkuTransaction) => void;
  isModalOpen?: boolean;
  setIsModalOpen?: (open: boolean) => void;
}

export const BkuView: React.FC<BkuViewProps> = ({
  fiscalYear,
  school,
  categories,
  pemasokList,
  transactions,
  onRefresh,
  onOpenBelanja,
  onOpenSpj,
  isModalOpen: externalModalOpen,
  setIsModalOpen: setExternalModalOpen,
}) => {
  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const isFormOpen = externalModalOpen !== undefined ? externalModalOpen : internalModalOpen;
  const setFormOpen = setExternalModalOpen || setInternalModalOpen;

  const [editingTx, setEditingTx] = useState<BkuTransaction | null>(null);
  const [cancelModalTx, setCancelModalTx] = useState<BkuTransaction | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Form State
  const [formData, setFormData] = useState<{
    tanggal: string;
    nomorBukti: string;
    jenis: TransactionType;
    uraian: string;
    sumberDana: 'BOS Reguler' | 'BOS Kinerja' | 'BOS Afirmasi' | 'BOSDA' | 'Silpa BOS';
    kategoriId: string;
    kodeRekening: string;
    pihakTerkait: string;
    pemasokId: string;
    nominal: string;
    catatan: string;
    status: TransactionStatus;
  }>({
    tanggal: new Date().toISOString().split('T')[0],
    nomorBukti: '',
    jenis: 'pengeluaran',
    uraian: '',
    sumberDana: 'BOS Reguler',
    kategoriId: categories[0]?.id || '',
    kodeRekening: categories[0]?.kode || '',
    pihakTerkait: '',
    pemasokId: '',
    nominal: '',
    catatan: '',
    status: 'disahkan',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Running balance calculations
  const { transactionsWithSaldo, totalPenerimaan, totalPengeluaran, saldoKasSaatIni } = useMemo(() => {
    return localDB.calculateBalances(fiscalYear.id);
  }, [fiscalYear.id, transactions]);

  // Filtered transactions
  const filteredList = useMemo(() => {
    return transactionsWithSaldo.filter((tx) => {
      if (selectedType !== 'all' && tx.jenis !== selectedType) return false;
      if (selectedCategory !== 'all' && tx.kategoriId !== selectedCategory) return false;
      if (selectedMonth !== 'all') {
        const m = new Date(tx.tanggal).getMonth() + 1;
        if (m.toString() !== selectedMonth) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNo = tx.nomorBukti.toLowerCase().includes(q);
        const matchUraian = tx.uraian.toLowerCase().includes(q);
        const matchPihak = tx.pihakTerkait.toLowerCase().includes(q);
        if (!matchNo && !matchUraian && !matchPihak) return false;
      }
      return true;
    });
  }, [transactionsWithSaldo, selectedType, selectedCategory, selectedMonth, searchQuery]);

  const handleOpenAdd = () => {
    setEditingTx(null);
    setErrorMessage('');
    setSuccessMessage('');
    const randomNum = Math.floor(10 + Math.random() * 90);
    setFormData({
      tanggal: `${fiscalYear.tahun}-09-15`,
      nomorBukti: `421.2/${randomNum}/${fiscalYear.tahun}`,
      jenis: 'pengeluaran',
      uraian: '',
      sumberDana: 'BOS Reguler',
      kategoriId: categories[0]?.id || '',
      kodeRekening: categories[0]?.kode || '',
      pihakTerkait: '',
      pemasokId: '',
      nominal: '',
      catatan: '',
      status: 'disahkan',
    });
    setFormOpen(true);
  };

  const handleOpenEdit = (tx: BkuTransaction) => {
    setEditingTx(tx);
    setErrorMessage('');
    setSuccessMessage('');
    setFormData({
      tanggal: tx.tanggal,
      nomorBukti: tx.nomorBukti,
      jenis: tx.jenis,
      uraian: tx.uraian,
      sumberDana: tx.sumberDana,
      kategoriId: tx.kategoriId,
      kodeRekening: tx.kodeRekening,
      pihakTerkait: tx.pihakTerkait,
      pemasokId: tx.pemasokId || '',
      nominal: tx.nominal.toString(),
      catatan: tx.catatan || '',
      status: tx.status,
    });
    setFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent double submit

    const numVal = parseInt(formData.nominal, 10);
    if (!formData.nomorBukti.trim()) {
      setErrorMessage('Nomor bukti transaksi wajib diisi!');
      return;
    }
    if (!formData.uraian.trim()) {
      setErrorMessage('Uraian transaksi wajib diisi!');
      return;
    }
    if (isNaN(numVal) || numVal <= 0) {
      setErrorMessage('Nominal harus berupa angka valid di atas Rp 0!');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const catObj = categories.find((c) => c.id === formData.kategoriId);

    const payload: BkuTransaction = {
      id: editingTx ? editingTx.id : 'tx-' + Date.now(),
      fiscalYearId: fiscalYear.id,
      tanggal: formData.tanggal,
      nomorBukti: formData.nomorBukti.trim(),
      jenis: formData.jenis,
      uraian: formData.uraian.trim(),
      sumberDana: formData.sumberDana,
      kategoriId: formData.kategoriId,
      kategoriNama: catObj?.nama || 'Pengelolaan Sekolah',
      kodeRekening: catObj?.kode || formData.kodeRekening,
      pemasokId: formData.pemasokId || undefined,
      pihakTerkait: formData.pihakTerkait || (formData.pemasokId ? pemasokList.find(p => p.id === formData.pemasokId)?.namaToko || '' : '-'),
      nominal: numVal,
      status: formData.status,
      catatan: formData.catatan,
      dibuatOleh: school.namaBendahara,
      diperbaruiPada: new Date().toISOString(),
      items: editingTx?.items || [],
      fotoBarang: editingTx?.fotoBarang || [],
    };

    const res = localDB.saveTransaction(payload);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMessage('Transaksi berhasil disimpan ke SQLite!');
      onRefresh();
      setTimeout(() => {
        setFormOpen(false);
      }, 600);
    } else {
      setErrorMessage(res.error || 'Terjadi kesalahan saat menyimpan.');
    }
  };

  const handleConfirmCancel = () => {
    if (!cancelModalTx || !cancelReason.trim()) return;
    localDB.cancelTransaction(cancelModalTx.id, cancelReason);
    setCancelModalTx(null);
    setCancelReason('');
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Summary Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Transaksi</span>
            <p className="text-xl font-black text-slate-900">{transactions.length}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <BookOpenCheck size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Penerimaan Kas</span>
            <p className="text-xl font-black text-emerald-700">{formatRupiah(totalPenerimaan)}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <ArrowDownLeft size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">Pengeluaran Belanja</span>
            <p className="text-xl font-black text-rose-700">{formatRupiah(totalPengeluaran)}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
            <ArrowUpRight size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Saldo Akhir BKU</span>
            <p className="text-xl font-black text-blue-800">{formatRupiah(saldoKasSaatIni)}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* 2. Controls & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full lg:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nomor bukti, uraian, pihak..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Jenis */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">Semua Jenis (Masuk & Keluar)</option>
            <option value="penerimaan">Hanya Penerimaan</option>
            <option value="pengeluaran">Hanya Pengeluaran</option>
          </select>

          {/* Kategori */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 focus:outline-none max-w-xs truncate"
          >
            <option value="all">Semua Komponen BOS</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.kode} - {c.nama}
              </option>
            ))}
          </select>

          {/* Month */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">Semua Bulan</option>
            <option value="1">Januari</option>
            <option value="2">Februari</option>
            <option value="3">Maret</option>
            <option value="4">April</option>
            <option value="5">Mei</option>
            <option value="6">Juni</option>
            <option value="7">Juli</option>
            <option value="8">Agustus</option>
            <option value="9">September</option>
            <option value="10">Oktober</option>
            <option value="11">November</option>
            <option value="12">Desember</option>
          </select>

          {/* Action buttons */}
          <button
            onClick={() => exportBkuToExcel(transactions, school, fiscalYear)}
            className="px-3 py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Ekspor Buku Kas Umum ke format Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet size={15} />
            <span>Ekspor Excel</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-[#1769E0] hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-blue-500/25 transition-all active:scale-95 ml-auto"
          >
            <PlusCircle size={15} />
            <span>+ Tambah Transaksi BKU</span>
          </button>
        </div>
      </div>

      {/* 3. Tabel Buku Kas Umum */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 text-center">Tanggal</th>
                <th className="py-3 px-3 text-center">No. Bukti</th>
                <th className="py-3 px-3 text-center">Uraian Pembukuan</th>
                <th className="py-3 px-3 text-center">Pihak Penerima / Toko</th>
                <th className="py-3 px-3 text-center text-emerald-700">Penerimaan (Rp)</th>
                <th className="py-3 px-3 text-center text-rose-700">Pengeluaran (Rp)</th>
                <th className="py-3 px-3 text-center text-blue-800">Saldo Akhir (Rp)</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Tidak ada transaksi BKU yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredList.map((tx) => (
                  <tr
                    key={tx.id}
                    className={`hover:bg-blue-50/40 transition-colors ${
                      tx.status === 'dibatalkan' ? 'bg-slate-50/60 opacity-60' : ''
                    }`}
                  >
                    <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-600">
                      {formatTanggalIndo(tx.tanggal)}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-mono font-bold text-blue-700">
                      {tx.nomorBukti}
                    </td>
                    <td className="py-3 px-3 max-w-sm">
                      <p className="font-semibold text-slate-900 leading-snug">{tx.uraian}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                        <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded">
                          {tx.kodeRekening}
                        </span>
                        <span>{tx.kategoriNama}</span>
                      </div>
                      {tx.alasanBatal && (
                        <p className="text-[10px] text-rose-600 italic mt-0.5">
                          Alasan batal: {tx.alasanBatal}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-700">
                      {tx.pihakTerkait || '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">
                      {tx.jenis === 'penerimaan' && tx.status !== 'dibatalkan'
                        ? formatRupiah(tx.nominal)
                        : '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-rose-600 whitespace-nowrap">
                      {tx.jenis === 'pengeluaran' && tx.status !== 'dibatalkan'
                        ? formatRupiah(tx.nominal)
                        : '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-blue-900 bg-slate-50/50 whitespace-nowrap">
                      {tx.status !== 'dibatalkan' && tx.runningSaldo !== undefined
                        ? formatRupiah(tx.runningSaldo)
                        : '-'}
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
                      <div className="flex items-center justify-center gap-1">
                        {tx.jenis === 'pengeluaran' && tx.status !== 'dibatalkan' && (
                          <>
                            <button
                              onClick={() => onOpenBelanja(tx)}
                              className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 border border-emerald-200"
                              title="Rincian Barang & Foto"
                            >
                              <ShoppingBag size={14} />
                            </button>
                            <button
                              onClick={() => onOpenSpj(tx)}
                              className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-50 border border-amber-200"
                              title="Buat SPJ PDF (4 Dokumen Resmi)"
                            >
                              <Printer size={14} />
                            </button>
                          </>
                        )}
                        {tx.status !== 'dibatalkan' && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(tx)}
                              className="p-1.5 rounded-lg text-blue-700 hover:bg-blue-50 border border-blue-200"
                              title="Edit Transaksi BKU"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => {
                                setCancelModalTx(tx);
                                setCancelReason('');
                              }}
                              className="p-1.5 rounded-lg text-rose-700 hover:bg-rose-50 border border-rose-200"
                              title="Batalkan Transaksi dengan Catatan"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. MODAL: Tambah / Edit Transaksi BKU */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/80 sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <BookOpenCheck size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingTx ? 'Ubah Transaksi Buku Kas Umum' : 'Tambah Transaksi BKU Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">Tahun Anggaran {fiscalYear.tahun} (Penyimpanan SQLite Lokal)</p>
                </div>
              </div>
              <button
                onClick={() => setFormOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
              {successMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                  <CheckCircle2 size={16} className="shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tanggal */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tanggal Transaksi</label>
                  <input
                    type="date"
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    required
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                </div>

                {/* Nomor Bukti */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nomor Bukti (Kwitansi / Pesanan)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 421.2/01/2022"
                    value={formData.nomorBukti}
                    onChange={(e) => setFormData({ ...formData, nomorBukti: e.target.value })}
                    required
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Jenis Transaksi & Sumber Dana */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Jenis Pembukuan</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, jenis: 'pengeluaran' })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        formData.jenis === 'pengeluaran'
                          ? 'bg-rose-50 border-rose-300 text-rose-700'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      Pengeluaran / Belanja
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, jenis: 'penerimaan' })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        formData.jenis === 'penerimaan'
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      Penerimaan Dana
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Sumber Dana</label>
                  <select
                    value={formData.sumberDana}
                    onChange={(e) => setFormData({ ...formData, sumberDana: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="BOS Reguler">BOS Reguler</option>
                    <option value="BOS Kinerja">BOS Kinerja</option>
                    <option value="BOS Afirmasi">BOS Afirmasi</option>
                    <option value="BOSDA">BOS Daerah (BOSDA)</option>
                    <option value="Silpa BOS">SiLPA BOS Tahun Lalu</option>
                  </select>
                </div>
              </div>

              {/* Uraian Transaksi */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Uraian Transaksi BKU</label>
                <textarea
                  rows={3}
                  value={formData.uraian}
                  onChange={(e) => setFormData({ ...formData, uraian: e.target.value })}
                  placeholder="Contoh: Pembayaran lunas pengadaan foto copy Formulir Pendaftaran Kelas I SD Negeri Bangun Sari..."
                  required
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed font-medium"
                ></textarea>
              </div>

              {/* Komponen Anggaran & Pihak Terkait */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Komponen / Kode Rekening</label>
                  <select
                    value={formData.kategoriId}
                    onChange={(e) => {
                      const c = categories.find((cat) => cat.id === e.target.value);
                      setFormData({
                        ...formData,
                        kategoriId: e.target.value,
                        kodeRekening: c?.kode || '',
                      });
                    }}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.kode} - {c.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Pemasok / Toko Terdaftar (Opsional)
                  </label>
                  <select
                    value={formData.pemasokId}
                    onChange={(e) => {
                      const pem = pemasokList.find((p) => p.id === e.target.value);
                      setFormData({
                        ...formData,
                        pemasokId: e.target.value,
                        pihakTerkait: pem ? `${pem.namaPemilik} (${pem.namaToko})` : formData.pihakTerkait,
                      });
                    }}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="">-- Pilih dari Data Pemasok --</option>
                    {pemasokList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.namaToko} - {p.namaPemilik}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pihak Terkait & Nominal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Pihak Penerima / Terkait (Teks Bebas)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: ROMA DANI (IZZI Fotocopy)"
                    value={formData.pihakTerkait}
                    onChange={(e) => setFormData({ ...formData, pihakTerkait: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nominal Transaksi (Rp)
                  </label>
                  <input
                    type="number"
                    placeholder="Contoh: 1100000"
                    value={formData.nominal}
                    onChange={(e) => setFormData({ ...formData, nominal: e.target.value })}
                    required
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-slate-900"
                  />
                  {formData.nominal && !isNaN(parseInt(formData.nominal)) && (
                    <p className="text-[10px] text-blue-600 font-medium mt-1">
                      {formatRupiah(parseInt(formData.nominal))}
                    </p>
                  )}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Status Verifikasi</label>
                <div className="flex gap-2">
                  {(['disahkan', 'siap_periksa', 'konsep'] as const).map((st) => (
                    <label
                      key={st}
                      className={`flex-1 flex items-center justify-center py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                        formData.status === st
                          ? 'bg-blue-50 border-blue-400 text-blue-700'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={st}
                        checked={formData.status === st}
                        onChange={() => setFormData({ ...formData, status: st })}
                        className="sr-only"
                      />
                      <span className="capitalize">{st.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#1769E0] hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Menyimpan ke SQLite...</span>
                    </>
                  ) : (
                    <span>Simpan ke Database Lokal</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: Pembatalan Transaksi BKU dengan Alasan */}
      {cancelModalTx && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2 rounded-xl bg-rose-100">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Pembatalan Transaksi BKU</h3>
                <p className="text-xs text-slate-500 font-mono">{cancelModalTx.nomorBukti}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Transaksi yang dibatalkan tidak akan dihitung dalam saldo kas dan laporan realisasi, namun tetap tersimpan dalam riwayat audit pembatalan untuk kepatuhan pemeriksaan BOS.
            </p>

            <label className="text-xs font-bold text-slate-700 block mb-1">
              Alasan Pembatalan Transaksi <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Contoh: Kesalahan input nomor bukti / retur barang belanja / faktur diganti..."
              className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 mb-4"
              required
            ></textarea>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelModalTx(null)}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Tutup
              </button>
              <button
                type="button"
                disabled={!cancelReason.trim()}
                onClick={handleConfirmCancel}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                Konfirmasi Batalkan Transaksi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
