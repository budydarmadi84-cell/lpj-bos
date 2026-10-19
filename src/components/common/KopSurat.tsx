import React, { useRef, useLayoutEffect, useState, useCallback, useEffect } from 'react';
import { SchoolProfile } from '../../types';
import { LOGO_ACEH_TAMIANG_B64 } from '../../assets/logoAcehTamiang';

interface KopSuratProps {
  school: SchoolProfile;
  subTitle?: string;
  showBadges?: boolean;
  className?: string;
  paperSize?: 'A4' | 'F4';
  marginTopCm?: number;
}

/**
 * Komponen AutoFitText:
 * Memastikan tulisan selalu tepat SATU BARIS (single line, whitespace-nowrap).
 * Jika tulisan panjang/lewat, otomatis menyesuaikan (mengecilkan) ukuran font agar pas 1 baris.
 */
export const AutoFitText: React.FC<{
  text: string;
  basePt: number;
  minPt?: number;
  className?: string;
  style?: React.CSSProperties;
  tagName?: 'h1' | 'h2' | 'h3' | 'p' | 'div';
  renderChild?: (fontSizePt: number) => React.ReactNode;
}> = ({ text, basePt, minPt = 6.5, className = '', style = {}, tagName = 'div', renderChild }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [pt, setPt] = useState<number>(basePt);

  const adjustSize = useCallback(() => {
    const container = containerRef.current;
    const span = textRef.current;
    if (!container || !span) return;

    span.style.fontSize = `${basePt}pt`;
    const availableWidth = container.clientWidth;
    const naturalWidth = span.scrollWidth;

    if (availableWidth > 0 && naturalWidth > availableWidth) {
      const scale = availableWidth / naturalWidth;
      const calculated = Math.max(minPt, Number((basePt * scale * 0.98).toFixed(1)));
      setPt(calculated);
      span.style.fontSize = `${calculated}pt`;
    } else {
      setPt(basePt);
      span.style.fontSize = `${basePt}pt`;
    }
  }, [basePt, minPt, text]);

  useLayoutEffect(() => {
    adjustSize();
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      adjustSize();
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, [adjustSize]);

  useEffect(() => {
    adjustSize();
  }, [text, adjustSize]);

  const Tag = tagName as any;

  return (
    <div ref={containerRef} className="w-full overflow-hidden flex justify-center items-center">
      <Tag
        className={`whitespace-nowrap select-text text-center ${className}`}
        style={{
          ...style,
          fontSize: `${pt}pt`,
          lineHeight: 1.18,
        }}
      >
        <span ref={textRef} className="inline-block whitespace-nowrap">
          {renderChild ? renderChild(pt) : text}
        </span>
      </Tag>
    </div>
  );
};

export const KopSurat: React.FC<KopSuratProps> = ({
  school,
  subTitle,
  showBadges = false,
  className = '',
  paperSize,
  marginTopCm,
}) => {
  // Helper Title Case
  const toTitleCase = (str: string) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const currentPaper = paperSize || school.ukuranKertas || 'A4';
  const topMargin = marginTopCm ?? school.marginTopCm ?? 2; // Default margin atas 2 cm

  const kabName = school.kabupaten ? school.kabupaten.toUpperCase() : 'KABUPATEN ACEH TAMIANG';
  const kecName = school.kecamatan ? school.kecamatan.replace(/^Kecamatan\s+/i, '') : 'Tamiang Hulu';
  const kabClean = school.kabupaten ? school.kabupaten.replace(/^Kabupaten\s+/i, '') : 'Aceh Tamiang';

  // 1. Baris 1: Nama Pemerintah Daerah (Contoh: PEMERINTAH KABUPATEN ACEH TAMIANG)
  const pemdaText = school.namaPemda
    ? school.namaPemda.toUpperCase()
    : `PEMERINTAH ${kabName.startsWith('KABUPATEN') || kabName.startsWith('KOTA') ? kabName : `KABUPATEN ${kabName}`}`;

  // 2. Baris 2: Nama Dinas Pendidikan (Contoh: DINAS PENDIDIKAN DAN KEBUDAYAAN) - CETAK TEBAL sesuai contoh
  const dinasText = school.namaDinas
    ? school.namaDinas.toUpperCase()
    : 'DINAS PENDIDIKAN DAN KEBUDAYAAN';

  // 3. Baris 3: Nama Satuan Pendidikan (Contoh: SD NEGERI 2 PULAU TIGA) - CETAK TEBAL & BESAR
  const sekolahText = school.namaSekolah ? school.namaSekolah.toUpperCase() : 'SD NEGERI 2 PULAU TIGA';

  // 4. Baris 4: Format Alamat Sesuai Contoh Gambar:
  // Jln. Alur Jambu, Kec.Tamiang Hulu, Kab. Aceh Tamiang Kode Pos 24478
  const cleanAlamat = school.alamat
    ? school.alamat.replace(/^(Dsn\.|Dusun|Jln\.|Jalan)\s+/i, '')
    : 'Alur Jambu';
  const alamatFormatted = `Jln. ${toTitleCase(cleanAlamat)}, Kec. ${toTitleCase(kecName)}, Kab. ${toTitleCase(kabClean)}${school.kodePos ? ` Kode Pos ${school.kodePos}` : ''}`;

  // 5. Baris 5: Kontak Resmi Sesuai Contoh Gambar:
  // Telepon ☎ : 082363206533 E-mail : sdn2pulautiga@gmail.com
  const telp = school.telepon || '082363206533';
  const email = school.emailSekolah || 'sdn2pulautiga@gmail.com';
  const kontakPlainText = `Telepon ☎ : ${telp} E-mail : ${email}`;

  // LOGO KIRI: Lambang Pemerintah Kabupaten Aceh Tamiang
  const logoKiriSrc =
    school.logoKabupatenUrl ||
    school.logoUrl ||
    '/logo_aceh_tamiang.jpg' ||
    LOGO_ACEH_TAMIANG_B64;

  return (
    <div
      className={`relative w-full font-bookman select-none ${className}`}
      style={{
        paddingTop: `${topMargin}cm`, // Margin atas kira-kira 2 cm sesuai permintaan
        fontFamily: "'Bookman Old Style', 'URW Bookman', 'Bookman', 'Times New Roman', Times, 'TeX Gyre Bonum', serif",
      }}
    >
      {/* Header Container dengan Logo Kiri (Tinggi pas sampai garis bawah) dan Teks Center */}
      <div className="relative flex items-center justify-center min-h-[95px] sm:min-h-[105px] w-full">
        {/* LOGO KIRI: Lambang Kabupaten Aceh Tamiang Presisi */}
        <div className="absolute left-0 bottom-1 top-0 flex items-center justify-start z-10 pointer-events-none">
          <img
            src={logoKiriSrc}
            alt="Lambang Pemerintah Kabupaten"
            className="h-[88px] sm:h-[102px] w-auto max-w-[85px] sm:max-w-[98px] object-contain filter drop-shadow-xs"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = LOGO_ACEH_TAMIANG_B64;
            }}
          />
        </div>

        {/* KOLOM TENGAH: Teks Kop Surat Sesuai Aturan Standar Resmi Dinas - RATA TENGAH (CENTER) */}
        <div className="w-full text-center px-16 sm:px-24 z-10 flex flex-col items-center justify-center space-y-0.5">
          {/* 1. Nama Pemerintah Daerah: 12 - 14 pt, ALL CAPS, Reguler */}
          <AutoFitText
            text={pemdaText}
            basePt={13}
            minPt={7.5}
            tagName="h2"
            className="uppercase tracking-normal text-slate-900 font-normal m-0"
            style={{ fontWeight: 400 }}
          />

          {/* 2. Nama Dinas Pendidikan: 12 - 14 pt, ALL CAPS, Reguler (Sesuai Aturan: Tidak Tebal) */}
          <AutoFitText
            text={dinasText}
            basePt={13}
            minPt={7.5}
            tagName="h3"
            className="uppercase tracking-normal text-slate-900 font-normal m-0"
            style={{ fontWeight: 400 }}
          />

          {/* 3. Nama Satuan Pendidikan (Sekolah): 14 - 16 pt, ALL CAPS, Cetak Tebal (Bold) */}
          <AutoFitText
            text={sekolahText}
            basePt={15.5}
            minPt={8.5}
            tagName="h1"
            className="uppercase tracking-normal text-slate-950 font-bold m-0"
            style={{ fontWeight: 700 }}
          />

          {/* 4. Alamat Lengkap: 10 - 11 pt, Title Case, Reguler, tidak tebal */}
          <AutoFitText
            text={alamatFormatted}
            basePt={10.5}
            minPt={6.5}
            tagName="p"
            className="text-slate-800 font-normal m-0"
            style={{ fontWeight: 400 }}
          />

          {/* 5. Kontak Resmi: 10 - 11 pt, Title Case, Reguler, tidak tebal */}
          <AutoFitText
            text={kontakPlainText}
            basePt={10}
            minPt={6.5}
            tagName="p"
            className="text-slate-800 font-normal m-0"
            style={{ fontWeight: 400 }}
            renderChild={() => (
              <span>
                Telepon <span className="font-sans text-[1.1em]">☎</span> : {telp}&nbsp;&nbsp;&nbsp;E-mail :{' '}
                <span className="text-blue-700 underline font-normal">{email}</span>
              </span>
            )}
          />

          {subTitle && (
            <p className="text-slate-600 italic font-medium m-0 mt-0.5 text-[9.5pt] whitespace-nowrap">
              {subTitle}
            </p>
          )}
        </div>
      </div>

      {/* Garis Ganda Pemisah Kop Surat Sesuai Contoh Gambar: Garis Tebal Atas (2.8px), Garis Tipis Bawah (1px) */}
      <div className="mt-1 pt-0.5">
        <div className="w-full border-t-[2.8px] border-black" />
        <div className="w-full border-t-[1px] border-black mt-[1.5px]" />
      </div>

      {showBadges && (
        <div className="mt-2.5 flex flex-wrap justify-center items-center gap-2">
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            Kertas: {currentPaper === 'F4' ? 'F4 / Folio (8.5" × 13")' : 'A4 (210 × 297 mm)'}
          </span>
          <span className="text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
            Margin Atas: {topMargin} cm
          </span>
          <span className="text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-300 px-2 py-0.5 rounded-full">
            Format Resmi Aceh Tamiang (Center)
          </span>
        </div>
      )}
    </div>
  );
};

export default KopSurat;
