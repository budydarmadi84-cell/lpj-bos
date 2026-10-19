import React, { useState } from 'react';
import {
  HardDrive,
  ShieldCheck,
  Bell,
  UserCheck,
  PlusCircle,
  FileCheck2,
  DownloadCloud,
  ChevronDown,
  CheckCircle2,
  RefreshCw,
  LogOut,
  User,
} from 'lucide-react';
import { LocalUser } from '../../types';
import { localDB } from '../../services/storage';

interface HeaderProps {
  title: string;
  subtitle?: string;
  currentUser: LocalUser;
  onOpenNewTxModal?: () => void;
  onNavigateToSpj?: () => void;
  onSwitchUser?: (u: LocalUser) => void;
  users: LocalUser[];
  onRefreshData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  currentUser,
  onOpenNewTxModal,
  onNavigateToSpj,
  onSwitchUser,
  users,
  onRefreshData,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [justSynced, setJustSynced] = useState(false);

  const logs = localDB.getAuditLogs().slice(0, 5);

  const handleManualSync = () => {
    setJustSynced(true);
    onRefreshData();
    setTimeout(() => setJustSynced(false), 1200);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'bendahara':
        return 'Bendahara BOS';
      case 'kepala_sekolah':
        return 'Kepala Sekolah';
      case 'operator':
        return 'Operator Sekolah';
      case 'admin':
        return 'Administrator';
      default:
        return 'Pengawas';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between shadow-xs sticky top-0 z-20">
      {/* Title & Path */}
      <div className="flex flex-col">
        <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
          {title}
        </h1>
        {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
      </div>

      {/* Middle & Right Section */}
      <div className="flex items-center gap-3">
        {/* Offline & Storage Indicator */}
        <div className="hidden lg:flex items-center gap-2 bg-emerald-50 border border-emerald-200/70 text-emerald-800 px-3 py-1.5 rounded-full text-xs font-semibold shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <HardDrive size={13} className="text-emerald-700" />
          <span>Mode Offline — Data Tersimpan di Komputer</span>
        </div>

        {/* Quick Action Buttons */}
        {onOpenNewTxModal && (
          <button
            onClick={onOpenNewTxModal}
            className="flex items-center gap-1.5 bg-[#1769E0] hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm shadow-blue-500/20 active:scale-95"
          >
            <PlusCircle size={15} />
            <span>+ Transaksi BKU</span>
          </button>
        )}

        {onNavigateToSpj && (
          <button
            onClick={onNavigateToSpj}
            className="hidden sm:flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm shadow-amber-500/20 active:scale-95"
          >
            <FileCheck2 size={15} />
            <span>Buat SPJ PDF</span>
          </button>
        )}

        {/* Sync / Refresh Button */}
        <button
          onClick={handleManualSync}
          className={`p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-all ${
            justSynced ? 'text-emerald-600 border-emerald-300 bg-emerald-50' : ''
          }`}
          title="Segarkan data lokal"
        >
          <RefreshCw size={16} className={justSynced ? 'animate-spin' : ''} />
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifDropdown(!showNotifDropdown);
              setShowUserDropdown(false);
            }}
            className="relative p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-colors"
            title="Riwayat Aktivitas Lokal"
          >
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600"></span>
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Riwayat Audit Lokal</span>
                <span className="text-[10px] text-slate-400">Offline SQLite</span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {logs.length === 0 ? (
                  <p className="p-4 text-xs text-slate-400 text-center">Belum ada riwayat tercatat.</p>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="p-3 text-xs hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-blue-700">{log.aksi}</span>
                        <span className="text-[10px] text-slate-400">{log.waktu}</span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">{log.detail}</p>
                      <span className="text-[9px] text-slate-400 mt-1 block">Oleh: {log.user}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Account Switcher Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserDropdown(!showUserDropdown);
              setShowNotifDropdown(false);
            }}
            className="flex items-center gap-2 p-1.5 pl-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
              {currentUser.fullName.charAt(0)}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 leading-tight">
                {currentUser.fullName.split(',')[0]}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                {getRoleLabel(currentUser.role)}
              </span>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-800">{currentUser.fullName}</p>
                <p className="text-[11px] text-slate-500">Peran: {getRoleLabel(currentUser.role)}</p>
                <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                  Otentikasi Lokal Aktif
                </span>
              </div>

              <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Ganti Akun Pengguna Lokal
              </div>

              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    onSwitchUser && onSwitchUser(u);
                    setShowUserDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    u.id === currentUser.id ? 'bg-blue-50/70 font-bold text-blue-700' : 'text-slate-700'
                  }`}
                >
                  <div className="truncate">
                    <p className="truncate leading-tight">{u.fullName}</p>
                    <p className="text-[10px] text-slate-400 font-normal">{getRoleLabel(u.role)}</p>
                  </div>
                  {u.id === currentUser.id && <CheckCircle2 size={14} className="text-blue-600 shrink-0" />}
                </button>
              ))}

              <div className="border-t border-slate-100 mt-2 pt-1 px-2">
                <button
                  onClick={() => setShowUserDropdown(false)}
                  className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 font-medium"
                >
                  <LogOut size={13} />
                  Kunci Sesi Aplikasi
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
