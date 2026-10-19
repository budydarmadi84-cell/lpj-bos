import React, { useState } from 'react';
import {
  FileCheck2,
  Printer,
  Download,
  Archive,
  Eye,
  CheckSquare,
  Square,
  FileText,
  AlertCircle,
  Building,
  CheckCircle2,
  Sparkles,
  PenTool,
  ShieldCheck,
  Stamp,
  RotateCcw,
  Check,
  UserCheck,
  QrCode,
} from 'lucide-react';
import { BkuTransaction, SchoolProfile, Pemasok, SpjDocumentArchive, FiscalYear } from '../../types';
import { formatRupiah, formatTanggalIndo, terbilangRupiah } from '../../utils/formatters';
import { generateSpjPdf, SpjPdfOptions } from '../../services/pdfGenerator';
import { localDB } from '../../services/storage';
import { SignaturePadModal } from '../common/SignaturePadModal';
import { createSignaturePng, createSchoolStampPng, createVendorStampPng } from '../../utils/signatureUtils';
import { KopSurat } from '../common/KopSurat';

interface SpjGeneratorViewProps {
  transactions: BkuTransaction[];
  school: SchoolProfile;
  fiscalYear: FiscalYear;
  pemasokList: Pemasok[];
  initialSelectedTx?: BkuTransaction | null;
  onRefresh: () => void;
  onNavigateToArchive: () => void;
}

export const SpjGeneratorView: React.FC<SpjGeneratorViewProps> = ({
  transactions,
  school,
  fiscalYear,
  pemasokList,
  initialSelectedTx,
  onRefresh,
  onNavigateToArchive,
}) => {
  const expenseTxs = transactions.filter((t) => t.jenis === 'pengeluaran' && t.status !== 'dibatalkan');

  const [selectedTxId, setSelectedTxId] = useState<string>(
    initialSelectedTx?.id || (expenseTxs.length > 0 ? expenseTxs[0].id : '')
  );

  const selectedTx = expenseTxs.find((t) => t.id === selectedTxId);

  // Document inclusion checkboxes & print configuration
  const [options, setOptions] = useState<SpjPdfOptions>({
    includeSuratPesanan: true,
    includeFaktur: true,
    includeBast: true,
    includeKuitansi: true,
    includeFoto: true,
    useElectronicSignature: true,
    includeStempel: true,
    paperSize: school.ukuranKertas || 'A4',
    marginTopCm: school.marginTopCm ?? 2,
  });

  const [activeTabPreview, setActiveTabPreview] = useState<'surat_pesanan' | 'faktur' | 'bast' | 'kuitansi' | 'foto'>('surat_pesanan');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Signature Modal state
  const [sigModal, setSigModal] = useState<{
    isOpen: boolean;
    field: 'ttdKepalaSekolah' | 'ttdBendahara' | 'ttdPengurusBarang' | 'stempelSekolah' | 'ttdRekanan' | 'stempelToko';
    title: string;
    roleName: string;
    signatoryName: string;
    nip?: string;
    existingSignature?: string;
  } | null>(null);

  const matchedPemasok = pemasokList.find((p) => p.id === selectedTx?.pemasokId);
  const vendorName = matchedPemasok?.namaPemilik || (selectedTx ? selectedTx.pihakTerkait.split('(')[0].trim() : 'ROMA DANI');
  const vendorStore = matchedPemasok?.namaToko || (selectedTx?.pihakTerkait.includes('(') ? selectedTx.pihakTerkait.split('(')[1].replace(')', '').trim() : 'IZZI Fotocopy');
  const vendorAddress = matchedPemasok?.alamat || 'Harum Sari';
  const vendorSignature = matchedPemasok?.ttdRekanan || school.ttdBendahara;
  const vendorStamp = matchedPemasok?.stempelToko;

  // Toggle option
  const toggleOption = (key: keyof SpjPdfOptions) => {
    setOptions({ ...options, [key]: !options[key] });
  };

  // Save Signature from Modal
  const handleSaveSignature = (dataUrl: string) => {
    if (!sigModal) return;

    if (
      sigModal.field === 'ttdKepalaSekolah' ||
      sigModal.field === 'ttdBendahara' ||
      sigModal.field === 'ttdPengurusBarang' ||
      sigModal.field === 'stempelSekolah'
    ) {
      const updatedSchool: SchoolProfile = {
        ...school,
        [sigModal.field]: dataUrl,
      };
      localDB.saveSchoolProfile(updatedSchool);
      setSaveSuccessMsg(`Tanda tangan / Stempel untuk ${sigModal.roleName} berhasil diperbarui!`);
      onRefresh();
    } else if (sigModal.field === 'ttdRekanan' || sigModal.field === 'stempelToko') {
      if (matchedPemasok) {
        const updatedVendor: Pemasok = {
          ...matchedPemasok,
          [sigModal.field]: dataUrl,
        };
        localDB.savePemasok(updatedVendor);
      } else if (selectedTx) {
        const newVendor: Pemasok = {
          id: 'pem-' + Date.now(),
          namaToko: vendorStore,
          namaPemilik: vendorName,
          alamat: vendorAddress,
          telepon: '0812-3344-5566',
          bidangUsaha: 'Penyedia Barang / Jasa BOS',
          isActive: true,
          createdAt: new Date().toISOString().split('T')[0],
          [sigModal.field]: dataUrl,
        };
        localDB.savePemasok(newVendor);
      }
      setSaveSuccessMsg(`TTE / Stempel Pihak Rekanan (${vendorStore}) berhasil disimpan!`);
      onRefresh();
    }

    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  // Instant 1-Click Auto Sign All
  const handleAutoSignAll = () => {
    const updatedSchool: SchoolProfile = {
      ...school,
      ttdKepalaSekolah: school.ttdKepalaSekolah || createSignaturePng(school.namaKepalaSekolah, '#0B2545'),
      ttdBendahara: school.ttdBendahara || createSignaturePng(school.namaBendahara, '#0B2545'),
      ttdPengurusBarang: school.ttdPengurusBarang || createSignaturePng(school.namaPengurusBarang, '#0B2545'),
      stempelSekolah: school.stempelSekolah || createSchoolStampPng(school.namaSekolah, 'DANA BOS ACEH TAMIANG'),
    };
    localDB.saveSchoolProfile(updatedSchool);

    if (matchedPemasok) {
      const updatedVendor: Pemasok = {
        ...matchedPemasok,
        ttdRekanan: matchedPemasok.ttdRekanan || createSignaturePng(matchedPemasok.namaPemilik, '#0B2545'),
        stempelToko: matchedPemasok.stempelToko || createVendorStampPng(matchedPemasok.namaToko, matchedPemasok.namaPemilik),
      };
      localDB.savePemasok(updatedVendor);
    }

    setSaveSuccessMsg('Seluruh Tanda Tangan Elektronik (Kepala Sekolah, Bendahara, Pengurus Barang, Rekanan) & Stempel Resmi berhasil disinkronkan!');
    onRefresh();
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  // Generate & Download PDF
  const handleDownloadPdf = () => {
    if (!selectedTx) return;
    const doc = generateSpjPdf(selectedTx, school, matchedPemasok, options);
    const cleanFileName = `SPJ_${selectedTx.nomorBukti.replace(/[/\\?%*:|"<>]/g, '_')}_${school.namaSekolah.replace(/\s+/g, '_')}.pdf`;
    doc.save(cleanFileName);

    // Save metadata to local archive
    saveToArchiveRecord(cleanFileName);
  };

  // Print PDF directly
  const handlePrintPdf = () => {
    if (!selectedTx) return;
    const doc = generateSpjPdf(selectedTx, school, matchedPemasok, options);
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = blobUrl as any;
    document.body.appendChild(iframe);
    saveToArchiveRecord(`SPJ_${selectedTx.nomorBukti.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`);
  };

  const saveToArchiveRecord = (fileName: string) => {
    if (!selectedTx) return;
    const docsIncluded: string[] = [];
    if (options.includeSuratPesanan) docsIncluded.push('Surat Pesanan Barang');
    if (options.includeFaktur) docsIncluded.push('Faktur / Bon Pembelian');
    if (options.includeBast) docsIncluded.push('Berita Acara Serah Terima (BAST)');
    if (options.includeKuitansi) docsIncluded.push('Kuitansi Tanda Penerimaan');
    if (options.includeFoto) docsIncluded.push('Dokumentasi Foto Fisik Barang');

    const archiveItem: SpjDocumentArchive = {
      id: 'arc-' + Date.now(),
      transaksiId: selectedTx.id,
      nomorSpj: `SPJ-${fiscalYear.tahun}/${selectedTx.nomorBukti}`,
      nomorBukti: selectedTx.nomorBukti,
      tanggalSpj: selectedTx.tanggal,
      tahunAnggaran: fiscalYear.tahun,
      pemasokNama: selectedTx.pihakTerkait,
      totalNilai: selectedTx.nominal,
      jenisDokumenTermasuk: docsIncluded,
      pdfFileName: fileName,
      versi: 1,
      status: 'Disahkan',
      dibuatPada: new Date().toLocaleString('id-ID'),
      dibuatOleh: school.namaBendahara,
    };

    localDB.saveArchive(archiveItem);
    setSaveSuccessMsg(`Dokumen ${fileName} berhasil diarsip ke sistem lokal!`);
    onRefresh();
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  if (!selectedTx) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
        Belum ada transaksi pengeluaran belanja yang dapat dibuatkan SPJ. Silakan input transaksi belanja di modul BKU terlebih dahulu.
      </div>
    );
  }

  const items = selectedTx.items && selectedTx.items.length > 0 ? selectedTx.items : [
    {
      id: 'item-fallback',
      transaksiId: selectedTx.id,
      namaBarang: selectedTx.uraian,
      banyaknya: 1,
      satuan: 'Paket',
      hargaSatuan: selectedTx.nominal,
      jumlahHarga: selectedTx.nominal,
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* 1. Header & Transaction Selector */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
            <FileCheck2 size={22} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Generator Dokumen SPJ BOS (Standar Tipografi Bookman Old Style & Kertas A4)
            </h3>
            <p className="text-xs text-slate-500">
              Menghasilkan satu berkas PDF resmi lengkap: Surat Pesanan, Faktur Toko, BAST, Kuitansi Penerimaan, & Foto Dokumentasi Barang dengan dukungan Tanda Tangan Elektronik (TTE).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <label className="text-xs font-bold text-slate-700 shrink-0">Pilih Transaksi Belanja:</label>
          <select
            value={selectedTxId}
            onChange={(e) => setSelectedTxId(e.target.value)}
            className="w-full lg:w-80 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {expenseTxs.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nomorBukti} - {formatRupiah(t.nominal)} ({t.uraian.substring(0, 25)}...)
              </option>
            ))}
          </select>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span className="font-semibold">{saveSuccessMsg}</span>
          </div>
          <button
            onClick={onNavigateToArchive}
            className="text-xs font-bold text-emerald-800 underline hover:text-emerald-950"
          >
            Buka Ruang Arsip
          </button>
        </div>
      )}

      {/* 2. FITUR TANDA TANGAN ELEKTRONIK (TTE) CONTROLLER */}
      <div className="bg-linear-to-r from-blue-50/70 via-indigo-50/50 to-slate-50 p-5 rounded-2xl border border-blue-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-200/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <PenTool size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <span>Fitur Tanda Tangan Elektronik (TTE) & Stempel Sah</span>
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  Aktif & Siap Disematkan
                </span>
              </h4>
              <p className="text-[11px] text-slate-600">
                Bubuhkan goresan tanda tangan digital, unggah scan stempel, atau sertifikat QR resmi pada lembar SPJ PDF.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleAutoSignAll}
              className="px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95"
              title="Lengkapi TTE otomatis untuk semua pihak"
            >
              <Sparkles size={14} className="text-amber-500" />
              <span>Lengkapi TTE Otomatis (1-Klik)</span>
            </button>

            {/* Toggle TTE */}
            <button
              type="button"
              onClick={() => toggleOption('useElectronicSignature')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                options.useElectronicSignature
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              <ShieldCheck size={14} />
              <span>{options.useElectronicSignature ? 'TTE Aktif (On)' : 'TTE Non-Aktif (Basah)'}</span>
            </button>
          </div>
        </div>

        {/* 4 Signatories Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* 1. Kepala Sekolah */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">1. Kepala Sekolah</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${school.ttdKepalaSekolah ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                {school.ttdKepalaSekolah ? '✓ Ada TTE' : 'Belum Ada'}
              </span>
            </div>
            <p className="font-bold text-slate-900 truncate" title={school.namaKepalaSekolah}>{school.namaKepalaSekolah}</p>
            <div className="h-12 bg-slate-50 border border-dashed border-slate-200 rounded-lg flex items-center justify-center p-1">
              {school.ttdKepalaSekolah ? (
                <img src={school.ttdKepalaSekolah} alt="TTE Kepsek" className="h-10 object-contain" />
              ) : (
                <span className="text-[10px] text-slate-400 italic">Klik untuk tanda tangan</span>
              )}
            </div>
            <button
              type="button"
              onClick={() =>
                setSigModal({
                  isOpen: true,
                  field: 'ttdKepalaSekolah',
                  title: 'Tanda Tangan Elektronik Kepala Sekolah',
                  roleName: 'Kepala Sekolah',
                  signatoryName: school.namaKepalaSekolah,
                  nip: school.nipKepalaSekolah,
                  existingSignature: school.ttdKepalaSekolah,
                })
              }
              className="w-full py-1 bg-slate-50 hover:bg-blue-50 text-blue-700 border border-slate-200 hover:border-blue-300 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
            >
              <PenTool size={11} />
              <span>{school.ttdKepalaSekolah ? 'Ganti TTE' : 'Beri TTE'}</span>
            </button>
          </div>

          {/* 2. Bendahara BOS */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">2. Bendahara BOS</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${school.ttdBendahara ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                {school.ttdBendahara ? '✓ Ada TTE' : 'Belum Ada'}
              </span>
            </div>
            <p className="font-bold text-slate-900 truncate" title={school.namaBendahara}>{school.namaBendahara}</p>
            <div className="h-12 bg-slate-50 border border-dashed border-slate-200 rounded-lg flex items-center justify-center p-1">
              {school.ttdBendahara ? (
                <img src={school.ttdBendahara} alt="TTE Bendahara" className="h-10 object-contain" />
              ) : (
                <span className="text-[10px] text-slate-400 italic">Klik untuk tanda tangan</span>
              )}
            </div>
            <button
              type="button"
              onClick={() =>
                setSigModal({
                  isOpen: true,
                  field: 'ttdBendahara',
                  title: 'Tanda Tangan Elektronik Bendahara BOS',
                  roleName: 'Bendahara BOS',
                  signatoryName: school.namaBendahara,
                  nip: school.nipBendahara,
                  existingSignature: school.ttdBendahara,
                })
              }
              className="w-full py-1 bg-slate-50 hover:bg-blue-50 text-blue-700 border border-slate-200 hover:border-blue-300 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
            >
              <PenTool size={11} />
              <span>{school.ttdBendahara ? 'Ganti TTE' : 'Beri TTE'}</span>
            </button>
          </div>

          {/* 3. Pengurus Barang */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">3. Pengurus Barang</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${school.ttdPengurusBarang ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                {school.ttdPengurusBarang ? '✓ Ada TTE' : 'Belum Ada'}
              </span>
            </div>
            <p className="font-bold text-slate-900 truncate" title={school.namaPengurusBarang}>{school.namaPengurusBarang}</p>
            <div className="h-12 bg-slate-50 border border-dashed border-slate-200 rounded-lg flex items-center justify-center p-1">
              {school.ttdPengurusBarang ? (
                <img src={school.ttdPengurusBarang} alt="TTE Pengurus Barang" className="h-10 object-contain" />
              ) : (
                <span className="text-[10px] text-slate-400 italic">Klik untuk tanda tangan</span>
              )}
            </div>
            <button
              type="button"
              onClick={() =>
                setSigModal({
                  isOpen: true,
                  field: 'ttdPengurusBarang',
                  title: 'Tanda Tangan Elektronik Pengurus Barang',
                  roleName: 'Pengurus Barang',
                  signatoryName: school.namaPengurusBarang,
                  nip: school.nipPengurusBarang,
                  existingSignature: school.ttdPengurusBarang,
                })
              }
              className="w-full py-1 bg-slate-50 hover:bg-blue-50 text-blue-700 border border-slate-200 hover:border-blue-300 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
            >
              <PenTool size={11} />
              <span>{school.ttdPengurusBarang ? 'Ganti TTE' : 'Beri TTE'}</span>
            </button>
          </div>

          {/* 4. Rekanan / Toko */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">4. Toko / Rekanan</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${vendorSignature ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                {vendorSignature ? '✓ Ada TTE' : 'Belum Ada'}
              </span>
            </div>
            <p className="font-bold text-slate-900 truncate" title={vendorStore}>{vendorStore} ({vendorName})</p>
            <div className="h-12 bg-slate-50 border border-dashed border-slate-200 rounded-lg flex items-center justify-center p-1">
              {vendorSignature ? (
                <img src={vendorSignature} alt="TTE Rekanan" className="h-10 object-contain" />
              ) : (
                <span className="text-[10px] text-slate-400 italic">Klik untuk tanda tangan</span>
              )}
            </div>
            <button
              type="button"
              onClick={() =>
                setSigModal({
                  isOpen: true,
                  field: 'ttdRekanan',
                  title: `Tanda Tangan Pemilik ${vendorStore}`,
                  roleName: 'Pemilik Toko / Rekanan',
                  signatoryName: vendorName,
                  existingSignature: vendorSignature,
                })
              }
              className="w-full py-1 bg-slate-50 hover:bg-blue-50 text-blue-700 border border-slate-200 hover:border-blue-300 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
            >
              <PenTool size={11} />
              <span>{vendorSignature ? 'Ganti TTE' : 'Beri TTE'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Document Selection Checklist & Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Kolom Kiri: Checkbox Dokumen yang Disertakan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Komponen Dokumen SPJ
            </h4>
            <p className="text-[11px] text-slate-500 mb-3">
              Pilih lembaran dokumen yang ingin dimasukkan ke dalam berkas PDF SPJ:
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => toggleOption('includeSuratPesanan')}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-xs font-semibold text-left transition-colors ${
                options.includeSuratPesanan
                  ? 'bg-blue-50 border-blue-300 text-blue-900'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              {options.includeSuratPesanan ? (
                <CheckSquare size={16} className="text-blue-600 shrink-0" />
              ) : (
                <Square size={16} className="text-slate-400 shrink-0" />
              )}
              <span>1. Surat Pesanan Barang</span>
            </button>

            <button
              onClick={() => toggleOption('includeFaktur')}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-xs font-semibold text-left transition-colors ${
                options.includeFaktur
                  ? 'bg-blue-50 border-blue-300 text-blue-900'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              {options.includeFaktur ? (
                <CheckSquare size={16} className="text-blue-600 shrink-0" />
              ) : (
                <Square size={16} className="text-slate-400 shrink-0" />
              )}
              <span>2. Bon / Faktur Toko Asli</span>
            </button>

            <button
              onClick={() => toggleOption('includeBast')}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-xs font-semibold text-left transition-colors ${
                options.includeBast
                  ? 'bg-blue-50 border-blue-300 text-blue-900'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              {options.includeBast ? (
                <CheckSquare size={16} className="text-blue-600 shrink-0" />
              ) : (
                <Square size={16} className="text-slate-400 shrink-0" />
              )}
              <span>3. Berita Acara Serah Terima (BAST)</span>
            </button>

            <button
              onClick={() => toggleOption('includeKuitansi')}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-xs font-semibold text-left transition-colors ${
                options.includeKuitansi
                  ? 'bg-blue-50 border-blue-300 text-blue-900'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              {options.includeKuitansi ? (
                <CheckSquare size={16} className="text-blue-600 shrink-0" />
              ) : (
                <Square size={16} className="text-slate-400 shrink-0" />
              )}
              <span>4. Kuitansi Tanda Penerimaan</span>
            </button>

            <button
              onClick={() => toggleOption('includeFoto')}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-xs font-semibold text-left transition-colors ${
                options.includeFoto
                  ? 'bg-blue-50 border-blue-300 text-blue-900'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              {options.includeFoto ? (
                <CheckSquare size={16} className="text-blue-600 shrink-0" />
              ) : (
                <Square size={16} className="text-slate-400 shrink-0" />
              )}
              <div className="flex items-center justify-between w-full">
                <span>5. Lampiran Foto Fisik Barang</span>
                <span className="text-[10px] font-mono font-bold text-slate-500">
                  {selectedTx.fotoBarang?.length || 0} Foto
                </span>
              </div>
            </button>

            {/* Stempel Checkbox */}
            <button
              onClick={() => toggleOption('includeStempel')}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-xs font-semibold text-left transition-colors mt-2 ${
                options.includeStempel
                  ? 'bg-purple-50 border-purple-300 text-purple-900'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              {options.includeStempel ? (
                <CheckSquare size={16} className="text-purple-600 shrink-0" />
              ) : (
                <Square size={16} className="text-slate-400 shrink-0" />
              )}
              <span>Sertakan Stempel Sekolah & Toko</span>
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2">
            <button
              onClick={handleDownloadPdf}
              className="w-full py-2.5 px-4 bg-[#1769E0] hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Download size={15} />
              <span>Simpan & Unduh PDF SPJ</span>
            </button>

            <button
              onClick={handlePrintPdf}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Printer size={15} />
              <span>Cetak Langsung (Print)</span>
            </button>
          </div>
        </div>

        {/* Kolom Kanan: Pratinjau Dokumen Presisi Sesuai Template Aceh Tamiang */}
        <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-xs font-bold text-slate-700 mr-1">Pratinjau Lembar:</span>
              <button
                onClick={() => setActiveTabPreview('surat_pesanan')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTabPreview === 'surat_pesanan'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                1. Surat Pesanan
              </button>
              <button
                onClick={() => setActiveTabPreview('faktur')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTabPreview === 'faktur'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                2. Bon / Faktur
              </button>
              <button
                onClick={() => setActiveTabPreview('bast')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTabPreview === 'bast'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                3. BAST Barang
              </button>
              <button
                onClick={() => setActiveTabPreview('kuitansi')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTabPreview === 'kuitansi'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                4. Kuitansi
              </button>
              <button
                onClick={() => setActiveTabPreview('foto')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTabPreview === 'foto'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                5. Foto Fisik
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg">
                Margin Atas: {options.marginTopCm ?? 2} cm
              </span>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setOptions({ ...options, paperSize: 'A4' })}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                    (options.paperSize || 'A4') === 'A4'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📄 A4 (210×297)
                </button>
                <button
                  type="button"
                  onClick={() => setOptions({ ...options, paperSize: 'F4' })}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                    options.paperSize === 'F4'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📜 F4 / Folio (8.5"×13")
                </button>
              </div>
            </div>
          </div>

          {/* Paper View Container (Simulates real A4/F4 print layout in Bookman Old Style) */}
          <div className="bg-slate-100/70 p-4 sm:p-8 rounded-xl border border-slate-200 overflow-y-auto max-h-[75vh]">
            <div
              className={`bg-white mx-auto shadow-lg border border-slate-300 p-8 sm:p-12 ${
                options.paperSize === 'F4' ? 'max-w-3xl ring-2 ring-emerald-500/10' : 'max-w-2xl'
              } text-slate-900 leading-normal text-xs min-h-[750px] font-bookman`}
              style={{ fontFamily: "'Bookman Old Style', 'URW Bookman', 'Bookman', 'TeX Gyre Bonum', 'Lora', serif" }}
            >
              {/* TAB 1: SURAT PESANAN */}
              {activeTabPreview === 'surat_pesanan' && (
                <div className="space-y-4">
                  {/* Kop Surat Standar Resmi dengan Logo Kabupaten (Kiri) dan Tulisan Center */}
                  <KopSurat
                    school={school}
                    paperSize={options.paperSize}
                    marginTopCm={options.marginTopCm}
                  />

                  {/* Date & Destination */}
                  <div className="flex justify-between pt-2">
                    <div className="space-y-0.5">
                      <p>Nomor &nbsp; &nbsp;: {selectedTx.nomorBukti}</p>
                      <p>Lamp &nbsp; &nbsp; &nbsp;: 1 Lembar</p>
                      <p className="font-bold italic">Hal &nbsp; &nbsp; &nbsp; &nbsp; : Pesanan Barang</p>
                    </div>
                    <div className="text-left space-y-0.5">
                      <p>Pulau Tiga, {formatTanggalIndo(selectedTx.tanggal)}</p>
                      <p>Kepala Yth :</p>
                      <p className="font-bold uppercase">{vendorName}</p>
                      <p>{vendorStore}</p>
                      <p>Di <br />&nbsp; &nbsp;{vendorAddress}</p>
                    </div>
                  </div>

                  {/* Body Text */}
                  <div className="pt-2 space-y-2">
                    <p>Dengan Hormat,</p>
                    <p className="leading-relaxed text-justify">
                      Dengan ini kami minta bantuan saudara agar dapat menyediakan pengadaan {selectedTx.uraian} untuk kebutuhan {school.namaSekolah} {school.kecamatan} {school.kabupaten} sebagai berikut :
                    </p>
                  </div>

                  {/* Item Table */}
                  <table className="w-full border-collapse border border-slate-900 mt-2">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-center">
                        <th className="border border-slate-900 py-1.5 px-2 w-12 text-center">No</th>
                        <th className="border border-slate-900 py-1.5 px-3 text-center">Nama Barang</th>
                        <th className="border border-slate-900 py-1.5 px-3 w-36 text-center">Banyaknya</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, idx) => (
                        <tr key={it.id}>
                          <td className="border border-slate-900 py-1 px-2 text-center">{idx + 1}</td>
                          <td className="border border-slate-900 py-1 px-3">{it.namaBarang}</td>
                          <td className="border border-slate-900 py-1 px-3 text-center">{it.banyaknya} {it.satuan}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <p className="pt-2">Demikian pesanan ini kami sampaikan agar dapat saudara penuhi. Terima Kasih</p>

                  {/* Signature with TTE and Stamp */}
                  <div className="pt-4 flex justify-end">
                    <div className="text-center w-64 relative">
                      <p>Kepala {school.namaSekolah}</p>
                      
                      <div className="h-20 flex items-center justify-center relative my-1">
                        {options.useElectronicSignature && (
                          <>
                            {options.includeStempel && school.stempelSekolah && (
                              <img
                                src={school.stempelSekolah}
                                alt="Stempel Sekolah"
                                className="absolute -left-2 top-0 h-18 w-18 object-contain pointer-events-none opacity-85"
                              />
                            )}
                            {school.ttdKepalaSekolah ? (
                              <img
                                src={school.ttdKepalaSekolah}
                                alt="TTE Kepala Sekolah"
                                className="max-h-16 max-w-full object-contain relative z-10"
                              />
                            ) : (
                              <div className="text-[10px] text-slate-300 italic">Tanda Tangan Basah</div>
                            )}
                          </>
                        )}
                        {!options.useElectronicSignature && (
                          <div className="text-[10px] text-slate-300 italic">Area Tanda Tangan Basah</div>
                        )}
                      </div>

                      <p className="font-bold underline uppercase">{school.namaKepalaSekolah}</p>
                      <p className="text-[11px]">NIP. {school.nipKepalaSekolah}</p>
                      {options.useElectronicSignature && school.ttdKepalaSekolah && (
                        <span className="text-[9px] font-sans text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 mt-0.5 inline-block">
                          ✓ Ditandatangani secara Elektronik
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: BON / FAKTUR */}
              {activeTabPreview === 'faktur' && (
                <div className="space-y-4">
                  <div className="flex justify-end text-left">
                    <div className="space-y-0.5">
                      <p>{vendorAddress}, {formatTanggalIndo(selectedTx.tanggal)}</p>
                      <p>Kepada :</p>
                      <p className="font-semibold">Kepala {school.namaSekolah}</p>
                      <p>di Tempat</p>
                    </div>
                  </div>

                  <div className="text-center py-2">
                    <h3 className="font-bold text-sm tracking-wide">BON / FAKTUR No................................</h3>
                  </div>

                  <table className="w-full border-collapse border border-slate-900">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-center">
                        <th className="border border-slate-900 py-1.5 px-2 w-28 text-center">Banyaknya</th>
                        <th className="border border-slate-900 py-1.5 px-3 text-center">Nama Barang</th>
                        <th className="border border-slate-900 py-1.5 px-2 w-28 text-center">@ ( Rp )</th>
                        <th className="border border-slate-900 py-1.5 px-2 w-32 text-center">Jumlah Harga (Rp)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it) => (
                        <tr key={it.id}>
                          <td className="border border-slate-900 py-1 px-2 text-center">{it.banyaknya} {it.satuan}</td>
                          <td className="border border-slate-900 py-1 px-3">{it.namaBarang}</td>
                          <td className="border border-slate-900 py-1 px-2 text-right">{it.hargaSatuan.toLocaleString('id-ID')}</td>
                          <td className="border border-slate-900 py-1 px-2 text-right font-bold">{it.jumlahHarga.toLocaleString('id-ID')}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="font-bold">
                        <td colSpan={3} className="border border-slate-900 py-1.5 px-3 text-right">Jumlah</td>
                        <td className="border border-slate-900 py-1.5 px-2 text-right">{selectedTx.nominal.toLocaleString('id-ID')}</td>
                      </tr>
                    </tfoot>
                  </table>

                  <div className="pt-4 flex justify-between items-start">
                    <div className="border border-slate-900 p-2 text-[10px] w-56">
                      Barang-barang yang sudah dibeli tidak dapat dikembalikan
                    </div>
                    <div className="text-center w-56 relative">
                      <p>Tanda Terima</p>
                      
                      <div className="h-18 flex items-center justify-center relative my-1">
                        {options.useElectronicSignature && (
                          <>
                            {options.includeStempel && vendorStamp && (
                              <img
                                src={vendorStamp}
                                alt="Stempel Rekanan"
                                className="absolute -left-2 top-0 h-16 w-16 object-contain pointer-events-none opacity-85"
                              />
                            )}
                            {vendorSignature ? (
                              <img
                                src={vendorSignature}
                                alt="TTE Rekanan"
                                className="max-h-14 max-w-full object-contain relative z-10"
                              />
                            ) : (
                              <div className="text-[10px] text-slate-300 italic">Tanda Tangan Basah</div>
                            )}
                          </>
                        )}
                        {!options.useElectronicSignature && (
                          <div className="text-[10px] text-slate-300 italic">Area Tanda Tangan Basah</div>
                        )}
                      </div>

                      <p className="font-bold underline uppercase">{vendorName}</p>
                      {options.useElectronicSignature && vendorSignature && (
                        <span className="text-[9px] font-sans text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 mt-0.5 inline-block">
                          ✓ Sah Rekanan
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: BAST BARANG */}
              {activeTabPreview === 'bast' && (
                <div className="space-y-4">
                  <div className="text-center pb-2">
                    <h3 className="font-bold text-sm tracking-wide border-b border-slate-900 pb-1 inline-block uppercase">
                      SURAT BERITA ACARA SERAH TERIMA BARANG
                    </h3>
                  </div>

                  <p className="leading-relaxed text-justify">
                    Pada hari ini {formatTanggalIndo(selectedTx.tanggal)} Sekolah Dasar Negeri Bangun Sari. Kami yang bertanda tangan dibawah ini :
                  </p>

                  <div className="space-y-1 pl-4">
                    <p><span className="w-36 inline-block font-semibold">Nama</span>: {vendorName.toUpperCase()}</p>
                    <p><span className="w-36 inline-block font-semibold">Pekerjaan</span>: {vendorStore}</p>
                    <p><span className="w-36 inline-block font-semibold">Alamat</span>: {vendorAddress}</p>
                    <p><span className="w-36 inline-block font-semibold">Selanjutnya disebut</span>: <strong className="font-bold">PIHAK PERTAMA ( I )</strong></p>
                  </div>

                  <div className="space-y-1 pl-4 pt-1">
                    <p><span className="w-36 inline-block font-semibold">Nama</span>: <strong>{school.namaPengurusBarang}</strong></p>
                    <p><span className="w-36 inline-block font-semibold">Jabatan</span>: Pengurus Barang</p>
                    <p><span className="w-36 inline-block font-semibold">Alamat</span>: {school.alamat}</p>
                    <p><span className="w-36 inline-block font-semibold">Selanjutnya disebut</span>: <strong className="font-bold">PIHAK KEDUA ( II )</strong></p>
                  </div>

                  <div className="pt-2">
                    <p className="font-bold">Pasal ( 1 )</p>
                    <p className="leading-relaxed text-justify">
                      1. PIHAK PERTAMA telah menyerahkan kepada PIHAK KEDUA dan PIHAK KEDUA telah menerima dari PIHAK PERTAMA bertempat di {school.namaSekolah} {school.kecamatan} {school.kabupaten}, berupa pembayaran lunas pengadaan {selectedTx.uraian} berdasarkan surat pesanan Nomor : {selectedTx.nomorBukti}
                    </p>
                    <p className="leading-relaxed pt-1">
                      2. PIHAK KEDUA telah menerima barang-barang sebagaimana dimaksud pada poin 1 diatas dengan baik, lengkap, cukup dan sempurna.
                    </p>
                  </div>

                  <div className="pt-1">
                    <p className="font-bold">Pasal ( 2 )</p>
                    <p className="leading-relaxed">
                      1. Terhitung mulai tanggal penyerahan barang ini PIHAK PERTAMA telah bebas dari segala tanggung jawab atas pelaksanaan barang tersebut.
                    </p>
                  </div>

                  {/* 3 Signatures in BAST with TTE & Stamp */}
                  <div className="grid grid-cols-2 gap-4 pt-4 text-center">
                    <div>
                      <p>Yang menerima</p>
                      <p className="font-bold">PIHAK KEDUA</p>
                      <div className="h-18 flex items-center justify-center relative my-1">
                        {options.useElectronicSignature && school.ttdPengurusBarang ? (
                          <img src={school.ttdPengurusBarang} alt="TTE Pengurus Barang" className="max-h-14 max-w-full object-contain" />
                        ) : (
                          <div className="text-[10px] text-slate-300 italic">Tanda Tangan Basah</div>
                        )}
                      </div>
                      <p className="font-bold underline">{school.namaPengurusBarang}</p>
                      <p className="text-[10px]">NIP. {school.nipPengurusBarang}</p>
                    </div>

                    <div>
                      <p>PIHAK PERTAMA</p>
                      <p className="font-bold">Yang Menyerahkan</p>
                      <div className="h-18 flex items-center justify-center relative my-1">
                        {options.useElectronicSignature && (
                          <>
                            {options.includeStempel && vendorStamp && (
                              <img src={vendorStamp} alt="Stempel Rekanan" className="absolute left-2 top-0 h-16 w-16 object-contain pointer-events-none opacity-85" />
                            )}
                            {vendorSignature ? (
                              <img src={vendorSignature} alt="TTE Rekanan" className="max-h-14 max-w-full object-contain relative z-10" />
                            ) : (
                              <div className="text-[10px] text-slate-300 italic">Tanda Tangan Basah</div>
                            )}
                          </>
                        )}
                        {!options.useElectronicSignature && (
                          <div className="text-[10px] text-slate-300 italic">Tanda Tangan Basah</div>
                        )}
                      </div>
                      <p className="font-bold underline uppercase">{vendorName}</p>
                    </div>
                  </div>

                  <div className="pt-4 text-center">
                    <p>Mengetahui :</p>
                    <p>Kepala {school.namaSekolah}</p>
                    <div className="h-18 flex items-center justify-center relative my-1 max-w-xs mx-auto">
                      {options.useElectronicSignature && (
                        <>
                          {options.includeStempel && school.stempelSekolah && (
                            <img src={school.stempelSekolah} alt="Stempel Sekolah" className="absolute left-6 top-0 h-16 w-16 object-contain pointer-events-none opacity-85" />
                          )}
                          {school.ttdKepalaSekolah ? (
                            <img src={school.ttdKepalaSekolah} alt="TTE Kepala Sekolah" className="max-h-14 max-w-full object-contain relative z-10" />
                          ) : (
                            <div className="text-[10px] text-slate-300 italic">Tanda Tangan Basah</div>
                          )}
                        </>
                      )}
                      {!options.useElectronicSignature && (
                        <div className="text-[10px] text-slate-300 italic">Tanda Tangan Basah</div>
                      )}
                    </div>
                    <p className="font-bold underline">{school.namaKepalaSekolah}</p>
                    <p className="text-[10px]">NIP. {school.nipKepalaSekolah}</p>
                  </div>
                </div>
              )}

              {/* TAB 4: KUITANSI TANDA PENERIMAAN */}
              {activeTabPreview === 'kuitansi' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <p>No &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;: {selectedTx.nomorBukti}</p>
                      <p>Kode Rek. : {selectedTx.kodeRekening}</p>
                      <p>Tahun &nbsp; &nbsp; &nbsp;: {fiscalYear.tahun}</p>
                    </div>
                    <div className="text-[10px] space-y-0.5 border border-slate-300 p-1.5 rounded">
                      <p>☑ Asli &nbsp; ☐ Kedua</p>
                      <p>☐ Ketiga &nbsp; ☐ Keempat</p>
                    </div>
                  </div>

                  <div className="text-center py-2">
                    <h3 className="font-bold text-sm tracking-wide border-b border-slate-900 pb-1 inline-block uppercase">
                      TANDA PENERIMAAN
                    </h3>
                  </div>

                  <div className="space-y-1.5">
                    <p><span className="w-32 inline-block font-semibold">Terima dari</span>: Bendahara {school.namaSekolah}</p>
                    <p><span className="w-32 inline-block font-semibold">Banyaknya</span>: <strong className="italic">{terbilangRupiah(selectedTx.nominal)}</strong></p>
                    <p className="leading-relaxed"><span className="w-32 inline-block font-semibold align-top">Yaitu untuk</span>: <span className="inline-block max-w-md">{selectedTx.uraian}</span></p>
                  </div>

                  <div className="p-2 border-2 border-slate-900 inline-block font-bold text-sm my-2">
                    Terbilang : {formatRupiah(selectedTx.nominal)}
                  </div>

                  {/* 4 Signatures Grid in Kuitansi */}
                  <div className="grid grid-cols-2 gap-6 pt-4 text-left">
                    {/* Kepala Sekolah */}
                    <div>
                      <p>Setuju dibayar,</p>
                      <p>Kepala {school.namaSekolah}</p>
                      <div className="h-18 flex items-center relative my-1">
                        {options.useElectronicSignature && (
                          <>
                            {options.includeStempel && school.stempelSekolah && (
                              <img src={school.stempelSekolah} alt="Stempel Sekolah" className="absolute -left-2 top-0 h-16 w-16 object-contain pointer-events-none opacity-85" />
                            )}
                            {school.ttdKepalaSekolah ? (
                              <img src={school.ttdKepalaSekolah} alt="TTE Kepala Sekolah" className="max-h-14 max-w-[160px] object-contain relative z-10" />
                            ) : (
                              <div className="text-[10px] text-slate-300 italic">Tanda Tangan Basah</div>
                            )}
                          </>
                        )}
                        {!options.useElectronicSignature && (
                          <div className="text-[10px] text-slate-300 italic">Tanda Tangan Basah</div>
                        )}
                      </div>
                      <p className="font-bold underline">{school.namaKepalaSekolah}</p>
                      <p className="text-[10px]">NIP. {school.nipKepalaSekolah}</p>
                    </div>

                    {/* Rekanan */}
                    <div>
                      <p>{vendorAddress}, {formatTanggalIndo(selectedTx.tanggal)}</p>
                      <p>Yang Menerima,</p>
                      <p className="text-[10px] text-slate-500">Pekerjaan: {vendorStore}</p>
                      <div className="h-16 flex items-center relative my-1">
                        {options.useElectronicSignature && (
                          <>
                            {options.includeStempel && vendorStamp && (
                              <img src={vendorStamp} alt="Stempel Rekanan" className="absolute -left-2 top-0 h-14 w-14 object-contain pointer-events-none opacity-85" />
                            )}
                            {vendorSignature ? (
                              <img src={vendorSignature} alt="TTE Rekanan" className="max-h-13 max-w-[160px] object-contain relative z-10" />
                            ) : (
                              <div className="text-[10px] text-slate-300 italic">Tanda Tangan Basah</div>
                            )}
                          </>
                        )}
                        {!options.useElectronicSignature && (
                          <div className="text-[10px] text-slate-300 italic">Tanda Tangan Basah</div>
                        )}
                      </div>
                      <p className="font-bold underline uppercase">{vendorName}</p>
                    </div>

                    {/* Pengurus Barang */}
                    <div className="pt-2">
                      <p className="text-[10px]">Barang pekerjaan dimaksud telah diterima:</p>
                      <p className="font-semibold">Pengurus Barang</p>
                      <div className="h-16 flex items-center relative my-1">
                        {options.useElectronicSignature && school.ttdPengurusBarang ? (
                          <img src={school.ttdPengurusBarang} alt="TTE Pengurus Barang" className="max-h-13 max-w-[160px] object-contain" />
                        ) : (
                          <div className="text-[10px] text-slate-300 italic">Tanda Tangan Basah</div>
                        )}
                      </div>
                      <p className="font-bold underline">{school.namaPengurusBarang}</p>
                      <p className="text-[10px]">NIP. {school.nipPengurusBarang}</p>
                    </div>

                    {/* Bendahara */}
                    <div className="pt-2">
                      <p className="text-[10px]">Lunas dibayar, {formatTanggalIndo(selectedTx.tanggal)}</p>
                      <p className="font-semibold">Bendaharawan</p>
                      <div className="h-16 flex items-center relative my-1">
                        {options.useElectronicSignature && school.ttdBendahara ? (
                          <img src={school.ttdBendahara} alt="TTE Bendahara" className="max-h-13 max-w-[160px] object-contain" />
                        ) : (
                          <div className="text-[10px] text-slate-300 italic">Tanda Tangan Basah</div>
                        )}
                      </div>
                      <p className="font-bold underline">{school.namaBendahara}</p>
                      <p className="text-[10px]">NIP. {school.nipBendahara}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: LAMPIRAN FOTO FISIK BARANG */}
              {activeTabPreview === 'foto' && (
                <div className="space-y-4">
                  <div className="text-center pb-2 border-b border-slate-900">
                    <p className="font-bold text-xs uppercase">LAMPIRAN DOKUMENTASI FISIK BELANJA BARANG / JASA</p>
                    <p className="text-[10px] text-slate-600">SUMBER DANA : {selectedTx.sumberDana.toUpperCase()} - {school.namaSekolah.toUpperCase()}</p>
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>No. Bukti: {selectedTx.nomorBukti}</span>
                    <span>Tanggal: {formatTanggalIndo(selectedTx.tanggal)}</span>
                    <span className="font-bold">Total: {formatRupiah(selectedTx.nominal)}</span>
                  </div>

                  {selectedTx.fotoBarang && selectedTx.fotoBarang.length > 0 ? (
                    <div className="space-y-4 pt-2">
                      {selectedTx.fotoBarang.map((foto, fIdx) => (
                        <div key={foto.id} className="border border-slate-400 p-3 rounded flex gap-4 items-center">
                          <img
                            src={foto.dataUrl}
                            alt="Foto Barang"
                            className="w-48 h-36 object-cover rounded border border-slate-300"
                          />
                          <div className="space-y-1 text-xs">
                            <p className="font-bold">Foto Dokumentasi #{fIdx + 1}</p>
                            <p className="text-slate-500 font-mono text-[10px]">{foto.namaFile}</p>
                            <p className="text-slate-700 italic">"{foto.keterangan || 'Kondisi barang baik dan lengkap sesuai pesanan.'}"</p>
                            <p className="text-slate-400 text-[9px]">Diunggah: {foto.diunggahPada}</p>
                            <p className="font-semibold pt-2 text-[10px]">Verifikasi: Pengurus Barang {school.namaSekolah}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-400 italic">
                      Belum ada foto fisik barang yang diunggah untuk transaksi ini. Buka tab "Belanja & Foto Barang" untuk mengunggah foto atau jepret dari kamera.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Signature Pad Modal */}
      {sigModal && (
        <SignaturePadModal
          isOpen={sigModal.isOpen}
          title={sigModal.title}
          roleName={sigModal.roleName}
          signatoryName={sigModal.signatoryName}
          nip={sigModal.nip}
          existingSignature={sigModal.existingSignature}
          onClose={() => setSigModal(null)}
          onSave={handleSaveSignature}
        />
      )}
    </div>
  );
};
