import React, { useState } from 'react';
import {
  School,
  Building,
  Save,
  CheckCircle2,
  User,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  PenTool,
  ShieldCheck,
  RotateCcw,
  Upload,
  Image as ImageIcon,
  Check,
  Sparkles,
} from 'lucide-react';
import { SchoolProfile } from '../../types';
import { localDB } from '../../services/storage';
import { SignaturePadModal } from '../common/SignaturePadModal';
import { KopSurat } from '../common/KopSurat';
import { LOGO_ACEH_TAMIANG_B64 } from '../../assets/logoAcehTamiang';

interface ProfilSekolahViewProps {
  school: SchoolProfile;
  onRefresh: () => void;
}

export const ProfilSekolahView: React.FC<ProfilSekolahViewProps> = ({
  school,
  onRefresh,
}) => {
  const [formData, setFormData] = useState<SchoolProfile>({ ...school });
  const [sigModal, setSigModal] = useState<{
    isOpen: boolean;
    field: 'ttdKepalaSekolah' | 'ttdBendahara' | 'ttdPengurusBarang' | 'stempelSekolah';
    title: string;
    roleName: string;
    signatoryName: string;
    nip?: string;
    existingSignature?: string;
  } | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localDB.saveSchoolProfile(formData);
    setSuccessMsg('Profil sekolah dan pengaturan kop surat berhasil disimpan di database lokal!');
    onRefresh();
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  // Handler untuk Mengimpor / Mengunggah Logo dari File Lokal
  const handleLogoUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'logoKabupatenUrl' | 'logoSekolahUrl'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Silakan pilih file gambar yang valid (PNG, JPG, JPEG, SVG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        const updated = {
          ...formData,
          [field]: dataUrl,
          ...(field === 'logoKabupatenUrl' ? { logoUrl: dataUrl } : {}),
        };
        setFormData(updated);
        localDB.saveSchoolProfile(updated);
        setSuccessMsg('Logo Pemerintah Daerah (Kiri) berhasil diimpor & disimpan!');
        onRefresh();
        setTimeout(() => setSuccessMsg(''), 3500);
      }
    };
    reader.readAsDataURL(file);
    // Reset target value so re-selecting same file triggers change
    e.target.value = '';
  };

  // Reset Logo Kabupaten ke Standar Aceh Tamiang
  const handleResetLogoKabupaten = () => {
    const updated = {
      ...formData,
      logoKabupatenUrl: '/logo_aceh_tamiang.jpg',
      logoUrl: '/logo_aceh_tamiang.jpg',
    };
    setFormData(updated);
    localDB.saveSchoolProfile(updated);
    setSuccessMsg('Logo Kabupaten direset ke default resmi Aceh Tamiang!');
    onRefresh();
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const logoKiriCurrent =
    formData.logoKabupatenUrl ||
    formData.logoUrl ||
    '/logo_aceh_tamiang.jpg' ||
    LOGO_ACEH_TAMIANG_B64;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-[#1769E0]">
            <School size={22} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Profil Satuan Pendidikan & Pejabat Sekolah</h3>
            <p className="text-xs text-slate-500">
              Data ini otomatis tercetak pada Kop Surat Pesanan, Faktur, Berita Acara (BAST), Kuitansi, dan Laporan BKU.
            </p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
        {/* Identitas Sekolah */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <Building size={14} className="text-blue-600" />
            1. Identitas Satuan Pendidikan
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Nama Resmi Sekolah</label>
              <input
                type="text"
                value={formData.namaSekolah}
                onChange={(e) => setFormData({ ...formData, namaSekolah: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Nomor Pokok Sekolah Nasional (NPSN)</label>
              <input
                type="text"
                value={formData.npsn}
                onChange={(e) => setFormData({ ...formData, npsn: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Kabupaten / Kota</label>
              <input
                type="text"
                value={formData.kabupaten}
                onChange={(e) => setFormData({ ...formData, kabupaten: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Kecamatan</label>
              <input
                type="text"
                value={formData.kecamatan}
                onChange={(e) => setFormData({ ...formData, kecamatan: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Desa / Kelurahan</label>
              <input
                type="text"
                value={formData.desa}
                onChange={(e) => setFormData({ ...formData, desa: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="font-bold text-slate-700 block mb-1">Alamat Jalan & Dusun Lengkap</label>
            <input
              type="text"
              value={formData.alamat}
              onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
        </div>

        {/* Pejabat Sekolah & Tanda Tangan */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <User size={14} className="text-blue-600" />
            2. Pejabat Penandatangan Dokumen BOS
          </h4>

          {/* Kepala Sekolah */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Nama Kepala Sekolah</label>
              <input
                type="text"
                value={formData.namaKepalaSekolah}
                onChange={(e) => setFormData({ ...formData, namaKepalaSekolah: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">NIP Kepala Sekolah</label>
              <input
                type="text"
                value={formData.nipKepalaSekolah}
                onChange={(e) => setFormData({ ...formData, nipKepalaSekolah: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>
          </div>

          {/* Bendahara BOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Nama Bendahara BOS</label>
              <input
                type="text"
                value={formData.namaBendahara}
                onChange={(e) => setFormData({ ...formData, namaBendahara: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">NIP Bendahara BOS</label>
              <input
                type="text"
                value={formData.nipBendahara}
                onChange={(e) => setFormData({ ...formData, nipBendahara: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>
          </div>

          {/* Pengurus Barang */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Nama Pengurus Barang (Penerima BAST)</label>
              <input
                type="text"
                value={formData.namaPengurusBarang}
                onChange={(e) => setFormData({ ...formData, namaPengurusBarang: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">NIP Pengurus Barang</label>
              <input
                type="text"
                value={formData.nipPengurusBarang}
                onChange={(e) => setFormData({ ...formData, nipPengurusBarang: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>
          </div>
        </div>

        {/* 3. Tanda Tangan Elektronik (TTE) & Stempel Resmi */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <PenTool size={14} className="text-blue-600" />
              3. Tanda Tangan Elektronik (TTE) & Stempel Resmi Satuan Pendidikan
            </h4>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck size={11} className="text-emerald-600" />
              TTE Terhubung ke Dokumen SPJ PDF
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Goreskan tanda tangan digital atau unggah gambar transparan tanda tangan/stempel resmi. Tanda tangan ini dapat disematkan secara otomatis pada dokumen SPJ (Surat Pesanan, BAST, dan Kuitansi) saat opsi TTE diaktifkan.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* TTE Kepala Sekolah */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Kepala Sekolah</span>
                  <p className="font-bold text-slate-900 text-xs">{formData.namaKepalaSekolah}</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSigModal({
                      isOpen: true,
                      field: 'ttdKepalaSekolah',
                      title: 'Tanda Tangan Elektronik Kepala Sekolah',
                      roleName: 'Kepala Sekolah',
                      signatoryName: formData.namaKepalaSekolah,
                      nip: formData.nipKepalaSekolah,
                      existingSignature: formData.ttdKepalaSekolah,
                    })
                  }
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                >
                  <PenTool size={12} />
                  <span>{formData.ttdKepalaSekolah ? 'Ganti TTE' : 'Beri TTE'}</span>
                </button>
              </div>

              <div className="h-20 bg-white border border-dashed border-slate-300 rounded-lg flex items-center justify-center p-2">
                {formData.ttdKepalaSekolah ? (
                  <img src={formData.ttdKepalaSekolah} alt="TTE Kepala Sekolah" className="max-h-16 max-w-full object-contain" />
                ) : (
                  <span className="text-[11px] text-slate-400 italic">Belum ada tanda tangan elektronik</span>
                )}
              </div>
            </div>

            {/* TTE Bendahara BOS */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Bendahara BOS</span>
                  <p className="font-bold text-slate-900 text-xs">{formData.namaBendahara}</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSigModal({
                      isOpen: true,
                      field: 'ttdBendahara',
                      title: 'Tanda Tangan Elektronik Bendahara BOS',
                      roleName: 'Bendahara BOS',
                      signatoryName: formData.namaBendahara,
                      nip: formData.nipBendahara,
                      existingSignature: formData.ttdBendahara,
                    })
                  }
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                >
                  <PenTool size={12} />
                  <span>{formData.ttdBendahara ? 'Ganti TTE' : 'Beri TTE'}</span>
                </button>
              </div>

              <div className="h-20 bg-white border border-dashed border-slate-300 rounded-lg flex items-center justify-center p-2">
                {formData.ttdBendahara ? (
                  <img src={formData.ttdBendahara} alt="TTE Bendahara" className="max-h-16 max-w-full object-contain" />
                ) : (
                  <span className="text-[11px] text-slate-400 italic">Belum ada tanda tangan elektronik</span>
                )}
              </div>
            </div>

            {/* TTE Pengurus Barang */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Pengurus Barang</span>
                  <p className="font-bold text-slate-900 text-xs">{formData.namaPengurusBarang}</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSigModal({
                      isOpen: true,
                      field: 'ttdPengurusBarang',
                      title: 'Tanda Tangan Elektronik Pengurus Barang',
                      roleName: 'Pengurus Barang',
                      signatoryName: formData.namaPengurusBarang,
                      nip: formData.nipPengurusBarang,
                      existingSignature: formData.ttdPengurusBarang,
                    })
                  }
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                >
                  <PenTool size={12} />
                  <span>{formData.ttdPengurusBarang ? 'Ganti TTE' : 'Beri TTE'}</span>
                </button>
              </div>

              <div className="h-20 bg-white border border-dashed border-slate-300 rounded-lg flex items-center justify-center p-2">
                {formData.ttdPengurusBarang ? (
                  <img src={formData.ttdPengurusBarang} alt="TTE Pengurus Barang" className="max-h-16 max-w-full object-contain" />
                ) : (
                  <span className="text-[11px] text-slate-400 italic">Belum ada tanda tangan elektronik</span>
                )}
              </div>
            </div>

            {/* Stempel Sekolah */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Stempel Satuan Pendidikan</span>
                  <p className="font-bold text-slate-900 text-xs">{formData.namaSekolah}</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSigModal({
                      isOpen: true,
                      field: 'stempelSekolah',
                      title: 'Stempel Resmi Satuan Pendidikan',
                      roleName: 'Stempel Sekolah',
                      signatoryName: formData.namaSekolah,
                      existingSignature: formData.stempelSekolah,
                    })
                  }
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                >
                  <PenTool size={12} />
                  <span>{formData.stempelSekolah ? 'Ganti Stempel' : 'Atur Stempel'}</span>
                </button>
              </div>

              <div className="h-20 bg-white border border-dashed border-slate-300 rounded-lg flex items-center justify-center p-2">
                {formData.stempelSekolah ? (
                  <img src={formData.stempelSekolah} alt="Stempel Sekolah" className="max-h-16 max-w-full object-contain" />
                ) : (
                  <span className="text-[11px] text-slate-400 italic">Belum ada stempel sekolah</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Rekening Bank & Kontak */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <CreditCard size={14} className="text-blue-600" />
            4. Rekening Penampung Dana BOS & Kontak
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Nomor Rekening BOS</label>
              <input
                type="text"
                value={formData.rekeningBank}
                onChange={(e) => setFormData({ ...formData, rekeningBank: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Nama Bank Penyalur</label>
              <input
                type="text"
                value={formData.namaBank}
                onChange={(e) => setFormData({ ...formData, namaBank: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Email Satuan Pendidikan</label>
              <input
                type="email"
                value={formData.emailSekolah}
                onChange={(e) => setFormData({ ...formData, emailSekolah: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Nomor Telepon / WhatsApp Sekolah</label>
              <input
                type="text"
                value={formData.telepon}
                onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* 5. IMPORT LOGO KOP SURAT (LOGO KIRI: KABUPATEN & TEKS CENTER) */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <ImageIcon size={14} className="text-blue-600" />
              5. Pengaturan & Impor Logo Kop Surat Resmi
            </h4>
            <span className="text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              <Sparkles size={11} className="text-blue-600" />
              Logo Kabupaten (Kiri) & Tulisan Center
            </span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Sesuai aturan tata naskah dinas resmi, <strong>logo di sebelah kiri adalah logo pemerintah kabupaten / daerah</strong> yang dapat diimpor langsung dari data / file perangkat Anda. <strong>Tulisan kop surat diformat rata tengah (center)</strong> dan setiap baris diatur tepat 1 baris.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* CARD LOGO KIRI: LOGO PEMERINTAH DAERAH / KABUPATEN */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase font-bold text-slate-700 block">
                    Logo Pemerintah Daerah / Kabupaten
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Posisi: Kiri atas Kop Surat
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleResetLogoKabupaten}
                  title="Kembalikan ke lambang default Aceh Tamiang"
                  className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-[10px] font-semibold flex items-center gap-1 shadow-2xs"
                >
                  <RotateCcw size={11} />
                  <span>Reset Default</span>
                </button>
              </div>

              {/* Preview Thumbnail */}
              <div className="h-28 bg-white border border-dashed border-slate-300 rounded-xl flex items-center justify-center p-3 relative group">
                <img
                  src={logoKiriCurrent}
                  alt="Logo Kabupaten"
                  className="max-h-24 max-w-full object-contain filter drop-shadow-xs"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = LOGO_ACEH_TAMIANG_B64;
                  }}
                />
              </div>

              {/* Upload Button */}
              <div>
                <label className="cursor-pointer w-full py-2 px-3 bg-white hover:bg-blue-50 border border-blue-200 hover:border-blue-300 rounded-xl text-xs font-bold text-blue-700 flex items-center justify-center gap-2 shadow-2xs transition-colors">
                  <Upload size={14} />
                  <span>Impor / Ganti Logo Kabupaten</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleLogoUpload(e, 'logoKabupatenUrl')}
                  />
                </label>
                <p className="text-[10px] text-slate-400 text-center mt-1">
                  Format: PNG, JPG, JPEG, atau SVG transparan (Rekomendasi 200×200 px)
                </p>
              </div>
            </div>

            {/* Keterangan Format Center & Tata Naskah */}
            <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[11px] uppercase font-bold text-blue-900 block mb-1">
                  Ketentuan Tata Letak Kop Surat (Center)
                </span>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                  <li><strong>Logo Daerah di Kiri:</strong> Lambang resmi pemerintah kabupaten/kota diletakkan presisi di sisi kiri.</li>
                  <li><strong>Tulisan Rata Tengah (Center):</strong> Seluruh baris nama pemda, dinas, sekolah, alamat, dan kontak diposisikan tepat di tengah dokumen.</li>
                  <li><strong>Tepat 1 Baris:</strong> Jika nama pemda atau sekolah panjang, ukuran huruf mengecil otomatis secara proporsional.</li>
                </ul>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-blue-200 text-[11px] text-blue-800 flex items-center gap-2">
                <CheckCircle2 size={15} className="shrink-0 text-blue-600" />
                <span>Logo sekolah ditiadakan dari kop surat sesuai instruksi resmi.</span>
              </div>
            </div>
          </div>

          {/* PENGATURAN UKURAN KERTAS & MARGIN ATAS KOP SURAT */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-800 uppercase block">
                Pilihan Ukuran Kertas & Margin Atas Dokumen:
              </span>
              <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full font-bold">
                Standar SPJ & Laporan BOS
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Pilihan Ukuran Kertas */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1.5">
                  Ukuran Kertas Dokumen Cetak / PDF:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, ukuranKertas: 'A4' })}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      (formData.ukuranKertas || 'A4') === 'A4'
                        ? 'border-blue-600 bg-blue-50/80 text-blue-900 shadow-2xs ring-1 ring-blue-500'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>📄 Kertas A4</span>
                      {(formData.ukuranKertas || 'A4') === 'A4' && (
                        <Check size={14} className="text-blue-600" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      210 × 297 mm (Standar Internasional)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, ukuranKertas: 'F4' })}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      formData.ukuranKertas === 'F4'
                        ? 'border-blue-600 bg-blue-50/80 text-blue-900 shadow-2xs ring-1 ring-blue-500'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>📜 Kertas F4 / Folio</span>
                      {formData.ukuranKertas === 'F4' && (
                        <Check size={14} className="text-blue-600" />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      8,5" × 13" (215,9 × 330,2 mm)
                    </span>
                  </button>
                </div>
              </div>

              {/* Margin Atas Kop Surat (Kira-kira 2 cm) */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1.5 flex items-center justify-between">
                  <span>Margin Atas Kop Surat:</span>
                  <span className="text-blue-700 font-bold">{formData.marginTopCm ?? 2} cm</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[1.5, 2.0, 2.5, 3.0].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setFormData({ ...formData, marginTopCm: val })}
                      className={`py-2 px-1.5 rounded-lg border text-xs font-bold text-center transition-all ${
                        (formData.marginTopCm ?? 2) === val
                          ? 'border-blue-600 bg-blue-600 text-white shadow-2xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {val.toFixed(1)} cm
                      {val === 2.0 && <span className="block text-[8px] font-normal opacity-85">Rekomendasi</span>}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">
                  Batas jarak dari ujung atas lembar kertas ke tepi atas kop surat (standar: 2 cm).
                </p>
              </div>
            </div>
          </div>

          {/* Form Kustomisasi Teks Kop Surat (Opsional) */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
            <span className="text-[11px] font-bold text-slate-700 block uppercase">
              Kustomisasi Teks Baris Kop Surat (Tepat 1 Baris):
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-600 block mb-1">
                  Baris 1: Nama Pemerintah Daerah
                </label>
                <input
                  type="text"
                  placeholder="PEMERINTAH KABUPATEN ACEH TAMIANG"
                  value={formData.namaPemda || ''}
                  onChange={(e) => setFormData({ ...formData, namaPemda: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600 block mb-1">
                  Baris 2: Nama Dinas Pendidikan
                </label>
                <input
                  type="text"
                  placeholder="DINAS PENDIDIKAN DAN KEBUDAYAAN"
                  value={formData.namaDinas || ''}
                  onChange={(e) => setFormData({ ...formData, namaDinas: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 6. STANDAR FORMAT & ATURAN KOP SURAT RESMI (SEMUA TEKS 1 BARIS) */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <School size={14} className="text-blue-600" />
              6. Standar Format & Aturan Kop Surat Resmi (Sesuai Contoh Gambar)
            </h4>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              <CheckCircle2 size={11} />
              <span>Margin 2 cm & Kertas A4 / 8,5" × 13"</span>
            </span>
          </div>

          {/* Tabel Matriks Aturan Sesuai Contoh Gambar */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50/50">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-bold text-[11px] border-b border-slate-200">
                  <th className="p-2.5 text-center w-12">No</th>
                  <th className="p-2.5 text-center">Komponen Kop Surat</th>
                  <th className="p-2.5 text-center w-36">Ukuran Font Standar</th>
                  <th className="p-2.5 text-center">Format Tulisan & Ketentuan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-[11px]">
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 text-center font-bold text-slate-500">1</td>
                  <td className="p-2.5 font-semibold text-slate-800">
                    Nama Pemerintah Daerah<br />
                    <span className="text-[10px] text-slate-500 font-normal">Contoh: PEMERINTAH KABUPATEN ACEH TAMIANG</span>
                  </td>
                  <td className="p-2.5 text-center font-bold text-blue-700">12 – 14 pt</td>
                  <td className="p-2.5 text-slate-700">
                    Huruf Kapital Semuanya (ALL CAPS), Reguler (Tidak Tebal). <strong>Dibuat tepat 1 baris</strong>.
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 text-center font-bold text-slate-500">2</td>
                  <td className="p-2.5 font-semibold text-slate-800">
                    Nama Dinas Pendidikan<br />
                    <span className="text-[10px] text-slate-500 font-normal">Contoh: DINAS PENDIDIKAN DAN KEBUDAYAAN</span>
                  </td>
                  <td className="p-2.5 text-center font-bold text-blue-700">12 – 14 pt</td>
                  <td className="p-2.5 text-slate-700">
                    Huruf Kapital Semuanya (ALL CAPS), Reguler (Tidak Tebal). <strong>Dibuat tepat 1 baris</strong>.
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 text-center font-bold text-slate-500">3</td>
                  <td className="p-2.5 font-semibold text-slate-800">
                    Nama Satuan Pendidikan (Sekolah)<br />
                    <span className="text-[10px] text-slate-500 font-normal">Contoh: SMP NEGERI 1 PERK PULAU TIGA / SD NEGERI 2 PULAU TIGA</span>
                  </td>
                  <td className="p-2.5 text-center font-bold text-emerald-700">14 – 16 pt</td>
                  <td className="p-2.5 font-bold text-slate-900">
                    Huruf Kapital Semuanya (ALL CAPS), Cetak Tebal (Bold). Ukuran dominan, <strong>tepat 1 baris</strong>.
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 text-center font-bold text-slate-500">4</td>
                  <td className="p-2.5 font-semibold text-slate-800">
                    Alamat Lengkap & Kontak Resmi<br />
                    <span className="text-[10px] text-slate-500 font-normal">Jalan, Kode Pos, Telp, Email, Website</span>
                  </td>
                  <td className="p-2.5 text-center font-bold text-slate-700">10 – 11 pt</td>
                  <td className="p-2.5 text-slate-700">
                    Huruf kapital hanya di awal kata (Title Case), Reguler, tidak tebal. <strong>Tepat 1 baris per elemen</strong>.
                  </td>
                </tr>
                <tr className="bg-blue-50/50">
                  <td className="p-2.5 text-center font-bold text-blue-700">★</td>
                  <td className="p-2.5 font-bold text-blue-900">
                    Ukuran Kertas & Margin Atas
                  </td>
                  <td className="p-2.5 text-center font-bold text-blue-800">A4 & F4 / 2 cm</td>
                  <td className="p-2.5 text-blue-900 font-semibold">
                    Dapat diubah antara <strong>A4 (210×297 mm)</strong> atau <strong>F4 (8,5" × 13" / 215,9×330,2 mm)</strong>. Margin atas diatur kira-kira <strong>2 cm</strong>.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Kotak Pratinjau Kertas Kop Surat (Simulasi A4 / F4) */}
          <div className="bg-slate-100 p-4 sm:p-6 rounded-xl border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Pratinjau Live Dokumen (Kertas {formData.ukuranKertas === 'F4' ? 'F4 / Folio 8.5" × 13"' : 'A4 210 × 297 mm'}, Margin Atas {formData.marginTopCm ?? 2} cm):
              </span>
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, ukuranKertas: 'A4' })}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                    (formData.ukuranKertas || 'A4') === 'A4'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📄 A4
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, ukuranKertas: 'F4' })}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                    formData.ukuranKertas === 'F4'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📜 F4 (8.5" × 13")
                </button>
              </div>
            </div>

            <div
              className={`bg-white p-5 sm:p-7 rounded-xl shadow-md border border-slate-300 mx-auto overflow-hidden transition-all ${
                formData.ukuranKertas === 'F4' ? 'max-w-3xl ring-2 ring-emerald-500/20' : 'max-w-2xl'
              }`}
            >
              <KopSurat
                school={formData}
                showBadges={true}
                paperSize={formData.ukuranKertas || 'A4'}
                marginTopCm={formData.marginTopCm ?? 2}
              />
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#1769E0] hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/25 transition-all flex items-center gap-2"
          >
            <Save size={16} />
            <span>Simpan Perubahan Profil & Kop Surat</span>
          </button>
        </div>
      </form>

      {/* Signature Pad Modal for School Signatories */}
      {sigModal && (
        <SignaturePadModal
          isOpen={sigModal.isOpen}
          title={sigModal.title}
          roleName={sigModal.roleName}
          signatoryName={sigModal.signatoryName}
          nip={sigModal.nip}
          existingSignature={sigModal.existingSignature}
          onClose={() => setSigModal(null)}
          onSave={(dataUrl) => {
            const updated = {
              ...formData,
              [sigModal.field]: dataUrl,
            };
            setFormData(updated);
            localDB.saveSchoolProfile(updated);
            setSuccessMsg(`TTE / Stempel untuk ${sigModal.roleName} berhasil diperbarui & disimpan!`);
            onRefresh();
            setTimeout(() => setSuccessMsg(''), 3000);
          }}
        />
      )}
    </div>
  );
};

export default ProfilSekolahView;
