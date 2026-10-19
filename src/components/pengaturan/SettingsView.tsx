import React, { useState } from 'react';
import {
  Settings,
  HardDrive,
  Cpu,
  Terminal,
  FolderOpen,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Copy,
  ExternalLink,
  ShieldCheck,
  FileCode,
  Package,
} from 'lucide-react';
import { localDB } from '../../services/storage';

interface SettingsViewProps {
  onResetData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onResetData }) => {
  const [copiedCmd, setCopiedCmd] = useState('');

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(label);
    setTimeout(() => setCopiedCmd(''), 2000);
  };

  const handleReset = () => {
    if (confirm('Apakah Anda yakin ingin mengatur ulang data ke contoh awal? Semua transaksi saat ini akan disetel ulang.')) {
      localDB.resetToDefault();
      onResetData();
      alert('Database berhasil disetel ulang ke kondisi awal.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-[#1769E0]">
            <Settings size={22} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Pengaturan Sistem & Panduan Pembuatan File Installer Windows (.EXE)
            </h3>
            <p className="text-xs text-slate-500">
              Arsitektur desktop offline mandiri menggunakan Electron, React, TypeScript, dan SQLite lokal.
            </p>
          </div>
        </div>
      </div>

      {/* 1. Panduan Pemula: Membuka Proyek & Build .EXE di Windows */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Package size={18} className="text-blue-600" />
          <h4 className="text-sm font-bold text-slate-900">
            Panduan Menghasilkan Installer Windows (LPJ-BOS-Desktop.exe)
          </h4>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Seluruh berkas proyek (termasuk skrip Electron <code>electron/main.cjs</code>, <code>electron/preload.cjs</code>, dan konfigurasi <code>electron-builder.json</code>) telah siap di dalam repositori ini. Anda dapat mengemasnya menjadi installer <strong>.EXE</strong> untuk komputer Windows dengan langkah mudah berikut:
        </p>

        {/* Step-by-step commands */}
        <div className="space-y-3 pt-2">
          {/* Step 1 */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Langkah 1: Buka Proyek di Visual Studio Code (Windows)
              </span>
              <button
                onClick={() => copyToClipboard('code .', 'cmd1')}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Copy size={12} />
                {copiedCmd === 'cmd1' ? 'Tersalin!' : 'Salin Perintah'}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Pastikan <strong>Node.js</strong> (versi LTS v18 atau v20+) telah terpasang di komputer Windows Anda, lalu buka terminal di folder proyek ini:
            </p>
            <div className="bg-slate-900 text-emerald-400 font-mono text-xs p-2.5 rounded-lg">
              code .
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Langkah 2: Pasang Kebutuhan Paket (Dependencies)
              </span>
              <button
                onClick={() => copyToClipboard('npm install', 'cmd2')}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Copy size={12} />
                {copiedCmd === 'cmd2' ? 'Tersalin!' : 'Salin Perintah'}
              </button>
            </div>
            <div className="bg-slate-900 text-emerald-400 font-mono text-xs p-2.5 rounded-lg">
              npm install
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Langkah 3: Jalankan Mode Desktop Development
              </span>
              <button
                onClick={() => copyToClipboard('npm run electron:dev', 'cmd3')}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Copy size={12} />
                {copiedCmd === 'cmd3' ? 'Tersalin!' : 'Salin Perintah'}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Perintah ini akan membuka jendela aplikasi desktop Electron di Windows secara langsung.
            </p>
            <div className="bg-slate-900 text-emerald-400 font-mono text-xs p-2.5 rounded-lg">
              npm run electron:dev
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Langkah 4: Kompilasi Installer Windows (.EXE)
              </span>
              <button
                onClick={() => copyToClipboard('npm run dist:win', 'cmd4')}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <Copy size={12} />
                {copiedCmd === 'cmd4' ? 'Tersalin!' : 'Salin Perintah'}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Hasil installer siap pakai akan berada di folder: <code>dist/LPJ-BOS-Desktop Setup 1.0.0.exe</code>
            </p>
            <div className="bg-slate-900 text-emerald-400 font-mono text-xs p-2.5 rounded-lg">
              npm run dist:win
            </div>
          </div>
        </div>
      </div>

      {/* 2. Pengaturan Keamanan & Folder Database */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <ShieldCheck size={18} className="text-emerald-600" />
          <h4 className="text-sm font-bold text-slate-900">Keamanan Penyimpanan Data Pengguna</h4>
        </div>

        <div className="space-y-3 text-xs text-slate-600">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <p>
              <strong>Data Tidak Akan Hilang Saat Update:</strong> Database SQLite disimpan di <code>%APPDATA%\LPJ BOS Desktop\data\lpj-bos.sqlite</code>, terpisah dari file executable program. Saat aplikasi diperbarui melalui installer baru, database tidak akan tertimpa atau terhapus.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <p>
              <strong>100% Offline Tanpa Ketergantungan Cloud:</strong> Aplikasi tidak mengirimkan transaksi keuangan sekolah ke server pihak ketiga manapun. Seluruh berkas PDF, foto, dan kuitansi disimpan di drive komputer Anda.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <p>
              <strong>Kepatuhan Standar Format SPJ:</strong> Struktur dokumen PDF mengikuti format resmi referensi Kabupaten Aceh Tamiang (Surat Pesanan, Faktur Toko, BAST 3 Tanda Tangan, Kuitansi 4 Tanda Tangan, dan Lampiran Foto).
            </p>
          </div>
        </div>
      </div>

      {/* 3. Zona Bahaya: Reset Database */}
      <div className="bg-white rounded-2xl p-6 border border-rose-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-rose-100">
          <div className="flex items-center gap-2 text-rose-700">
            <AlertTriangle size={18} />
            <h4 className="text-sm font-bold">Zona Pengaturan Lanjut: Reset Database</h4>
          </div>
        </div>

        <p className="text-xs text-slate-600">
          Menyetel ulang seluruh pembukuan ke data demonstrasi contoh (SD Negeri Bangun Sari 2022). Harap pastikan Anda telah membuat cadangan sebelum menekan tombol ini.
        </p>

        <div className="pt-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
          >
            <RotateCcw size={14} />
            <span>Reset Database ke Setelan Awal</span>
          </button>
        </div>
      </div>
    </div>
  );
};
