import React, { useState, useRef, useEffect } from 'react';
import {
  ShoppingBag,
  Plus,
  Trash2,
  Copy,
  Camera,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  X,
  Eye,
  RefreshCw,
  Printer,
} from 'lucide-react';
import { BkuTransaction, BelanjaItem, FotoBarang, SchoolProfile } from '../../types';
import { formatRupiah, formatTanggalIndo } from '../../utils/formatters';
import { localDB } from '../../services/storage';

interface BelanjaViewProps {
  transactions: BkuTransaction[];
  school: SchoolProfile;
  selectedTxId?: string;
  onRefresh: () => void;
  onOpenSpj: (tx: BkuTransaction) => void;
}

export const BelanjaView: React.FC<BelanjaViewProps> = ({
  transactions,
  school,
  selectedTxId,
  onRefresh,
  onOpenSpj,
}) => {
  const expenseTxs = transactions.filter((t) => t.jenis === 'pengeluaran' && t.status !== 'dibatalkan');
  const [activeTxId, setActiveTxId] = useState<string>(
    selectedTxId || (expenseTxs.length > 0 ? expenseTxs[0].id : '')
  );

  const activeTx = expenseTxs.find((t) => t.id === activeTxId);

  // Local state for items of activeTx
  const [items, setItems] = useState<BelanjaItem[]>([]);
  const [photos, setPhotos] = useState<FotoBarang[]>([]);

  // Camera capture states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Image preview modal
  const [previewPhoto, setPreviewPhoto] = useState<FotoBarang | null>(null);
  const [photoCaption, setPhotoCaption] = useState('');

  // Status message
  const [saveStatus, setSaveStatus] = useState<string>('');

  useEffect(() => {
    if (activeTx) {
      setItems(
        activeTx.items && activeTx.items.length > 0
          ? JSON.parse(JSON.stringify(activeTx.items))
          : [
              {
                id: 'it-' + Date.now(),
                transaksiId: activeTx.id,
                namaBarang: activeTx.uraian,
                banyaknya: 1,
                satuan: 'Paket',
                hargaSatuan: activeTx.nominal,
                jumlahHarga: activeTx.nominal,
              },
            ]
      );
      setPhotos(activeTx.fotoBarang ? JSON.parse(JSON.stringify(activeTx.fotoBarang)) : []);
    } else {
      setItems([]);
      setPhotos([]);
    }
  }, [activeTxId]);

  // Total items calculation
  const totalRincian = items.reduce((acc, item) => acc + (item.jumlahHarga || 0), 0);
  const diffNominal = (activeTx?.nominal || 0) - totalRincian;

  // Add Item Row
  const handleAddItem = () => {
    if (!activeTx) return;
    const newItem: BelanjaItem = {
      id: 'it-' + Date.now() + Math.random(),
      transaksiId: activeTx.id,
      namaBarang: '',
      banyaknya: 1,
      satuan: 'Pcs',
      hargaSatuan: 0,
      jumlahHarga: 0,
    };
    setItems([...items, newItem]);
  };

  // Duplicate Item Row
  const handleDuplicateItem = (item: BelanjaItem) => {
    if (!activeTx) return;
    const dup: BelanjaItem = {
      ...item,
      id: 'it-' + Date.now() + Math.random(),
    };
    setItems([...items, dup]);
  };

  // Remove Item Row
  const handleRemoveItem = (id: string) => {
    setItems(items.filter((it) => it.id !== id));
  };

  // Change Item Fields
  const handleItemChange = (id: string, field: keyof BelanjaItem, val: any) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: val };
        if (field === 'banyaknya' || field === 'hargaSatuan') {
          const qty = field === 'banyaknya' ? Number(val) : it.banyaknya;
          const price = field === 'hargaSatuan' ? Number(val) : it.hargaSatuan;
          updated.jumlahHarga = (qty || 0) * (price || 0);
        }
        return updated;
      })
    );
  };

  // Save Belanja and Photos to Transaction
  const handleSaveBelanja = () => {
    if (!activeTx) return;
    const updatedTx: BkuTransaction = {
      ...activeTx,
      items,
      fotoBarang: photos,
      diperbaruiPada: new Date().toISOString(),
    };

    const res = localDB.saveTransaction(updatedTx);
    if (res.success) {
      setSaveStatus('Rincian belanja & foto barang berhasil disimpan ke SQLite!');
      onRefresh();
      setTimeout(() => setSaveStatus(''), 2500);
    }
  };

  // Handle Photo File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeTx) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const newPhoto: FotoBarang = {
          id: 'foto-' + Date.now() + Math.random(),
          transaksiId: activeTx.id,
          namaFile: file.name,
          dataUrl,
          keterangan: `Dokumentasi fisik: ${file.name.replace(/\.[^/.]+$/, '')}`,
          diunggahPada: new Date().toLocaleString('id-ID'),
          ukuranBytes: file.size,
        };
        setPhotos((prev) => [...prev, newPhoto]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle Webcam Start
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert('Kamera tidak dapat diakses atau izin ditolak. Anda dapat mengunggah file foto dari disk komputer.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !activeTx) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const newPhoto: FotoBarang = {
        id: 'foto-cam-' + Date.now(),
        transaksiId: activeTx.id,
        namaFile: `Kamera_${Date.now()}.jpg`,
        dataUrl,
        keterangan: 'Foto fisik diambil langsung via kamera komputer',
        diunggahPada: new Date().toLocaleString('id-ID'),
        ukuranBytes: Math.round(dataUrl.length * 0.75),
      };
      setPhotos((prev) => [...prev, newPhoto]);
      stopCamera();
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Transaction Selector Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700">
            <ShoppingBag size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Rincian Belanja & Dokumentasi Foto Barang</h3>
            <p className="text-xs text-slate-500">
              Setiap transaksi pengeluaran BKU dapat dirinci per item barang dan dilampiri foto fisik barang.
            </p>
          </div>
        </div>

        {/* Dropdown Transaksi Belanja */}
        <div className="w-full md:w-auto flex items-center gap-2">
          <label className="text-xs font-bold text-slate-600 shrink-0">Pilih Transaksi:</label>
          <select
            value={activeTxId}
            onChange={(e) => setActiveTxId(e.target.value)}
            className="w-full md:w-80 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {expenseTxs.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nomorBukti} - {formatRupiah(t.nominal)} ({t.uraian.substring(0, 30)}...)
              </option>
            ))}
          </select>
        </div>
      </div>

      {activeTx ? (
        <div className="space-y-6">
          {/* 2. Metadata Transaksi Aktif */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Nomor Bukti BKU</span>
                <p className="font-mono font-bold text-blue-700 text-sm">{activeTx.nomorBukti}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Tanggal Transaksi</span>
                <p className="font-semibold text-slate-800">{formatTanggalIndo(activeTx.tanggal)}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Pemasok / Toko</span>
                <p className="font-semibold text-slate-800">{activeTx.pihakTerkait}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Nilai Transaksi BKU</span>
                <p className="font-mono font-bold text-slate-900 text-sm">{formatRupiah(activeTx.nominal)}</p>
              </div>
            </div>

            {diffNominal !== 0 && (
              <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={15} className="shrink-0 text-amber-600" />
                  <span>
                    Total rincian barang (<strong>{formatRupiah(totalRincian)}</strong>) belum sama dengan nilai transaksi BKU (<strong>{formatRupiah(activeTx.nominal)}</strong>).
                  </span>
                </div>
                <span className="font-mono font-bold text-amber-900">
                  Selisih: {formatRupiah(diffNominal)}
                </span>
              </div>
            )}
          </div>

          {/* 3. Tabel Rincian Barang */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-slate-800">Daftar Rincian Barang / Jasa</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                  {items.length} Baris
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Plus size={14} />
                  <span>Tambah Baris Barang</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3 w-12 text-center">No</th>
                    <th className="py-2.5 px-3 text-center">Nama Barang / Jasa</th>
                    <th className="py-2.5 px-3 w-24 text-center">Jumlah</th>
                    <th className="py-2.5 px-3 w-28 text-center">Satuan</th>
                    <th className="py-2.5 px-3 w-36 text-center">Harga Satuan (Rp)</th>
                    <th className="py-2.5 px-3 w-36 text-center">Total Harga (Rp)</th>
                    <th className="py-2.5 px-3 w-24 text-center">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 text-center font-bold text-slate-400">{index + 1}</td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          placeholder="Nama barang..."
                          value={item.namaBarang}
                          onChange={(e) => handleItemChange(item.id, 'namaBarang', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="number"
                          min="1"
                          value={item.banyaknya}
                          onChange={(e) => handleItemChange(item.id, 'banyaknya', e.target.value)}
                          className="w-full text-center px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="text"
                          placeholder="Bungkus, Kotak, Rim..."
                          value={item.satuan}
                          onChange={(e) => handleItemChange(item.id, 'satuan', e.target.value)}
                          className="w-full text-center px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          value={item.hargaSatuan}
                          onChange={(e) => handleItemChange(item.id, 'hargaSatuan', e.target.value)}
                          className="w-full text-right px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(item.jumlahHarga)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDuplicateItem(item)}
                            className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100"
                            title="Duplikasi Baris"
                          >
                            <Copy size={13} />
                          </button>
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              title="Hapus Baris"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold">
                    <td colSpan={5} className="py-3 px-3 text-right text-slate-700">
                      Total Rincian Barang:
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-sm text-blue-900">
                      {formatRupiah(totalRincian)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* 4. Dokumentasi Foto Barang (Upload & Webcam) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Camera size={16} className="text-purple-600" />
                  Dokumentasi Foto Fisik Barang Belanja
                </h4>
                <p className="text-xs text-slate-500">
                  Foto fisik barang tersimpan di folder lokal (%APPDATA%\files\photos) dan dilampirkan dalam PDF SPJ.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Upload File Input */}
                <label className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-colors">
                  <Upload size={14} />
                  <span>Pilih Foto dari Disk</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="sr-only"
                  />
                </label>

                {/* Webcam Button */}
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3.5 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Camera size={14} />
                  <span>Ambil via Kamera</span>
                </button>
              </div>
            </div>

            {/* Live Camera View if active */}
            {isCameraActive && (
              <div className="p-4 bg-slate-900 rounded-2xl text-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Kamera Aktif — Arahkan ke Barang Belanja
                  </span>
                  <button
                    onClick={stopCamera}
                    className="p-1 rounded text-slate-400 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full max-h-72 rounded-xl bg-black object-contain mx-auto"
                ></video>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={capturePhoto}
                    className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2"
                  >
                    <Camera size={15} />
                    <span>Jepret Foto Barang</span>
                  </button>
                  <button
                    onClick={stopCamera}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs rounded-xl"
                  >
                    Tutup Kamera
                  </button>
                </div>
              </div>
            )}

            {/* Photo Gallery Grid */}
            {photos.length === 0 ? (
              <div className="py-8 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2">
                <ImageIcon size={32} className="mx-auto text-slate-300" />
                <p className="text-xs text-slate-500">Belum ada foto fisik barang untuk transaksi ini.</p>
                <p className="text-[11px] text-slate-400">
                  Unggah file foto dari folder komputer atau gunakan kamera laptop Anda.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {photos.map((photo, pIdx) => (
                  <div
                    key={photo.id}
                    className="group relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 shadow-xs hover:shadow-md transition-shadow"
                  >
                    <div className="h-40 w-full overflow-hidden bg-slate-200 flex items-center justify-center">
                      <img
                        src={photo.dataUrl}
                        alt={photo.namaFile}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-3 text-xs space-y-1">
                      <p className="font-bold text-slate-800 truncate" title={photo.namaFile}>
                        {photo.namaFile}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">{photo.keterangan}</p>
                      <p className="text-[9px] text-slate-400">{photo.diunggahPada}</p>
                    </div>

                    {/* Action overlay */}
                    <div className="absolute top-2 right-2 flex gap-1 bg-black/60 backdrop-blur-xs p-1 rounded-lg">
                      <button
                        onClick={() => {
                          setPreviewPhoto(photo);
                          setPhotoCaption(photo.keterangan);
                        }}
                        className="p-1 text-white hover:text-blue-300"
                        title="Lihat / Perbesar"
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        onClick={() => setPhotos(photos.filter((p) => p.id !== photo.id))}
                        className="p-1 text-white hover:text-rose-300"
                        title="Hapus Foto"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. Footer Buttons: Simpan & Buat SPJ */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              {saveStatus && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  <CheckCircle2 size={14} />
                  {saveStatus}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveBelanja}
                className="px-5 py-2.5 bg-[#1769E0] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2"
              >
                <span>Simpan Perubahan Rincian & Foto</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleSaveBelanja();
                  onOpenSpj(activeTx);
                }}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2"
              >
                <Printer size={15} />
                <span>Buat SPJ PDF Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
          Belum ada transaksi pengeluaran. Tambahkan transaksi pengeluaran terlebih dahulu di modul BKU.
        </div>
      )}

      {/* Modal Preview Foto */}
      {previewPhoto && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">{previewPhoto.namaFile}</span>
              <button
                onClick={() => setPreviewPhoto(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 bg-slate-900 flex items-center justify-center max-h-96">
              <img
                src={previewPhoto.dataUrl}
                alt="Preview"
                className="max-h-80 object-contain rounded-lg"
              />
            </div>
            <div className="p-4 space-y-3">
              <label className="text-xs font-bold text-slate-700 block">Keterangan / Deskripsi Foto</label>
              <input
                type="text"
                value={photoCaption}
                onChange={(e) => setPhotoCaption(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setPhotos(
                      photos.map((p) => (p.id === previewPhoto.id ? { ...p, keterangan: photoCaption } : p))
                    );
                    setPreviewPhoto(null);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                >
                  Simpan Keterangan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
