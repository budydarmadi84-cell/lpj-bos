/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { localDB } from './services/storage';
import {
  SchoolProfile,
  FiscalYear,
  LocalUser,
  BkuTransaction,
  BudgetCategory,
  Pemasok,
  SpjDocumentArchive,
} from './types';

// Layout
import { Sidebar, ActivePage } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { ProfilSekolahView } from './components/profil/ProfilSekolahView';
import { BkuView } from './components/bku/BkuView';
import { AnggaranView } from './components/anggaran/AnggaranView';
import { BelanjaView } from './components/belanja/BelanjaView';
import { PemasokView } from './components/pemasok/PemasokView';
import { SpjGeneratorView } from './components/spj/SpjGeneratorView';
import { ArsipView } from './components/arsip/ArsipView';
import { LaporanView } from './components/laporan/LaporanView';
import { UsersView } from './components/users/UsersView';
import { BackupRestoreView } from './components/backup/BackupRestoreView';
import { SettingsView } from './components/pengaturan/SettingsView';

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const [collapsed, setCollapsed] = useState(false);

  // Core Data loaded from SQLite / Local storage
  const [school, setSchool] = useState<SchoolProfile>(localDB.getSchoolProfile());
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>(localDB.getFiscalYears());
  const [activeFiscalYear, setActiveFiscalYear] = useState<FiscalYear>(localDB.getActiveFiscalYear());
  const [currentUser, setCurrentUser] = useState<LocalUser>(localDB.getCurrentUser());
  const [users, setUsers] = useState<LocalUser[]>(localDB.getUsers());
  const [categories, setCategories] = useState<BudgetCategory[]>(localDB.getCategories());
  const [pemasokList, setPemasokList] = useState<Pemasok[]>(localDB.getPemasok());
  const [transactions, setTransactions] = useState<BkuTransaction[]>(localDB.getTransactions(activeFiscalYear.id));
  const [archives, setArchives] = useState<SpjDocumentArchive[]>(localDB.getArchives());

  // Quick Action Modal states
  const [isBkuModalOpen, setIsBkuModalOpen] = useState(false);
  const [selectedTxForSpj, setSelectedTxForSpj] = useState<BkuTransaction | null>(null);
  const [selectedTxForBelanja, setSelectedTxForBelanja] = useState<string | undefined>(undefined);

  // Refresh all state from local storage engine
  const refreshData = () => {
    setSchool(localDB.getSchoolProfile());
    setFiscalYears(localDB.getFiscalYears());
    const curYear = localDB.getActiveFiscalYear();
    setActiveFiscalYear(curYear);
    setCurrentUser(localDB.getCurrentUser());
    setUsers(localDB.getUsers());
    setCategories(localDB.getCategories());
    setPemasokList(localDB.getPemasok());
    setTransactions(localDB.getTransactions(curYear.id));
    setArchives(localDB.getArchives());
  };

  // Change active fiscal year
  const handleChangeFiscalYear = (yearId: string) => {
    localDB.setActiveFiscalYear(yearId);
    const newYear = localDB.getActiveFiscalYear();
    setActiveFiscalYear(newYear);
    setTransactions(localDB.getTransactions(newYear.id));
  };

  // Balance calculations
  const balanceData = useMemo(() => {
    return localDB.calculateBalances(activeFiscalYear.id);
  }, [activeFiscalYear.id, transactions]);

  // Page title mapping
  const getPageInfo = (): { title: string; subtitle: string } => {
    switch (activePage) {
      case 'dashboard':
        return {
          title: 'Dashboard LPJ BOS',
          subtitle: `Tahun Anggaran ${activeFiscalYear.tahun} • Ringkasan Keuangan & Realisasi Belanja`,
        };
      case 'profil':
        return {
          title: 'Profil Satuan Pendidikan',
          subtitle: 'Pengaturan identitas sekolah, kepala sekolah, bendahara & pengurus barang',
        };
      case 'bku':
        return {
          title: 'Buku Kas Umum (BKU)',
          subtitle: 'Pencatatan kas masuk, kas keluar belanja, dan saldo berjalan otomatis',
        };
      case 'anggaran':
        return {
          title: 'Anggaran & Realisasi Belanja',
          subtitle: 'Pengelolaan pagu anggaran per komponen 8 standar BOS dan status capaian',
        };
      case 'belanja':
        return {
          title: 'Rincian Belanja & Foto Barang',
          subtitle: 'Item rincian pembelian barang, kuantitas, harga, dan dokumentasi foto fisik',
        };
      case 'pemasok':
        return {
          title: 'Data Pemasok & Toko Rekanan',
          subtitle: 'Direktori penyedia barang/jasa, alamat, NPWP, dan riwayat transaksi',
        };
      case 'spj':
        return {
          title: 'Generator Dokumen SPJ & PDF (Format Resmi)',
          subtitle: 'Surat Pesanan, Faktur Toko, BAST 3 Pihak, Kuitansi Penerimaan, & Foto Barang',
        };
      case 'arsip':
        return {
          title: 'Ruang Arsip & Riwayat SPJ Lokal',
          subtitle: 'Pencarian berkas dokumen yang telah disahkan, versi dokumen, dan cetak ulang',
        };
      case 'laporan':
        return {
          title: 'Laporan Rekapitulasi & Ekspor Excel',
          subtitle: 'Cetak pembukuan resmi dan ekspor ke Microsoft Excel (.xlsx)',
        };
      case 'users':
        return {
          title: 'Manajemen Pengguna & Hak Akses',
          subtitle: 'Otentikasi lokal (Bendahara, Kepala Sekolah, Operator, Administrator)',
        };
      case 'backup':
        return {
          title: 'Cadangan & Pemulihan (Backup & Restore)',
          subtitle: 'Export & Import database SQLite lengkap dengan berkas foto dan dokumen PDF',
        };
      case 'pengaturan':
        return {
          title: 'Pengaturan & Panduan Installer Windows (.EXE)',
          subtitle: 'Arsitektur Electron, lokasi database %APPDATA%, dan kompilasi installer',
        };
      default:
        return { title: 'LPJ BOS Desktop', subtitle: '' };
    }
  };

  const { title, subtitle } = getPageInfo();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F5F8FC] font-sans antialiased text-slate-900">
      {/* 1. Navy Dark Sidebar */}
      <Sidebar
        activePage={activePage}
        setActivePage={(page) => {
          setActivePage(page);
          if (page === 'spj' && !selectedTxForSpj && transactions.length > 0) {
            const exp = transactions.find((t) => t.jenis === 'pengeluaran' && t.status !== 'dibatalkan');
            if (exp) setSelectedTxForSpj(exp);
          }
        }}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        school={school}
        activeFiscalYear={activeFiscalYear}
        fiscalYears={fiscalYears}
        onChangeFiscalYear={handleChangeFiscalYear}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar Header */}
        <Header
          title={title}
          subtitle={subtitle}
          currentUser={currentUser}
          users={users}
          onSwitchUser={(u) => {
            localDB.setCurrentUser(u);
            setCurrentUser(u);
          }}
          onOpenNewTxModal={() => {
            setActivePage('bku');
            setIsBkuModalOpen(true);
          }}
          onNavigateToSpj={() => {
            const exp = transactions.find((t) => t.jenis === 'pengeluaran' && t.status !== 'dibatalkan');
            if (exp) setSelectedTxForSpj(exp);
            setActivePage('spj');
          }}
          onRefreshData={refreshData}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          {activePage === 'dashboard' && (
            <DashboardView
              school={school}
              fiscalYear={activeFiscalYear}
              fiscalYears={fiscalYears}
              onChangeFiscalYear={handleChangeFiscalYear}
              categories={categories}
              transactions={transactions}
              balanceData={balanceData}
              setActivePage={setActivePage}
              onOpenNewTxModal={() => {
                setActivePage('bku');
                setIsBkuModalOpen(true);
              }}
              onSelectTxForSpj={(tx) => {
                setSelectedTxForSpj(tx);
                setActivePage('spj');
              }}
            />
          )}

          {activePage === 'profil' && (
            <ProfilSekolahView school={school} onRefresh={refreshData} />
          )}

          {activePage === 'bku' && (
            <BkuView
              fiscalYear={activeFiscalYear}
              school={school}
              categories={categories}
              pemasokList={pemasokList}
              transactions={transactions}
              onRefresh={refreshData}
              onOpenBelanja={(tx) => {
                setSelectedTxForBelanja(tx.id);
                setActivePage('belanja');
              }}
              onOpenSpj={(tx) => {
                setSelectedTxForSpj(tx);
                setActivePage('spj');
              }}
              isModalOpen={isBkuModalOpen}
              setIsModalOpen={setIsBkuModalOpen}
            />
          )}

          {activePage === 'anggaran' && (
            <AnggaranView
              categories={categories}
              fiscalYear={activeFiscalYear}
              school={school}
              onRefresh={refreshData}
            />
          )}

          {activePage === 'belanja' && (
            <BelanjaView
              transactions={transactions}
              school={school}
              selectedTxId={selectedTxForBelanja}
              onRefresh={refreshData}
              onOpenSpj={(tx) => {
                setSelectedTxForSpj(tx);
                setActivePage('spj');
              }}
            />
          )}

          {activePage === 'pemasok' && (
            <PemasokView
              pemasokList={pemasokList}
              transactions={transactions}
              onRefresh={refreshData}
            />
          )}

          {activePage === 'spj' && (
            <SpjGeneratorView
              transactions={transactions}
              school={school}
              fiscalYear={activeFiscalYear}
              pemasokList={pemasokList}
              initialSelectedTx={selectedTxForSpj}
              onRefresh={refreshData}
              onNavigateToArchive={() => setActivePage('arsip')}
            />
          )}

          {activePage === 'arsip' && (
            <ArsipView
              archives={archives}
              transactions={transactions}
              school={school}
              fiscalYear={activeFiscalYear}
              pemasokList={pemasokList}
              onOpenSpjPreview={(tx) => {
                setSelectedTxForSpj(tx);
                setActivePage('spj');
              }}
            />
          )}

          {activePage === 'laporan' && (
            <LaporanView
              transactions={transactions}
              school={school}
              fiscalYear={activeFiscalYear}
              categories={categories}
            />
          )}

          {activePage === 'users' && (
            <UsersView
              users={users}
              currentUser={currentUser}
              onRefresh={refreshData}
            />
          )}

          {activePage === 'backup' && (
            <BackupRestoreView onRefresh={refreshData} />
          )}

          {activePage === 'pengaturan' && (
            <SettingsView onResetData={refreshData} />
          )}
        </main>
      </div>
    </div>
  );
}
