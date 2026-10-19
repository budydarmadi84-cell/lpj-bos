# LPJ BOS Desktop — Aplikasi Pengelolaan & SPJ BOS Offline (.EXE)

Aplikasi desktop Windows offline untuk pengelolaan **Laporan Pertanggungjawaban (LPJ) Bantuan Operasional Sekolah (BOS)**, Buku Kas Umum (BKU), rincian belanja barang/jasa, dokumentasi foto fisik barang dari komputer atau kamera, generator dokumen SPJ PDF resmi (Surat Pesanan, Faktur, BAST, Kuitansi), pengarsipan lokal, serta cadangan & pemulihan database SQLite.

---

## Fitur Utama

1. **Dashboard Keuangan Real-Time**:
   - Banner sekolah dan pemilih tahun anggaran aktif
   - 5 Kartu Ringkasan: Pagu Dana BOS, Dana Diterima, Total Realisasi, Sisa Saldo Kas, Progres LPJ
   - Grafik realisasi anggaran per kategori/komponen BOS (8 Standar)
   - Status ringkasan dokumen SPJ (Disahkan, Siap Diperiksa, Dalam Proses, Konsep, Dibatalkan)
   - Aksi cepat dan tabel transaksi BKU terbaru

2. **Buku Kas Umum (BKU) Lengkap**:
   - Pencatatan penerimaan dan pengeluaran belanja
   - Perhitungan otomatis saldo berjalan konsisten (Saldo Awal + Penerimaan - Pengeluaran)
   - Filter tanggal, bulan, kategori, dan pencarian nomor bukti
   - Pencegahan transaksi ganda (idempotensi)
   - Pembatalan transaksi dengan pencatatan alasan resmi audit

3. **Rincian Belanja & Dokumentasi Foto Barang**:
   - Rincian item barang belanja per transaksi (kuantitas, satuan, harga satuan, total harga)
   - Unggah beberapa foto fisik barang dari hard disk
   - Pengambilan foto langsung melalui webcam/kamera laptop
   - Foto tersimpan di direktori lokal pengguna (`%APPDATA%\LPJ BOS Desktop\files\photos\`)

4. **Generator Dokumen SPJ Resmi 4-in-1 Berdasarkan Format Template Aceh Tamiang**:
   - **Surat Pesanan Barang** (Kop Dinas Aceh Tamiang, No. Pesanan, tabel barang, tanda tangan Kepala Sekolah)
   - **Bon / Faktur Toko** (Toko IZZI Fotocopy / ROMA DANI, rincian barang, total rupiah, tanda terima toko)
   - **Surat Berita Acara Serah Terima Barang (BAST)** (Pasal 1 & Pasal 2, tanda tangan 3 pihak: Pihak Pertama Toko, Pihak Kedua Pengurus Barang, Mengetahui Kepala Sekolah)
   - **Tanda Penerimaan / Kuitansi** (Format resmi checklist asli/kedua/ketiga/keempat, terbilang rupiah, 4 kolom tanda tangan: Setuju dibayar Kepsek, Yang Menerima Toko, Barang Diterima Pengurus Barang, Lunas dibayar Bendahara)
   - **Lampiran Dokumentasi Foto Fisik Barang**
   - Pratinjau langsung, unduh PDF A4 standar, dan cetak langsung (print)

5. **Arsip & Riwayat Dokumen Lokal**:
   - Pencarian metadata dokumen tersimpan
   - Cetak ulang dokumen lama tanpa mengubah saldo kas
   - Riwayat versi dokumen

6. **Penyimpanan Lokal Mandiri (SQLite & Local Disk)**:
   - Direktori: `%APPDATA%\LPJ BOS Desktop\`
   - `data/lpj-bos.sqlite`: Database transaksi utama
   - `files/photos/`: Foto fisik barang
   - `files/pdf/`: File PDF hasil cetak
   - `backups/`: Cadangan arsip berkala
   - Data aman dan tidak hilang saat komputer direstart atau aplikasi diperbarui

7. **Backup & Restore**:
   - Ekspor cadangan penuh dalam satu berkas portable (.json)
   - Pemulihan data dengan pembuatan backup pengaman otomatis sebelum penimpaan

8. **Otentikasi Lokal & Hak Akses (RBAC)**:
   - Bendahara BOS, Kepala Sekolah, Operator Sekolah, Administrator, Pengawas

---

## Panduan Menjalankan Proyek di Komputer Lokal & Menghasilkan File .EXE

### 1. Persyaratan Sistem
- Komputer dengan sistem operasi **Windows 10 / 11** (atau Linux / macOS untuk pengembangan)
- **Node.js** versi 18 atau 20 LTS terpasang ([nodejs.org](https://nodejs.org))
- **Visual Studio Code** atau editor teks pilihan Anda

### 2. Membuka Proyek
Ekstrak atau clone repositori proyek ini, lalu buka di Visual Studio Code:
```bash
code .
```

### 3. Memasang Dependensi
Buka Terminal di VS Code (tekan `Ctrl + \``) dan jalankan:
```bash
npm install
```

### 4. Menjalankan Aplikasi
- **Mode Pratinjau Web / Browser**:
  ```bash
  npm run dev
  ```
  Akses di browser melalui `http://localhost:3000`.

- **Mode Desktop Electron Langsung**:
  ```bash
  npm run electron:dev
  ```
  Jendela aplikasi desktop Windows akan terbuka secara langsung.

### 5. Membuat File Installer Windows (.EXE)
Jalankan perintah pembuatan installer:
```bash
npm run dist:win
```

Setelah proses kompilasi selesai, file installer Windows akan berada di folder:
```
dist-electron/
  ├── LPJ-BOS-Desktop Setup 1.0.0.exe   <-- Installer Windows NSIS siap pasang
  └── LPJ-BOS-Desktop-1.0.0-portable.exe <-- Opsi Portable tanpa instalasi
```

Installer tersebut akan secara otomatis:
- Membuat shortcut pada Desktop Windows
- Membuat shortcut pada Start Menu
- Menyimpan database di `%APPDATA%\LPJ BOS Desktop\` sehingga data tidak hilang saat installer versi baru dipasang (update aplikasi).
