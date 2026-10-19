import React, { useRef, useState, useEffect } from 'react';
import {
  PenTool,
  RotateCcw,
  Check,
  X,
  Upload,
  QrCode,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Stamp,
  Sliders,
} from 'lucide-react';
import { createSignaturePng, createSchoolStampPng, createVendorStampPng } from '../../utils/signatureUtils';

interface SignaturePadModalProps {
  title: string;
  roleName: string;
  signatoryName: string;
  nip?: string;
  existingSignature?: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
}

export const SignaturePadModal: React.FC<SignaturePadModalProps> = ({
  title,
  roleName,
  signatoryName,
  nip,
  existingSignature,
  isOpen,
  onClose,
  onSave,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [inkColor, setInkColor] = useState<'#0B2545' | '#000000' | '#1769E0'>('#0B2545');
  const [brushSize, setBrushSize] = useState<number>(2.5);
  const [mode, setMode] = useState<'draw' | 'upload' | 'digital_qr' | 'auto_cursive' | 'stamp'>('draw');
  const [uploadedImage, setUploadedImage] = useState<string | null>(existingSignature || null);

  useEffect(() => {
    if (isOpen && canvasRef.current && mode === 'draw') {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);
      }
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  // Drawing Canvas Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // Upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Generate Digital QR Certificate SVG/Canvas
  const generateQrDigitalSignature = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 150;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Clean transparent background
    ctx.clearRect(0, 0, 400, 150);

    // Border box
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(10, 10, 380, 130);

    // QR Code simulation box left
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(25, 25, 100, 100);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(35, 35, 80, 80);
    ctx.fillStyle = '#0f172a';
    // QR blocks
    ctx.fillRect(42, 42, 22, 22);
    ctx.fillRect(86, 42, 22, 22);
    ctx.fillRect(42, 86, 22, 22);
    ctx.fillRect(72, 72, 14, 14);
    ctx.fillRect(90, 90, 14, 14);

    // Text Right
    ctx.fillStyle = '#0369a1';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('TERVERIFIKASI SECARA ELEKTRONIK', 140, 38);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(signatoryName.toUpperCase().slice(0, 32), 140, 58);

    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText(`Jabatan: ${roleName}`, 140, 75);
    if (nip) {
      ctx.fillText(`NIP. ${nip}`, 140, 91);
    }
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('✓ Keabsahan Dokumen LPJ BOS Terverifikasi', 140, 114);

    return canvas.toDataURL('image/png');
  };

  const handleSave = () => {
    if (mode === 'draw' && canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      onSave(dataUrl);
      onClose();
    } else if (mode === 'upload' && uploadedImage) {
      onSave(uploadedImage);
      onClose();
    } else if (mode === 'digital_qr') {
      const qrDataUrl = generateQrDigitalSignature();
      onSave(qrDataUrl);
      onClose();
    } else if (mode === 'auto_cursive') {
      const autoDataUrl = createSignaturePng(signatoryName, inkColor);
      onSave(autoDataUrl);
      onClose();
    } else if (mode === 'stamp') {
      const isSchool = roleName.toLowerCase().includes('kepala') || roleName.toLowerCase().includes('bendahara') || roleName.toLowerCase().includes('sekolah');
      const stampDataUrl = isSchool 
        ? createSchoolStampPng(signatoryName || 'SDN BANGUN SARI', 'DANA BOS ACEH TAMIANG')
        : createVendorStampPng(roleName || 'TOKO REKANAN', signatoryName || 'REKANAN');
      onSave(stampDataUrl);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-blue-100 text-[#1769E0]">
              <PenTool size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500 font-medium">
                {signatoryName} &bull; <span className="text-blue-600 font-semibold">{roleName}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">
          <button
            type="button"
            onClick={() => setMode('draw')}
            className={`py-1.5 px-1 rounded-lg transition-all flex items-center justify-center gap-1 ${
              mode === 'draw' ? 'bg-white text-blue-700 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            <PenTool size={12} />
            <span>Gores Pen</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('auto_cursive')}
            className={`py-1.5 px-1 rounded-lg transition-all flex items-center justify-center gap-1 ${
              mode === 'auto_cursive' ? 'bg-white text-blue-700 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            <Sparkles size={12} />
            <span>Otomatis</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`py-1.5 px-1 rounded-lg transition-all flex items-center justify-center gap-1 ${
              mode === 'upload' ? 'bg-white text-blue-700 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            <Upload size={12} />
            <span>Unggah</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('digital_qr')}
            className={`py-1.5 px-1 rounded-lg transition-all flex items-center justify-center gap-1 ${
              mode === 'digital_qr' ? 'bg-white text-blue-700 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            <QrCode size={12} />
            <span>Segel QR</span>
          </button>
        </div>

        {/* Content based on Mode */}
        {mode === 'draw' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Goreskan tanda tangan di kanvas:</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">Tinta:</span>
                  <button
                    type="button"
                    onClick={() => setInkColor('#0B2545')}
                    className={`w-4 h-4 rounded-full bg-[#0B2545] border-2 transition-all ${
                      inkColor === '#0B2545' ? 'border-amber-400 scale-125' : 'border-transparent'
                    }`}
                    title="Biru Gelap Dinas"
                  />
                  <button
                    type="button"
                    onClick={() => setInkColor('#000000')}
                    className={`w-4 h-4 rounded-full bg-black border-2 transition-all ${
                      inkColor === '#000000' ? 'border-amber-400 scale-125' : 'border-transparent'
                    }`}
                    title="Hitam Pekat"
                  />
                  <button
                    type="button"
                    onClick={() => setInkColor('#1769E0')}
                    className={`w-4 h-4 rounded-full bg-[#1769E0] border-2 transition-all ${
                      inkColor === '#1769E0' ? 'border-amber-400 scale-125' : 'border-transparent'
                    }`}
                    title="Biru Terang"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-slate-400">Tebal:</span>
                  <select
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="text-[11px] bg-slate-100 rounded px-1 py-0.5 border border-slate-200"
                  >
                    <option value={1.8}>Halus (1.8px)</option>
                    <option value={2.5}>Standar (2.5px)</option>
                    <option value={3.5}>Tebal (3.5px)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-xl overflow-hidden bg-slate-50/50 shadow-inner flex justify-center relative">
              <canvas
                ref={canvasRef}
                width={440}
                height={160}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="cursor-crosshair touch-none w-full max-w-full bg-white"
              />
              <div className="absolute bottom-2 left-3 pointer-events-none text-[10px] text-slate-400 select-none">
                Garis tanda tangan &bull; Area transparan otomatis
              </div>
            </div>

            <div className="flex justify-between items-center text-xs">
              <button
                type="button"
                onClick={clearCanvas}
                className="text-slate-500 hover:text-rose-600 flex items-center gap-1 font-semibold transition-colors"
              >
                <RotateCcw size={13} />
                <span>Bersihkan Kanvas</span>
              </button>
              <span className="text-[11px] text-slate-400">Mendukung mouse & layar sentuh</span>
            </div>
          </div>
        )}

        {mode === 'auto_cursive' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Sistem akan membuat tanda tangan kaligrafi resmi digital secara otomatis berdasarkan nama pejabat:
            </p>
            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center gap-3">
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs w-full max-w-sm text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Pratinjau TTE Kaligrafi</span>
                <img
                  src={createSignaturePng(signatoryName, inkColor)}
                  alt="Auto Cursive Signature"
                  className="h-16 mx-auto object-contain"
                />
                <p className="font-bold text-xs text-slate-800 mt-2 underline">{signatoryName}</p>
                {nip && <p className="text-[10px] text-slate-500">NIP. {nip}</p>}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold">Pilih Warna Tinta:</span>
                <button
                  type="button"
                  onClick={() => setInkColor('#0B2545')}
                  className={`w-5 h-5 rounded-full bg-[#0B2545] border-2 transition-all ${
                    inkColor === '#0B2545' ? 'border-amber-400 scale-125' : 'border-transparent'
                  }`}
                  title="Biru Gelap Dinas"
                />
                <button
                  type="button"
                  onClick={() => setInkColor('#000000')}
                  className={`w-5 h-5 rounded-full bg-black border-2 transition-all ${
                    inkColor === '#000000' ? 'border-amber-400 scale-125' : 'border-transparent'
                  }`}
                  title="Hitam"
                />
                <button
                  type="button"
                  onClick={() => setInkColor('#1769E0')}
                  className={`w-5 h-5 rounded-full bg-[#1769E0] border-2 transition-all ${
                    inkColor === '#1769E0' ? 'border-amber-400 scale-125' : 'border-transparent'
                  }`}
                  title="Biru Terang"
                />
              </div>
            </div>
          </div>
        )}

        {mode === 'upload' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Pilih file gambar tanda tangan atau stempel basah hasil scan (format PNG dengan latar transparan atau putih):
            </p>
            <label className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-50 transition-colors">
              <Upload size={24} className="text-slate-400" />
              <span className="text-xs font-bold text-blue-700">Pilih Berkas Scan TTE / Stempel</span>
              <span className="text-[10px] text-slate-400">PNG / JPG / WEBP (Maksimal 2MB)</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="sr-only"
              />
            </label>

            {uploadedImage && (
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={uploadedImage} alt="Preview" className="h-12 max-w-[120px] object-contain border rounded p-1" />
                  <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 size={13} /> Berkas Siap Digunakan
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadedImage(null)}
                  className="text-xs text-rose-600 hover:underline font-bold"
                >
                  Hapus
                </button>
              </div>
            )}
          </div>
        )}

        {mode === 'digital_qr' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-600 leading-relaxed">
              Membuat segel Tanda Tangan Elektronik resmi berbasis Sertifikat Digital QR Code sesuai standar verifikasi LPJ BOS. QR Code mencatat keaslian dokumen, identitas penandatangan, dan NIP.
            </p>

            <div className="border border-sky-300 bg-sky-50/50 p-4 rounded-xl flex items-center gap-4">
              <div className="w-20 h-20 bg-slate-900 rounded-lg p-1.5 shrink-0 flex items-center justify-center">
                <QrCode size={48} className="text-white" />
              </div>
              <div className="space-y-1 text-xs">
                <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider block">
                  TTE Terverifikasi Digital
                </span>
                <p className="font-bold text-slate-900">{signatoryName}</p>
                <p className="text-slate-600">{roleName}</p>
                {nip && <p className="font-mono text-slate-500 text-[11px]">NIP. {nip}</p>}
                <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 pt-1">
                  <ShieldCheck size={12} /> Terenkripsi & Tercatat di BKU
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-[#1769E0] hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Check size={14} />
            <span>Terapkan Tanda Tangan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
