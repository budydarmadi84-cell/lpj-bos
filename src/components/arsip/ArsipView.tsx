import React, { useState, useMemo } from 'react';
import {
  Archive,
  Search,
  Download,
  Printer,
  FileCheck2,
  Calendar,
  Eye,
  FileText,
  Clock,
  Sparkles,
  CheckCircle2,
  Image as ImageIcon,
  FolderOpen,
  Filter,
  Check,
  Building,
  Layers,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import { SpjDocumentArchive, BkuTransaction, SchoolProfile, Pemasok, FiscalYear } from '../../types';
import { formatRupiah, formatTanggalIndo } from '../../utils/formatters';
import { generateSpjPdf } from '../../services/pdfGenerator';

interface ArsipViewProps {
  archives: SpjDocumentArchive[];
  transactions: BkuTransaction[];
  school: SchoolProfile;
  fiscalYear: FiscalYear;
  pemasokList: Pemasok[];
  onOpenSpjPreview: (tx: BkuTransaction) => void;
}

export const ArsipView: React.FC<ArsipViewProps> = ({
  archives,
  transactions,
  school,
  fiscalYear,
  pemasokList,
  onOpenSpjPreview,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('all');
  const [selectedArchive, setSelectedArchive] = useState<SpjDocumentArchive | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string>('');

  // Total metrics
  const totalNilaiArsip = useMemo(() => {
    return archives.reduce((acc, curr) => acc + (curr.totalNilai || 0), 0);
  }, [archives]);

  // Unique years in archives
  const availableYears = useMemo(() => {
    const setYears = new Set<number>();
    archives.forEach((a) => {
      if (a.tahunAnggaran) setYears.add(a.tahunAnggaran);
    });
    return Array.from(setYears).sort((a, b) => b - a);
  }, [archives]);

  // Filtered list
  const filteredArchives = useMemo(() => {
    return archives.filter((a) => {
      if (selectedStatusFilter !== 'all' && a.status !== selectedStatusFilter) return false;
      if (selectedYearFilter !== 'all' && a.tahunAnggaran.toString() !== selectedYearFilter) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchSpj = a.nomorSpj?.toLowerCase().includes(q);
      const matchBukti = a.nomorBukti?.toLowerCase().includes(q);
      const matchPemasok = a.pemasokNama?.toLowerCase().includes(q);
      const matchFile = a.pdfFileName?.toLowerCase().includes(q);

      // Check matched transaction uraian
      const matchedTx = transactions.find((t) => t.id === a.transaksiId);
      const matchUraian = matchedTx?.uraian?.toLowerCase().includes(q);
      const matchBarang = matchedTx?.items?.some((it) => it.namaBarang?.toLowerCase().includes(q));

      return matchSpj || matchBukti || matchPemasok || matchFile || matchUraian || matchBarang;
    });
  }, [archives, searchQuery, selectedStatusFilter, selectedYearFilter, transactions]);

  // Reprint / Re-download PDF
  const handleReprintPdf = (archive: SpjDocumentArchive) => {
    const matchedTx = transactions.find((t) => t.id === archive.transaksiId);
    if (!matchedTx) return;
    const matchedPemasok = pemasokList.find((p) => p.id === matchedTx.pemasokId);

    const doc = generateSpjPdf(matchedTx, school, matchedPemasok, {
      includeSuratPesanan: true,
      includeFaktur: true,
      includeBast: true,
      includeKuitansi: true,
      includeFoto: true,
    });
    doc.save(archive.pdfFileName || `SPJ_Arsip_${archive.nomorBukti.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`);

    setNotificationMsg(`Dokumen ${archive.nomorSpj} berhasil dicetak ulang dan diunduh ke komputer.`);
    setTimeout(() => setNotificationMsg(''), 3500);
  };

  const matchedTxForDetail = selectedArchive
    ? transactions.find((t) => t.id === selectedArchive.transaksiId)
    : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Berkas Diarsipkan</span>
            <p className="text-xl font-black text-slate-900 mt-0.5">{archives.length} Dokumen</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1769E0] flex items-center justify-center">
            <Archive size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Nilai SPJ Tersimpan</span>
            <p className="text-xl font-black text-slate-900 mt-0.5">{formatRupiah(totalNilaiArsip)}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Status Validasi</span>
            <p className="text-xl font-black text-emerald-700 mt-0.5">
              {archives.filter((a) => a.status === 'Disahkan').length} Disahkan
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <FileCheck2 size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Penyimpanan Fisik</span>
            <p className="text-xs font-mono font-bold text-slate-700 mt-1 truncate max-w-[170px]" title="%APPDATA%\files\pdf\">
              %APPDATA%\files\pdf\
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <FolderOpen size={20} />
          </div>
        </div>
      </div>

      {notificationMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span className="font-semibold">{notificationMsg}</span>
        </div>
      )}

      {/* 2. Controls, Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full lg:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nomor SPJ, nomor bukti, rekanan, barang..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
            <Filter size={13} className="text-slate-400" />
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="text-xs bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer py-1"
            >
              <option value="all">Semua Status</option>
              <option value="Disahkan">Disahkan</option>
              <option value="Siap Diperiksa">Siap Diperiksa</option>
              <option value="Konsep">Konsep</option>
            </select>
          </div>

          {/* Fiscal Year Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
            <Calendar size={13} className="text-slate-400" />
            <select
              value={selectedYearFilter}
              onChange={(e) => setSelectedYearFilter(e.target.value)}
              className="text-xs bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer py-1"
            >
              <option value="all">Semua Tahun Anggaran</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr.toString()}>
                  Tahun {yr}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-slate-400 font-medium pl-1">
            Menampilkan <strong>{filteredArchives.length}</strong> data
          </span>
        </div>
      </div>

      {/* 3. Arsip & Riwayat Table View */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3 text-center w-12">No</th>
                <th className="py-3 px-3 text-center w-28 whitespace-nowrap">Tanggal Arsip</th>
                <th className="py-3 px-3 text-center w-44">Nomor SPJ</th>
                <th className="py-3 px-3 text-center w-36">Nomor Bukti BKU</th>
                <th className="py-3 px-3 text-center">Toko / Rekanan & Uraian</th>
                <th className="py-3 px-3 text-center w-32 whitespace-nowrap">Total Belanja</th>
                <th className="py-3 px-3 text-center w-48">Kelengkapan Berkas</th>
                <th className="py-3 px-3 text-center w-28">Status</th>
                <th className="py-3 px-3 text-center w-48">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredArchives.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Archive size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-semibold">Tidak ada arsip dokumen yang ditemukan.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Coba sesuaikan kata kunci pencarian atau filter status dokumen.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredArchives.map((arc, index) => {
                  const tx = transactions.find((t) => t.id === arc.transaksiId);

                  return (
                    <tr key={arc.id} className="hover:bg-blue-50/40 transition-colors group">
                      {/* No */}
                      <td className="py-3.5 px-3 text-center font-bold text-slate-400">
                        {index + 1}
                      </td>

                      {/* Tanggal */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-slate-600 font-medium">
                        <div>{formatTanggalIndo(arc.tanggalSpj)}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock size={10} />
                          <span>{arc.dibuatPada.split(' ')[1] || 'Tersimpan'}</span>
                        </div>
                      </td>

                      {/* Nomor SPJ */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-blue-800 bg-blue-50 border border-blue-200/70 px-2 py-0.5 rounded text-[11px]">
                            {arc.nomorSpj}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono" title={`Versi ${arc.versi || 1}`}>
                            v{arc.versi || 1}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate max-w-[170px] mt-0.5" title={arc.pdfFileName}>
                          {arc.pdfFileName}
                        </p>
                      </td>

                      {/* Nomor Bukti BKU */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-900 block">
                          {arc.nomorBukti}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">
                          Tahun {arc.tahunAnggaran}
                        </span>
                      </td>

                      {/* Pemasok & Uraian */}
                      <td className="py-3.5 px-3 max-w-xs">
                        <p className="font-bold text-slate-900 leading-tight">
                          {arc.pemasokNama}
                        </p>
                        {tx?.uraian && (
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5" title={tx.uraian}>
                            {tx.uraian}
                          </p>
                        )}
                      </td>

                      {/* Total Belanja */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {formatRupiah(arc.totalNilai)}
                      </td>

                      {/* Kelengkapan Berkas (Badges) */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {arc.jenisDokumenTermasuk?.map((j, jIdx) => {
                            let shortLabel = j;
                            if (j.includes('Pesanan')) shortLabel = 'Pesanan';
                            else if (j.includes('Faktur')) shortLabel = 'Faktur';
                            else if (j.includes('BAST')) shortLabel = 'BAST';
                            else if (j.includes('Kuitansi')) shortLabel = 'Kuitansi';
                            else if (j.includes('Foto')) shortLabel = 'Foto';

                            return (
                              <span
                                key={jIdx}
                                className="text-[9px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/80 px-1.5 py-0.5 rounded"
                                title={j}
                              >
                                {shortLabel}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            arc.status === 'Disahkan'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : arc.status === 'Siap Diperiksa'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          <CheckCircle2 size={11} className="text-emerald-600" />
                          <span>{arc.status}</span>
                        </span>
                      </td>

                      {/* Aksi: Lihat Detail & Cetak Ulang */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Tombol Lihat Detail */}
                          <button
                            onClick={() => setSelectedArchive(arc)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1 active:scale-95"
                            title="Buka rincian lengkap barang dan foto dokumen ini"
                          >
                            <Eye size={13} className="text-slate-600" />
                            <span>Lihat Detail</span>
                          </button>

                          {/* Tombol Cetak Ulang */}
                          <button
                            onClick={() => handleReprintPdf(arc)}
                            className="px-2.5 py-1.5 bg-[#1769E0] hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-xs active:scale-95"
                            title="Unduh / Cetak Ulang Berkas PDF Resmi Standar Bookman Old Style"
                          >
                            <Download size={13} />
                            <span>Cetak Ulang</span>
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

      {/* 4. MODAL: Detail Berkas Arsip SPJ */}
      {selectedArchive && matchedTxForDetail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
                  <Archive size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    Detail Dokumen Arsip SPJ BOS
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">{selectedArchive.nomorSpj}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedArchive(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold text-base"
              >
                ✕
              </button>
            </div>

            {/* Metadata Summary Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200/70">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Nomor Bukti BKU</span>
                <span className="font-mono font-bold text-blue-800 text-xs">{matchedTxForDetail.nomorBukti}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Tanggal Transaksi</span>
                <span className="font-semibold text-slate-800">{formatTanggalIndo(matchedTxForDetail.tanggal)}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Toko / Rekanan</span>
                <span className="font-semibold text-slate-800 truncate block">{matchedTxForDetail.pihakTerkait}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Belanja</span>
                <span className="font-mono font-bold text-slate-900 text-xs">{formatRupiah(matchedTxForDetail.nominal)}</span>
              </div>
            </div>

            {/* Uraian Transaksi */}
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block mb-0.5">
                Uraian Belanja Resmi:
              </span>
              <p className="text-slate-800 font-medium leading-relaxed">{matchedTxForDetail.uraian}</p>
            </div>

            {/* Rincian Barang yang Dipesan */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <ShoppingBag size={14} className="text-blue-600" />
                <span>Rincian Barang yang Dipesan ({matchedTxForDetail.items?.length || 0} Baris)</span>
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-100/80 font-bold text-slate-700 text-[11px]">
                    <tr>
                      <th className="p-2.5 w-10 text-center">No</th>
                      <th className="p-2.5 text-center">Nama Barang</th>
                      <th className="p-2.5 text-center w-28">Banyaknya</th>
                      <th className="p-2.5 text-center w-28">Harga Satuan</th>
                      <th className="p-2.5 text-center w-32">Total Harga</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {matchedTxForDetail.items && matchedTxForDetail.items.length > 0 ? (
                      matchedTxForDetail.items.map((it, idx) => (
                        <tr key={it.id} className="hover:bg-slate-50/60">
                          <td className="p-2 text-center font-bold text-slate-400">{idx + 1}</td>
                          <td className="p-2 font-medium text-slate-800">{it.namaBarang}</td>
                          <td className="p-2 text-center">{it.banyaknya} {it.satuan}</td>
                          <td className="p-2 text-right font-mono">{formatRupiah(it.hargaSatuan)}</td>
                          <td className="p-2 text-right font-mono font-bold text-slate-900">{formatRupiah(it.jumlahHarga)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-3 text-center text-slate-400">
                          {matchedTxForDetail.uraian} - {formatRupiah(matchedTxForDetail.nominal)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-bold border-t border-slate-200">
                      <td colSpan={4} className="p-2.5 text-right text-slate-600">Total Transaksi:</td>
                      <td className="p-2.5 text-right font-mono text-blue-900">{formatRupiah(matchedTxForDetail.nominal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Foto Dokumentasi di Arsip */}
            {matchedTxForDetail.fotoBarang && matchedTxForDetail.fotoBarang.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <ImageIcon size={14} className="text-purple-600" />
                  <span>Dokumentasi Foto Fisik Barang ({matchedTxForDetail.fotoBarang.length} Foto)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {matchedTxForDetail.fotoBarang.map((f) => (
                    <div key={f.id} className="border border-slate-200 rounded-xl p-2.5 bg-slate-50 text-xs space-y-1.5">
                      <img src={f.dataUrl} alt={f.namaFile} className="w-full h-36 object-cover rounded-lg" />
                      <p className="font-bold text-slate-900 truncate" title={f.namaFile}>{f.namaFile}</p>
                      <p className="text-[10px] text-slate-500 italic leading-snug">{f.keterangan || 'Kondisi barang baik dan lengkap.'}</p>
                      <p className="text-[9px] text-slate-400">Diunggah: {f.diunggahPada}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Footer with Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="text-[11px] text-slate-400">
                Penyusun: {selectedArchive.dibuatOleh}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedArchive(null)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Tutup
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleReprintPdf(selectedArchive);
                  }}
                  className="px-4 py-2 bg-[#1769E0] hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <Download size={14} />
                  <span>Cetak Ulang Dokumen PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
