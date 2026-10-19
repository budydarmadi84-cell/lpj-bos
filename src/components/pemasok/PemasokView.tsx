import React, { useState, useMemo } from 'react';
import {
  Store,
  PlusCircle,
  Search,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  FileText,
  User,
  CheckCircle2,
  X,
  History,
  LayoutGrid,
  Table as TableIcon,
  ShoppingBag,
  CreditCard,
  Building2,
  ArrowUpRight,
  Receipt,
  Sparkles,
  PenTool,
} from 'lucide-react';
import { Pemasok, BkuTransaction } from '../../types';
import { formatRupiah, formatTanggalIndo } from '../../utils/formatters';
import { localDB } from '../../services/storage';
import { SignaturePadModal } from '../common/SignaturePadModal';

interface PemasokViewProps {
  pemasokList: Pemasok[];
  transactions: BkuTransaction[];
  onRefresh: () => void;
}

export const PemasokView: React.FC<PemasokViewProps> = ({
  pemasokList,
  transactions,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPemasok, setEditingPemasok] = useState<Pemasok | null>(null);
  const [historyPemasok, setHistoryPemasok] = useState<Pemasok | null>(null);
  const [notificationMsg, setNotificationMsg] = useState('');
  const [sigModal, setSigModal] = useState<{
    isOpen: boolean;
    pemasok: Pemasok;
    field: 'ttdRekanan' | 'stempelToko';
    title: string;
    roleName: string;
    signatoryName: string;
    existingSignature?: string;
  } | null>(null);

  const handleSaveVendorSignature = (dataUrl: string) => {
    if (!sigModal) return;
    const updated = {
      ...sigModal.pemasok,
      [sigModal.field]: dataUrl,
    };
    localDB.savePemasok(updated);
    setNotificationMsg(`TTE / Stempel untuk "${updated.namaToko}" berhasil disimpan ke sistem!`);
    onRefresh();
    setTimeout(() => setNotificationMsg(''), 3000);
  };

  const [formData, setFormData] = useState({
    namaToko: '',
    namaPemilik: '',
    alamat: '',
    telepon: '',
    npwp: '',
    bidangUsaha: '',
    catatan: '',
  });

  // Calculate statistics
  const { totalPemasok, totalTransaksiRekanan, totalNilaiRekanan, topPemasok } = useMemo(() => {
    let totalTx = 0;
    let totalVal = 0;
    const vendorMap: Record<string, { count: number; sum: number; name: string }> = {};

    transactions.forEach((tx) => {
      if (tx.jenis === 'pengeluaran' && tx.status !== 'dibatalkan') {
        totalTx += 1;
        totalVal += tx.nominal;

        const vendorKey = tx.pemasokId || tx.pihakTerkait;
        if (!vendorMap[vendorKey]) {
          vendorMap[vendorKey] = { count: 0, sum: 0, name: tx.pihakTerkait };
        }
        vendorMap[vendorKey].count += 1;
        vendorMap[vendorKey].sum += tx.nominal;
      }
    });

    let top = 'IZZI Fotocopy';
    let maxCount = 0;
    Object.values(vendorMap).forEach((v) => {
      if (v.count > maxCount) {
        maxCount = v.count;
        top = v.name;
      }
    });

    return {
      totalPemasok: pemasokList.length,
      totalTransaksiRekanan: totalTx,
      totalNilaiRekanan: totalVal,
      topPemasok: top.split('(')[0].trim(),
    };
  }, [pemasokList, transactions]);

  // Filtered suppliers
  const filteredPemasok = useMemo(() => {
    if (!searchQuery.trim()) return pemasokList;
    const q = searchQuery.toLowerCase();
    return pemasokList.filter(
      (p) =>
        p.namaToko.toLowerCase().includes(q) ||
        p.namaPemilik.toLowerCase().includes(q) ||
        p.alamat.toLowerCase().includes(q) ||
        p.bidangUsaha.toLowerCase().includes(q) ||
        (p.npwp && p.npwp.toLowerCase().includes(q))
    );
  }, [pemasokList, searchQuery]);

  const handleOpenAdd = () => {
    setEditingPemasok(null);
    setFormData({
      namaToko: '',
      namaPemilik: '',
      alamat: '',
      telepon: '',
      npwp: '',
      bidangUsaha: 'Pengadaan Alat Tulis & Cetak',
      catatan: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (p: Pemasok) => {
    setEditingPemasok(p);
    setFormData({
      namaToko: p.namaToko,
      namaPemilik: p.namaPemilik,
      alamat: p.alamat,
      telepon: p.telepon,
      npwp: p.npwp || '',
      bidangUsaha: p.bidangUsaha,
      catatan: p.catatan || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.namaToko.trim() || !formData.namaPemilik.trim()) return;

    const payload: Pemasok = {
      id: editingPemasok ? editingPemasok.id : 'pem-' + Date.now(),
      namaToko: formData.namaToko.trim(),
      namaPemilik: formData.namaPemilik.trim(),
      alamat: formData.alamat.trim(),
      telepon: formData.telepon.trim(),
      npwp: formData.npwp.trim() || undefined,
      bidangUsaha: formData.bidangUsaha.trim(),
      catatan: formData.catatan.trim() || undefined,
      isActive: true,
      createdAt: editingPemasok ? editingPemasok.createdAt : new Date().toISOString().split('T')[0],
    };

    localDB.savePemasok(payload);
    setModalOpen(false);
    setNotificationMsg(`Data pemasok "${payload.namaToko}" berhasil disimpan ke sistem!`);
    onRefresh();
    setTimeout(() => setNotificationMsg(''), 3500);
  };

  // Get transactions associated with historyPemasok
  const pemasokTxs = useMemo(() => {
    if (!historyPemasok) return [];
    return transactions.filter(
      (t) =>
        t.pemasokId === historyPemasok.id ||
        t.pihakTerkait.toLowerCase().includes(historyPemasok.namaToko.toLowerCase()) ||
        t.pihakTerkait.toLowerCase().includes(historyPemasok.namaPemilik.toLowerCase())
    );
  }, [historyPemasok, transactions]);

  const pemasokTotalExpenditure = useMemo(() => {
    return pemasokTxs.reduce((sum, t) => sum + (t.status !== 'dibatalkan' ? t.nominal : 0), 0);
  }, [pemasokTxs]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. Metric Stat Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pemasok Terdaftar</span>
            <p className="text-xl font-black text-slate-900 mt-0.5">{totalPemasok} Toko / Usaha</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1769E0] flex items-center justify-center">
            <Store size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Transaksi Belanja</span>
            <p className="text-xl font-black text-slate-900 mt-0.5">{totalTransaksiRekanan} Transaksi</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <ShoppingBag size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Belanja Rekanan</span>
            <p className="text-xl font-black text-emerald-700 mt-0.5">{formatRupiah(totalNilaiRekanan)}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CreditCard size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pemasok Teraktif</span>
            <p className="text-sm font-bold text-slate-900 mt-1 truncate max-w-[170px]" title={topPemasok}>
              {topPemasok}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Sparkles size={20} />
          </div>
        </div>
      </div>

      {notificationMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span className="font-semibold">{notificationMsg}</span>
        </div>
      )}

      {/* 2. Controls, Search, View Mode & Add Button */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari toko, pemilik, alamat, bidang usaha..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>

        {/* View Switcher & Add Button */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Switch Table / Grid */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'table'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilan Tabel Rapi"
            >
              <TableIcon size={14} />
              <span className="hidden md:inline">Tabel</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilan Kartu Grid"
            >
              <LayoutGrid size={14} />
              <span className="hidden md:inline">Kartu</span>
            </button>
          </div>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-[#1769E0] hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-blue-500/25 transition-all active:scale-95"
          >
            <PlusCircle size={15} />
            <span>+ Tambah Pemasok</span>
          </button>
        </div>
      </div>

      {/* 3A. TABULAR VIEW (Default & Super Neat) */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3 text-center w-12">No</th>
                  <th className="py-3 px-3 text-center w-56">Nama Toko & Pemilik</th>
                  <th className="py-3 px-3 text-center w-44">Bidang Usaha</th>
                  <th className="py-3 px-3 text-center">Alamat Lengkap</th>
                  <th className="py-3 px-3 text-center w-36">Telepon / Kontak</th>
                  <th className="py-3 px-3 text-center w-36 font-mono">NPWP</th>
                  <th className="py-3 px-3 text-center w-28 whitespace-nowrap">Riwayat Transaksi</th>
                  <th className="py-3 px-3 text-center w-20">Status</th>
                  <th className="py-3 px-3 text-center w-36">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredPemasok.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <Store size={32} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-xs font-semibold">Tidak ada data pemasok yang cocok.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Klik tombol "+ Tambah Pemasok" untuk mendaftarkan toko atau rekanan baru.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredPemasok.map((p, idx) => {
                    const txs = transactions.filter(
                      (t) =>
                        t.pemasokId === p.id ||
                        t.pihakTerkait.toLowerCase().includes(p.namaToko.toLowerCase()) ||
                        t.pihakTerkait.toLowerCase().includes(p.namaPemilik.toLowerCase())
                    );
                    const txCount = txs.length;
                    const txSum = txs.reduce((sum, t) => sum + (t.status !== 'dibatalkan' ? t.nominal : 0), 0);

                    return (
                      <tr key={p.id} className="hover:bg-blue-50/40 transition-colors group">
                        {/* No */}
                        <td className="py-3.5 px-3 text-center font-bold text-slate-400">
                          {idx + 1}
                        </td>

                        {/* Toko & Pemilik */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1769E0] flex items-center justify-center font-bold shrink-0">
                              <Store size={15} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 leading-tight truncate">
                                {p.namaToko}
                              </p>
                              <p className="text-[11px] text-blue-600 font-medium flex items-center gap-1 mt-0.5">
                                <User size={11} /> {p.namaPemilik}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Bidang Usaha */}
                        <td className="py-3.5 px-3 font-medium text-slate-700">
                          <span className="line-clamp-1" title={p.bidangUsaha}>
                            {p.bidangUsaha}
                          </span>
                        </td>

                        {/* Alamat */}
                        <td className="py-3.5 px-3 max-w-xs text-slate-600">
                          <div className="flex items-start gap-1.5">
                            <MapPin size={12} className="text-slate-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-2 leading-relaxed" title={p.alamat}>
                              {p.alamat}
                            </span>
                          </div>
                        </td>

                        {/* Telepon */}
                        <td className="py-3.5 px-3 whitespace-nowrap text-slate-700">
                          <div className="flex items-center gap-1.5">
                            <Phone size={12} className="text-slate-400 shrink-0" />
                            <span className="font-mono">{p.telepon || '-'}</span>
                          </div>
                        </td>

                        {/* NPWP */}
                        <td className="py-3.5 px-3 whitespace-nowrap font-mono text-[11px] text-slate-600">
                          {p.npwp || <span className="text-slate-300 font-sans italic">Tidak ada</span>}
                        </td>

                        {/* Riwayat Transaksi */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          <button
                            onClick={() => setHistoryPemasok(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-[11px] border border-blue-200/70 transition-colors"
                            title="Buka riwayat transaksi BKU bersama toko ini"
                          >
                            <History size={12} />
                            <span>{txCount} Transaksi</span>
                          </button>
                          {txSum > 0 && (
                            <div className="text-[10px] font-mono font-semibold text-slate-500 mt-0.5">
                              {formatRupiah(txSum)}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Aktif
                          </span>
                        </td>

                        {/* Tindakan */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() =>
                                setSigModal({
                                  isOpen: true,
                                  pemasok: p,
                                  field: 'ttdRekanan',
                                  title: `Tanda Tangan Elektronik ${p.namaToko}`,
                                  roleName: `Pemilik ${p.namaToko}`,
                                  signatoryName: p.namaPemilik,
                                  existingSignature: p.ttdRekanan,
                                })
                              }
                              className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border ${
                                p.ttdRekanan
                                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                              }`}
                              title="Beri Tanda Tangan Elektronik Rekanan"
                            >
                              <PenTool size={12} />
                              <span className="hidden lg:inline">{p.ttdRekanan ? 'TTE Ada' : 'Beri TTE'}</span>
                            </button>
                            <button
                              onClick={() => setHistoryPemasok(p)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                              title="Lihat riwayat pembelian"
                            >
                              <History size={12} />
                              <span className="hidden lg:inline">Riwayat</span>
                            </button>
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                              title="Ubah data toko"
                            >
                              <Edit2 size={12} />
                              <span className="hidden lg:inline">Ubah</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3B. GRID VIEW (Optional Card Layout) */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPemasok.map((p) => {
            const txs = transactions.filter(
              (t) =>
                t.pemasokId === p.id ||
                t.pihakTerkait.toLowerCase().includes(p.namaToko.toLowerCase()) ||
                t.pihakTerkait.toLowerCase().includes(p.namaPemilik.toLowerCase())
            );
            const txCount = txs.length;
            const txSum = txs.reduce((sum, t) => sum + (t.status !== 'dibatalkan' ? t.nominal : 0), 0);

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1769E0] flex items-center justify-center font-bold text-sm shrink-0">
                        <Store size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm leading-snug">{p.namaToko}</h4>
                        <p className="text-xs text-blue-600 font-medium flex items-center gap-1 mt-0.5">
                          <User size={12} /> {p.namaPemilik}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Aktif
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                    <div className="flex items-start gap-2">
                      <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                      <span className="leading-tight">{p.alamat}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-slate-400 shrink-0" />
                      <span className="font-mono">{p.telepon || '-'}</span>
                    </div>
                    {p.npwp && (
                      <div className="flex items-center gap-2">
                        <FileText size={13} className="text-slate-400 shrink-0" />
                        <span className="font-mono text-[11px]">NPWP: {p.npwp}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bidang Usaha</span>
                    <p className="text-xs font-semibold text-slate-800">{p.bidangUsaha}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setHistoryPemasok(p)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                  >
                    <History size={13} />
                    <span>{txCount} Transaksi ({formatRupiah(txSum)})</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100"
                      title="Ubah Data Pemasok"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. MODAL: Tambah / Edit Pemasok */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <Store size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingPemasok ? 'Ubah Data Pemasok / Toko' : 'Tambah Pemasok Rekanan Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">Penyedia belanja barang dan jasa sekolah</p>
                </div>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Toko / Usaha <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  placeholder="Contoh: IZZI Fotocopy"
                  value={formData.namaToko}
                  onChange={(e) => setFormData({ ...formData, namaToko: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Pemilik / Penanggung Jawab <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  placeholder="Contoh: ROMA DANI"
                  value={formData.namaPemilik}
                  onChange={(e) => setFormData({ ...formData, namaPemilik: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Alamat Lengkap Toko <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  placeholder="Contoh: Harum Sari, Kec. Tamiang Hulu"
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nomor Telepon / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="Contoh: 0852-7711-2299"
                    value={formData.telepon}
                    onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">NPWP (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: 89.123.456.7-101.000"
                    value={formData.npwp}
                    onChange={(e) => setFormData({ ...formData, npwp: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Bidang Usaha</label>
                <input
                  type="text"
                  placeholder="Contoh: Penggandaan, Alat Tulis Kantor & Cetak"
                  value={formData.bidangUsaha}
                  onChange={(e) => setFormData({ ...formData, bidangUsaha: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  value={formData.catatan}
                  onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                  placeholder="Contoh: Penyedia formulir pendaftaran PPDB, buku catatan, pulpen, dan ATK"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1769E0] hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm active:scale-95 transition-all"
                >
                  Simpan Pemasok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: Riwayat Transaksi Toko Lengkap */}
      {historyPemasok && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
                  <Store size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{historyPemasok.namaToko}</h3>
                  <p className="text-xs text-slate-500">
                    Pemilik: {historyPemasok.namaPemilik} • {historyPemasok.alamat}
                  </p>
                </div>
              </div>
              <button onClick={() => setHistoryPemasok(null)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            {/* Rekap Ringkas */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Total Transaksi BKU</span>
                <span className="font-bold text-slate-900 text-sm">{pemasokTxs.length} Transaksi</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Akumulasi Belanja</span>
                <span className="font-mono font-bold text-blue-800 text-sm">{formatRupiah(pemasokTotalExpenditure)}</span>
              </div>
            </div>

            {/* List Transaksi */}
            {pemasokTxs.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Belum ada transaksi BKU yang tercatat bersama pemasok ini.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 font-bold text-slate-700 text-[11px]">
                    <tr>
                      <th className="p-2.5 w-24 text-center">Tanggal</th>
                      <th className="p-2.5 w-32 text-center">No. Bukti</th>
                      <th className="p-2.5 text-center">Uraian Transaksi</th>
                      <th className="p-2.5 text-center w-28">Nominal</th>
                      <th className="p-2.5 text-center w-20">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pemasokTxs.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/60">
                        <td className="p-2.5 whitespace-nowrap text-slate-600 font-medium">{formatTanggalIndo(t.tanggal)}</td>
                        <td className="p-2.5 whitespace-nowrap font-mono font-bold text-blue-800">{t.nomorBukti}</td>
                        <td className="p-2.5 text-slate-800 font-medium">{t.uraian}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">{formatRupiah(t.nominal)}</td>
                        <td className="p-2.5 text-center whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-bold border-t border-slate-200">
                      <td colSpan={3} className="p-2.5 text-right text-slate-600">Total Belanja:</td>
                      <td className="p-2.5 text-right font-mono text-blue-900">{formatRupiah(pemasokTotalExpenditure)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setHistoryPemasok(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signature Pad Modal for Vendor */}
      {sigModal && (
        <SignaturePadModal
          isOpen={sigModal.isOpen}
          title={sigModal.title}
          roleName={sigModal.roleName}
          signatoryName={sigModal.signatoryName}
          existingSignature={sigModal.existingSignature}
          onClose={() => setSigModal(null)}
          onSave={handleSaveVendorSignature}
        />
      )}
    </div>
  );
};
