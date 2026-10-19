import React from 'react';
import {
  LayoutDashboard,
  School,
  BookOpenCheck,
  PieChart,
  ShoppingBag,
  Store,
  FileCheck2,
  Archive,
  FileSpreadsheet,
  Users,
  HardDriveDownload,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
  Calendar,
} from 'lucide-react';
import { SchoolProfile, FiscalYear } from '../../types';

export type ActivePage =
  | 'dashboard'
  | 'profil'
  | 'bku'
  | 'anggaran'
  | 'belanja'
  | 'pemasok'
  | 'spj'
  | 'arsip'
  | 'laporan'
  | 'users'
  | 'backup'
  | 'pengaturan';

interface SidebarProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  school: SchoolProfile;
  activeFiscalYear: FiscalYear;
  fiscalYears: FiscalYear[];
  onChangeFiscalYear: (yearId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  setActivePage,
  collapsed,
  setCollapsed,
  school,
  activeFiscalYear,
  fiscalYears,
  onChangeFiscalYear,
}) => {
  const menuItems = [
    { id: 'dashboard' as ActivePage, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profil' as ActivePage, label: 'Profil Sekolah', icon: School },
    { id: 'bku' as ActivePage, label: 'Buku Kas Umum', icon: BookOpenCheck, badge: 'BKU' },
    { id: 'anggaran' as ActivePage, label: 'Anggaran & Realisasi', icon: PieChart },
    { id: 'belanja' as ActivePage, label: 'Belanja & Foto Barang', icon: ShoppingBag },
    { id: 'pemasok' as ActivePage, label: 'Data Pemasok', icon: Store },
    { id: 'spj' as ActivePage, label: 'Dokumen SPJ & PDF', icon: FileCheck2, highlight: true },
    { id: 'arsip' as ActivePage, label: 'Arsip & Riwayat', icon: Archive },
    { id: 'laporan' as ActivePage, label: 'Laporan & Ekspor', icon: FileSpreadsheet },
    { id: 'users' as ActivePage, label: 'Pengguna & Akses', icon: Users },
    { id: 'backup' as ActivePage, label: 'Backup & Restore', icon: HardDriveDownload },
    { id: 'pengaturan' as ActivePage, label: 'Installer .EXE & Setelan', icon: Settings },
  ];

  return (
    <aside
      className={`relative flex flex-col shrink-0 transition-all duration-300 select-none z-30 ${
        collapsed ? 'w-20' : 'w-72'
      }`}
      style={{ backgroundColor: '#0D2345' }}
    >
      {/* Top Branding Header */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-white/10">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black shadow-lg shadow-blue-500/30 shrink-0">
            <span className="text-lg tracking-wider">BOS</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="text-white font-bold text-base leading-tight tracking-wide flex items-center gap-1.5">
                LPJ BOS Desktop
              </span>
              <span className="text-xs text-blue-300/80 font-medium tracking-tight truncate">
                Offline Windows Edition
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-300 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
          title={collapsed ? 'Perluas Menu' : 'Perkecil Menu'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Fiscal Year Selector in Sidebar */}
      {!collapsed ? (
        <div className="px-4 py-3 bg-white/5 border-b border-white/10">
          <label className="text-[11px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5 mb-1.5">
            <Calendar size={13} className="text-blue-400" />
            Tahun Anggaran Aktif
          </label>
          <select
            value={activeFiscalYear.id}
            onChange={(e) => onChangeFiscalYear(e.target.value)}
            className="w-full bg-[#122c54] text-white border border-blue-400/30 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {fiscalYears.map((fy) => (
              <option key={fy.id} value={fy.id} className="bg-[#0D2345] text-white">
                Tahun {fy.tahun} (Pagu: Rp {(fy.paguTotal / 1000000).toFixed(1)} Juta)
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="py-2 flex justify-center border-b border-white/10">
          <span className="text-[11px] font-bold text-blue-400 bg-white/10 px-2 py-0.5 rounded">
            {activeFiscalYear.tahun}
          </span>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group relative ${
                isActive
                  ? 'bg-[#1769E0] text-white shadow-md shadow-blue-600/30 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              } ${item.highlight && !isActive ? 'border border-blue-400/25' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                size={19}
                className={`shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-white' : item.highlight ? 'text-blue-400' : 'text-slate-300'
                }`}
              />
              {!collapsed && (
                <span className="truncate flex-1 text-left">{item.label}</span>
              )}
              {!collapsed && item.badge && (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">
                  {item.badge}
                </span>
              )}
              {!collapsed && item.highlight && (
                <span className="bg-amber-500/20 text-amber-300 text-[10px] px-1.5 py-0.5 rounded font-bold">
                  SPJ 4-in-1
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom School Status Card */}
      <div className="p-3 border-t border-white/10 bg-black/20">
        {!collapsed ? (
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-1 rounded bg-blue-500/20 text-blue-400">
                <Building2 size={14} />
              </div>
              <div className="truncate">
                <p className="text-white text-xs font-bold truncate leading-tight">
                  {school.namaSekolah}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  NPSN: {school.npsn}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1.5 border-t border-white/5 text-[10px] text-slate-300">
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                SQLite Offline
              </span>
              <span className="font-mono text-slate-400">v1.0.0</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mb-1" title="Offline SQLite Siap"></div>
            <span className="text-[9px] text-slate-400 font-mono">OK</span>
          </div>
        )}
      </div>
    </aside>
  );
};
