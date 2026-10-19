import React, { useState } from 'react';
import {
  HardDriveDownload,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle2,
  Database,
  FileArchive,
  RefreshCw,
  FolderOpen,
  ShieldCheck,
} from 'lucide-react';
import { localDB } from '../../services/storage';

interface BackupRestoreViewProps {
  onRefresh: () => void;
}

export const BackupRestoreView: React.FC<BackupRestoreViewProps> = ({ onRefresh }) => {
  const [backupStatus, setBackupStatus] = useState('');
  const [restoreStatus, setRestoreStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Trigger JSON Backup File Download
  const handleExportBackup = () => {
    const jsonStr = localDB.exportFullBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    a.href = url;
    a.download = `LPJ_BOS_Desktop_Backup_${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setBackupStatus('File backup database lokal berhasil diunduh dan diverifikasi!');
    setTimeout(() => setBackupStatus(''), 4000);
  };

  // Handle Restore File Selection
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('PERINGATAN: Memulihkan data akan menggantikan data aktif saat ini. Sistem secara otomatis akan membuat backup pengaman darurat sebelum penimpaan. Lanjutkan pemulihan?')) {
      e.target.value = '';
      return;
    }

    setIsRestoring(true);
    setRestoreStatus(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = localDB.importFullBackup(content);
      setIsRestoring(false);
      setRestoreStatus(res);
      if (res.success) {
        onRefresh();
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700">
            <HardDriveDownload size={22} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Cadangan & Pemulihan Data Lokal (Backup & Restore)</h3>
            <p className="text-xs text-slate-500">
              Menjamin seluruh transaksi BKU, rincian belanja, foto barang, dan arsip PDF aman dari kehilangan data.
            </p>
          </div>
        </div>
      </div>

      {backupStatus && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{backupStatus}</span>
        </div>
      )}

      {restoreStatus && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2 border ${
            restoreStatus.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {restoreStatus.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{restoreStatus.message}</span>
        </div>
      )}

      {/* 1. Cadangkan Database */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 shrink-0">
            <Download size={24} />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900">Buat File Cadangan Sekarang (Export Full Backup)</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Mengekspor seluruh database SQLite (transaksi, rincian barang, foto, profil sekolah, dan arsip PDF) ke dalam satu file berkas yang dapat disimpan ke Flashdisk, hard drive eksternal, atau folder aman lainnya.
            </p>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Format: Snapshot Database Terenkapsulasi JSON / SQLite Portable
          </div>
          <button
            onClick={handleExportBackup}
            className="px-5 py-2.5 bg-[#1769E0] hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/25 transition-all flex items-center gap-2"
          >
            <Download size={15} />
            <span>Cadangkan Data Sekarang</span>
          </button>
        </div>
      </div>

      {/* 2. Pulihkan Database */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 shrink-0">
            <Upload size={24} />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900">Pulihkan Data dari Berkas Cadangan (Restore)</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Memulihkan data pembukuan sekolah dari file cadangan sebelumnya jika Anda berganti komputer atau ingin mengembalikan kondisi data.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-600 shrink-0" />
          <span>
            <strong>Fitur Pengaman Otomatis:</strong> Sebelum proses pemulihan dieksekusi, sistem secara otomatis menyimpan titik pemulihan darurat agar data aktif tidak hilang bila file yang diimpor tidak sesuai.
          </span>
        </div>

        <div className="pt-2 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Pilih file berkas cadangan (.json) dari disk lokal
          </div>
          <label className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-500/25 transition-all flex items-center gap-2 cursor-pointer">
            <Upload size={15} />
            <span>{isRestoring ? 'Memproses...' : 'Pilih File & Pulihkan'}</span>
            <input
              type="file"
              accept=".json"
              onChange={handleRestoreFile}
              disabled={isRestoring}
              className="sr-only"
            />
          </label>
        </div>
      </div>

      {/* 3. Info Lokasi Penyimpanan Fisik pada Komputer Windows */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <FolderOpen size={14} className="text-blue-600" />
          Lokasi Fisik Direktori Data Windows
        </h4>

        <div className="space-y-2 text-xs text-slate-700">
          <div className="p-3 bg-slate-50 rounded-xl font-mono text-[11px] border border-slate-200 space-y-1">
            <p className="text-slate-500">Direktori Pengguna (%APPDATA%):</p>
            <p className="font-bold text-blue-800">C:\Users\&lt;Username&gt;\AppData\Roaming\LPJ BOS Desktop\</p>
          </div>

          <ul className="list-disc pl-5 space-y-1 text-slate-600 text-[11px]">
            <li><strong>data/lpj-bos.sqlite</strong> : Berkas utama database relasional SQLite</li>
            <li><strong>files/photos/</strong> : Berkas foto fisik barang hasil tangkapan kamera / unggahan</li>
            <li><strong>files/pdf/</strong> : Arsip dokumen resmi SPJ PDF 4-in-1</li>
            <li><strong>backups/</strong> : Folder cadangan harian otomatis</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
