/**
 * High-Precision PDF Document Generator for LPJ BOS Desktop
 * Faithfully matches the SPJ Budy Aceh Tamiang reference structure
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BkuTransaction, SchoolProfile, Pemasok } from '../types';
import { formatRupiah, terbilangRupiah, formatTanggalIndo, getHariDanTanggalLengkap } from '../utils/formatters';
import { LOGO_ACEH_TAMIANG_B64 } from '../assets/logoAcehTamiang';

export interface SpjPdfOptions {
  includeSuratPesanan: boolean;
  includeFaktur: boolean;
  includeBast: boolean;
  includeKuitansi: boolean;
  includeFoto: boolean;
  useElectronicSignature?: boolean;
  includeStempel?: boolean;
  paperSize?: 'A4' | 'F4'; // 'A4' (210 x 297 mm) atau 'F4' (8.5" x 13" / 215.9 x 330.2 mm)
  marginTopCm?: number; // Margin atas dalam cm (default 2 cm = 20 mm)
}

function drawSignatureImage(doc: jsPDF, dataUrl: string | undefined, x: number, y: number, w: number, h: number) {
  if (!dataUrl) return;
  try {
    if (dataUrl.startsWith('data:image/svg+xml')) {
      // Vector stroke simulation in jsPDF if raw SVG is passed
      doc.setDrawColor(11, 37, 69);
      doc.setLineWidth(0.4);
      const startX = x + 3;
      const startY = y + h * 0.65;
      doc.lines([[6, -7], [5, 6], [8, -8], [9, 7], [7, -4]], startX, startY);
      doc.setLineWidth(0.2);
      doc.line(startX + 1, startY + 4, startX + 26, startY + 2);
      return;
    }
    const format = dataUrl.includes('image/png') ? 'PNG' : dataUrl.includes('image/jpeg') ? 'JPEG' : 'PNG';
    doc.addImage(dataUrl, format, x, y, w, h);
  } catch (e) {
    // safely ignore any rendering errors
  }
}

export function generateSpjPdf(
  tx: BkuTransaction,
  school: SchoolProfile,
  pemasok?: Pemasok,
  options: SpjPdfOptions = {
    includeSuratPesanan: true,
    includeFaktur: true,
    includeBast: true,
    includeKuitansi: true,
    includeFoto: true,
    useElectronicSignature: true,
  }
): jsPDF {
  const selectedPaper = options.paperSize || school.ukuranKertas || 'A4';
  const isF4 = selectedPaper === 'F4';
  const pageWidth = isF4 ? 215.9 : 210;
  const pageHeight = isF4 ? 330.2 : 297;
  const pageFormat: [number, number] | 'a4' = isF4 ? [215.9, 330.2] : 'a4';

  // Format kertas: A4 (210 x 297 mm) atau F4 / Folio 8.5" x 13" (215.9 x 330.2 mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: pageFormat,
  });

  doc.setProperties({
    title: `SPJ BOS ${school.namaSekolah} - ${tx.nomorBukti}`,
    subject: 'Laporan Pertanggungjawaban BOS (Standar Tipografi Bookman Old Style)',
    author: school.namaBendahara,
    keywords: 'LPJ, BOS, SPJ, Bookman Old Style, BKU, BAST, Faktur, Kuitansi',
    creator: 'LPJ BOS Desktop Windows (.EXE)',
  });

  const items = tx.items && tx.items.length > 0 ? tx.items : [
    {
      id: 'default-1',
      transaksiId: tx.id,
      namaBarang: tx.uraian,
      banyaknya: 1,
      satuan: 'Paket',
      hargaSatuan: tx.nominal,
      jumlahHarga: tx.nominal,
    }
  ];

  const vendorName = pemasok?.namaPemilik || tx.pihakTerkait.split('(')[0].trim() || 'ROMA DANI';
  const vendorStore = pemasok?.namaToko || (tx.pihakTerkait.includes('(') ? tx.pihakTerkait.split('(')[1].replace(')', '').trim() : 'IZZI Fotocopy');
  const vendorAddress = pemasok?.alamat || 'Harum Sari';
  const vendorTtd = pemasok?.ttdRekanan || school.ttdBendahara;

  let isFirstPage = true;

  // 1. SURAT PESANAN BARANG
  if (options.includeSuratPesanan) {
    if (!isFirstPage) doc.addPage();
    isFirstPage = false;

    // KOP SURAT RESMI STANDAR DINAS KABUPATEN ACEH TAMIANG
    // Margin atas kira-kira 2 cm (20 mm)
    const marginTop = (options.marginTopCm ?? school.marginTopCm ?? 2) * 10;
    const centerX = pageWidth / 2;
    const rightMargin = pageWidth - 20;

    // Lambang Pemerintah Daerah / Kabupaten Aceh Tamiang (Presisi di sebelah kiri: X=20, Y=marginTop, W=23.5, H=28)
    try {
      const logoKabToUse = (school.logoKabupatenUrl && school.logoKabupatenUrl.startsWith('data:image/')) 
        ? school.logoKabupatenUrl 
        : ((school.logoUrl && school.logoUrl.startsWith('data:image/')) ? school.logoUrl : LOGO_ACEH_TAMIANG_B64);
      if (logoKabToUse.startsWith('data:image/svg+xml')) {
        doc.addImage(logoKabToUse, 'SVG', 20, marginTop, 23.5, 28);
      } else {
        doc.addImage(logoKabToUse, 'JPEG', 20, marginTop, 23.5, 28);
      }
    } catch (e) {
      console.warn('Gagal memuat logo kabupaten kop surat di PDF:', e);
    }

    // Helper untuk menulis teks persis SATU BARIS di tengah (CENTER), mengecilkan ukuran jika teks terlalu panjang
    const drawSingleLineCenter = (
      text: string,
      y: number,
      initialPt: number,
      fontStyle: 'normal' | 'bold' = 'normal',
      maxAllowedWidth: number = 135,
      minPt: number = 6.5
    ) => {
      doc.setFont('times', fontStyle);
      let currentPt = initialPt;
      doc.setFontSize(currentPt);
      while (doc.getTextWidth(text) > maxAllowedWidth && currentPt > minPt) {
        currentPt -= 0.25;
        doc.setFontSize(currentPt);
      }
      doc.text(text, centerX, y, { align: 'center' });
    };

    const kabUpper = school.kabupaten ? school.kabupaten.toUpperCase() : 'KABUPATEN ACEH TAMIANG';
    const pemkabText = school.namaPemda 
      ? school.namaPemda.toUpperCase()
      : (kabUpper.startsWith('KABUPATEN') || kabUpper.startsWith('KOTA') 
          ? `PEMERINTAH ${kabUpper}` 
          : `PEMERINTAH KABUPATEN ${kabUpper}`);

    const dinasText = school.namaDinas 
      ? school.namaDinas.toUpperCase() 
      : 'DINAS PENDIDIKAN DAN KEBUDAYAAN';

    const namaSekolahText = school.namaSekolah ? school.namaSekolah.toUpperCase() : 'SD NEGERI 2 PULAU TIGA';

    // 1. Nama Pemerintah Daerah: 12 - 14 pt, ALL CAPS, Reguler (Tepat 1 Baris)
    drawSingleLineCenter(pemkabText, marginTop + 4.5, 13, 'normal', 135);

    // 2. Nama Dinas Pendidikan: 12 - 14 pt, ALL CAPS, Reguler (Tepat 1 Baris, Tidak Tebal)
    drawSingleLineCenter(dinasText, marginTop + 10.5, 13, 'normal', 135);

    // 3. Nama Satuan Pendidikan (Sekolah): 14 - 16 pt, ALL CAPS, Cetak Tebal (Bold) (Tepat 1 Baris)
    drawSingleLineCenter(namaSekolahText, marginTop + 17.5, 15.5, 'bold', 135);

    // 4. Alamat Lengkap: 10 - 11 pt, Title Case, Reguler, tidak tebal (Tepat 1 Baris)
    const toTitleCase = (str: string) => {
      if (!str) return '';
      return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    };
    const kecClean = school.kecamatan ? school.kecamatan.replace(/^Kecamatan\s+/i, '') : 'Tamiang Hulu';
    const kabClean = school.kabupaten ? school.kabupaten.replace(/^Kabupaten\s+/i, '') : 'Aceh Tamiang';
    const cleanAlamat = school.alamat ? school.alamat.replace(/^(Dsn\.|Dusun|Jln\.|Jalan)\s+/i, '') : 'Alur Jambu';
    const alamatLengkap = `Jln. ${toTitleCase(cleanAlamat)}, Kec.${toTitleCase(kecClean)}, Kab. ${toTitleCase(kabClean)}${school.kodePos ? ` Kode Pos ${school.kodePos}` : ''}`;
    
    drawSingleLineCenter(alamatLengkap, marginTop + 23, 10.5, 'normal', 140);

    // 5. Kontak Resmi: 10 - 11 pt, Title Case, Reguler, tidak tebal (Tepat 1 Baris)
    const telp = school.telepon || '082363206533';
    const email = school.emailSekolah || 'sdn2pulautiga@gmail.com';
    const kontakResmi = `Telepon : ${telp}   E-mail : ${email}`;
    drawSingleLineCenter(kontakResmi, marginTop + 28, 10, 'normal', 140);

    // Double line divider resmi (Garis tebal atas 0.8mm, Garis tipis bawah 0.25mm)
    const dividerY = marginTop + 31.5;
    doc.setLineWidth(0.8);
    doc.line(20, dividerY, rightMargin, dividerY);
    doc.setLineWidth(0.25);
    doc.line(20, dividerY + 1.1, rightMargin, dividerY + 1.1);

    // Date & Destination Right aligned
    doc.setFontSize(10);
    const dateFormatted = formatTanggalIndo(tx.tanggal);
    const bodyStartY = dividerY + 6.5;
    const destX = rightMargin - 55;
    doc.text(`Pulau Tiga, ${dateFormatted}`, destX, bodyStartY);
    doc.text('Kepala Yth :', destX, bodyStartY + 5);
    doc.setFont('times', 'bold');
    doc.text(vendorName.toUpperCase(), destX, bodyStartY + 10);
    doc.setFont('times', 'normal');
    doc.text(vendorStore, destX, bodyStartY + 15);
    doc.text('Di', destX, bodyStartY + 20);
    doc.text(`    ${vendorAddress}`, destX, bodyStartY + 25);

    // Left metadata
    doc.text(`Nomor     : ${tx.nomorBukti}`, 20, bodyStartY + 5);
    doc.text('Lamp       : 1 Lembar', 20, bodyStartY + 11);
    doc.setFont('times', 'bolditalic');
    doc.text('Hal           : Pesanan Barang', 20, bodyStartY + 17);
    doc.setFont('times', 'normal');

    // Body
    doc.text('Dengan Hormat,', 20, bodyStartY + 35);
    const splitBody = doc.splitTextToSize(
      `Dengan ini kami minta bantuan saudara agar dapat menyediakan pengadaan ${tx.uraian} untuk kebutuhan ${school.namaSekolah} ${school.kecamatan} ${school.kabupaten} sebagai berikut :`,
      pageWidth - 40
    );
    doc.text(splitBody, 20, bodyStartY + 41);

    // Table of Items
    const startY = 106;
    const tableData = items.map((it, idx) => [
      (idx + 1).toString(),
      it.namaBarang,
      `${it.banyaknya} ${it.satuan}`,
    ]);

    // Fill blank aesthetic rows if items < 8
    for (let i = items.length; i < 7; i++) {
      tableData.push(['', '', '']);
    }

    autoTable(doc, {
      startY: startY,
      margin: { left: 20, right: 20 },
      head: [['No', 'Nama Barang', 'Banyaknya']],
      body: tableData,
      theme: 'plain',
      styles: {
        font: 'times',
        fontSize: 9.5,
        cellPadding: 2.2,
        lineColor: [0, 0, 0],
        lineWidth: 0.25,
      },
      headStyles: {
        fontStyle: 'bold',
        halign: 'center',
        fillColor: [245, 245, 245],
        lineColor: [0, 0, 0],
        lineWidth: 0.35,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { halign: 'left', cellWidth: 105 },
        2: { halign: 'center', cellWidth: 50 },
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 14;
    doc.text('Demikian pesanan ini kami sampaikan agar dapat saudara penuhi. Terima Kasih', 20, finalY);

    // Signature
    const sigY = finalY + 16;
    doc.text(`Kepala ${school.namaSekolah}`, 125, sigY);

    if (options.useElectronicSignature) {
      if (options.includeStempel !== false && school.stempelSekolah) {
        drawSignatureImage(doc, school.stempelSekolah, 112, sigY + 1, 24, 24);
      }
      if (school.ttdKepalaSekolah) {
        drawSignatureImage(doc, school.ttdKepalaSekolah, 125, sigY + 3, 40, 18);
      }
    }

    doc.setFont('times', 'bold');
    doc.text(school.namaKepalaSekolah, 125, sigY + 24);
    doc.setLineWidth(0.3);
    doc.line(125, sigY + 25, 125 + doc.getTextWidth(school.namaKepalaSekolah), sigY + 25);
    doc.setFont('times', 'normal');
    doc.text(`NIP. ${school.nipKepalaSekolah}`, 125, sigY + 29);
  }

  // 2. BON / FAKTUR TOKO
  if (options.includeFaktur) {
    if (!isFirstPage) doc.addPage();
    isFirstPage = false;

    // Header Right
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.text(`${vendorAddress} ${formatTanggalIndo(tx.tanggal)}`, 130, 24);
    doc.text('Kepada :', 130, 30);
    doc.text(`Kepala ${school.namaSekolah}`, 130, 35);
    doc.text('di', 130, 40);
    doc.text('     Tempat', 130, 45);

    // Title
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('BON / FAKTUR No................................', 105, 58, { align: 'center' });

    // Table
    const fakturTable = items.map((it) => [
      `${it.banyaknya} ${it.satuan}`,
      it.namaBarang,
      formatRupiah(it.hargaSatuan).replace('Rp', '').trim(),
      formatRupiah(it.jumlahHarga).replace('Rp', '').trim(),
    ]);

    // Extra empty rows
    for (let i = items.length; i < 9; i++) {
      fakturTable.push(['', '', '', '']);
    }

    autoTable(doc, {
      startY: 65,
      margin: { left: 20, right: 20 },
      head: [['Banyaknya', 'Nama Barang', '@ ( Rp )', 'Jumlah Harga\n(Rp)']],
      body: fakturTable,
      foot: [['', 'Jumlah', '', formatRupiah(tx.nominal).replace('Rp', '').trim()]],
      theme: 'plain',
      styles: {
        font: 'times',
        fontSize: 9.5,
        cellPadding: 2.2,
        lineColor: [0, 0, 0],
        lineWidth: 0.25,
      },
      headStyles: {
        fontStyle: 'bold',
        halign: 'center',
        lineColor: [0, 0, 0],
        lineWidth: 0.35,
      },
      footStyles: {
        fontStyle: 'bold',
        halign: 'right',
        lineColor: [0, 0, 0],
        lineWidth: 0.35,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 35 },
        1: { halign: 'left', cellWidth: 75 },
        2: { halign: 'right', cellWidth: 30 },
        3: { halign: 'right', cellWidth: 30 },
      },
    });

    const fY = (doc as any).lastAutoTable.finalY + 10;
    // Box "Barang-barang yang sudah dibeli tidak dapat dikembalikan"
    doc.setFont('times', 'normal');
    doc.setFontSize(8.5);
    doc.rect(20, fY, 70, 16);
    doc.text('Barang-barang yang sudah dibeli tidak', 24, fY + 6);
    doc.text('dapat dikembalikan', 24, fY + 11);

    // Tanda Terima
    doc.setFontSize(10);
    doc.text('Tanda Terima', 140, fY + 6);

    if (options.useElectronicSignature) {
      if (options.includeStempel !== false && pemasok?.stempelToko) {
        drawSignatureImage(doc, pemasok.stempelToko, 126, fY + 6, 22, 22);
      }
      if (vendorTtd) {
        drawSignatureImage(doc, vendorTtd, 140, fY + 8, 40, 18);
      }
    }

    doc.setFont('times', 'bold');
    doc.text(vendorName.toUpperCase(), 140, fY + 28);
    doc.setLineWidth(0.3);
    doc.line(140, fY + 29, 140 + doc.getTextWidth(vendorName.toUpperCase()), fY + 29);
  }

  // 3. SURAT BERITA ACARA SERAH TERIMA BARANG (BAST)
  if (options.includeBast) {
    if (!isFirstPage) doc.addPage();
    isFirstPage = false;

    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.text('SURAT BERITA ACARA SERAH TERIMA BARANG', 105, 20, { align: 'center' });
    doc.setLineWidth(0.3);
    doc.line(45, 21.5, 165, 21.5);

    const { hari, terbilangTanggal, bulan, tahun } = getHariDanTanggalLengkap(tx.tanggal);
    doc.setFont('times', 'normal');
    const opening = `Pada hari ini ${hari} Tanggal ${terbilangTanggal} Bulan ${bulan} Tahun ${tahun} ${school.namaSekolah}. Kami yang bertanda tangan dibawah ini :`;
    doc.text(doc.splitTextToSize(opening, 170), 20, 29);

    // Parties
    const p1Y = 38;
    doc.text('Nama', 28, p1Y);
    doc.text(`: ${vendorName.toUpperCase()}`, 65, p1Y);
    doc.text('Pekerjaan', 28, p1Y + 5);
    doc.text(`: ${vendorStore}`, 65, p1Y + 5);
    doc.text('Alamat', 28, p1Y + 10);
    doc.text(`: ${vendorAddress}`, 65, p1Y + 10);
    doc.text('Selanjutnya disebut', 28, p1Y + 15);
    doc.setFont('times', 'bold');
    doc.text(': PIHAK PERTAMA ( I )', 65, p1Y + 15);
    doc.setFont('times', 'normal');

    const p2Y = p1Y + 22;
    doc.text('Nama', 28, p2Y);
    doc.setFont('times', 'bold');
    doc.text(`: ${school.namaPengurusBarang}`, 65, p2Y);
    doc.setFont('times', 'normal');
    doc.text('Jabatan', 28, p2Y + 5);
    doc.text(': Pengurus Barang', 65, p2Y + 5);
    doc.text('Alamat', 28, p2Y + 10);
    doc.text(`: ${school.alamat}`, 65, p2Y + 10);
    doc.text('Selanjutnya disebut', 28, p2Y + 15);
    doc.setFont('times', 'bold');
    doc.text(': PIHAK KEDUA ( II )', 65, p2Y + 15);
    doc.setFont('times', 'normal');

    // Pasal 1
    const pSalY = p2Y + 23;
    doc.setFont('times', 'bold');
    doc.text('Pasal ( 1 )', 20, pSalY);
    doc.setFont('times', 'normal');
    const p1Text = `1. PIHAK PERTAMA telah menyerahkan kepada PIHAK KEDUA dan PIHAK KEDUA telah menerima dari PIHAK PERTAMA bertempat di ${school.namaSekolah} ${school.kecamatan} ${school.kabupaten}, berupa pembayaran lunas pengadaan ${tx.uraian} berdasarkan surat pesanan Nomor : ${tx.nomorBukti}`;
    doc.text(doc.splitTextToSize(p1Text, 170), 20, pSalY + 5);

    const p2Text = `2. PIHAK KEDUA telah menerima barang-barang sebagaimana dimaksud pada poin 1 diatas dengan baik, lengkap, cukup dan sempurna dengan jumlah /ketentuan sebagai berikut :`;
    doc.text(doc.splitTextToSize(p2Text, 170), 20, pSalY + 20);

    // Mini Table of items in BAST
    const bastRows = items.map((it) => [
      `${it.banyaknya} ${it.satuan}`,
      it.namaBarang,
    ]);

    autoTable(doc, {
      startY: pSalY + 28,
      margin: { left: 35, right: 35 },
      body: bastRows,
      theme: 'plain',
      styles: {
        font: 'times',
        fontSize: 9,
        cellPadding: 1.8,
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 40 },
        1: { halign: 'left', cellWidth: 100 },
      },
    });

    // Pasal 2
    const p2StartY = (doc as any).lastAutoTable.finalY + 6;
    doc.setFont('times', 'bold');
    doc.text('Pasal ( 2 )', 20, p2StartY);
    doc.setFont('times', 'normal');
    const pasal2Text = '1. Terhitung mulai tanggal penyerahan barang ini PIHAK PERTAMA telah bebas dari segala tanggung jawab atas pelaksanaan barang tersebut.\n\nDemikian Berita Acara serah terima barang ini kami perbuat dengan sebenar-benarnya untuk dipergunakan sebagaimana mestinya.';
    doc.text(doc.splitTextToSize(pasal2Text, 170), 20, p2StartY + 5);

    // 3 Signatures
    const sigBastY = p2StartY + 26;
    doc.text(`${vendorAddress} ${formatTanggalIndo(tx.tanggal)}`, 130, sigBastY);
    doc.text('Yang menerima', 25, sigBastY + 5);
    doc.text('PIHAK KEDUA', 25, sigBastY + 9);

    doc.text('PIHAK PERTAMA', 130, sigBastY + 5);
    doc.text('Yang Menyerahkan', 130, sigBastY + 9);

    if (options.useElectronicSignature) {
      if (school.ttdPengurusBarang) drawSignatureImage(doc, school.ttdPengurusBarang, 25, sigBastY + 11, 40, 16);
      if (options.includeStempel !== false && pemasok?.stempelToko) drawSignatureImage(doc, pemasok.stempelToko, 116, sigBastY + 9, 20, 20);
      if (vendorTtd) drawSignatureImage(doc, vendorTtd, 130, sigBastY + 11, 40, 16);
    }

    // Signature names
    doc.setFont('times', 'bold');
    doc.text(school.namaPengurusBarang, 25, sigBastY + 28);
    doc.setLineWidth(0.3);
    doc.line(25, sigBastY + 29, 25 + doc.getTextWidth(school.namaPengurusBarang), sigBastY + 29);
    doc.setFont('times', 'normal');
    doc.text(`NIP. ${school.nipPengurusBarang}`, 25, sigBastY + 33);

    doc.setFont('times', 'bold');
    doc.text(vendorName.toUpperCase(), 130, sigBastY + 28);
    doc.setLineWidth(0.3);
    doc.line(130, sigBastY + 29, 130 + doc.getTextWidth(vendorName.toUpperCase()), sigBastY + 29);
    doc.setFont('times', 'normal');

    // Mengetahui
    doc.text('Mengetahui :', 85, sigBastY + 36, { align: 'center' });
    doc.text(`Kepala ${school.namaSekolah}`, 85, sigBastY + 41, { align: 'center' });

    if (options.useElectronicSignature) {
      if (options.includeStempel !== false && school.stempelSekolah) {
        drawSignatureImage(doc, school.stempelSekolah, 66, sigBastY + 40, 22, 22);
      }
      if (school.ttdKepalaSekolah) {
        drawSignatureImage(doc, school.ttdKepalaSekolah, 75, sigBastY + 42, 38, 15);
      }
    }

    doc.setFont('times', 'bold');
    doc.text(school.namaKepalaSekolah, 85, sigBastY + 58, { align: 'center' });
    doc.line(55, sigBastY + 59, 115, sigBastY + 59);
    doc.setFont('times', 'normal');
    doc.text(`NIP. ${school.nipKepalaSekolah}`, 85, sigBastY + 63, { align: 'center' });
  }

  // 4. TANDA PENERIMAAN (KUITANSI)
  if (options.includeKuitansi) {
    if (!isFirstPage) doc.addPage();
    isFirstPage = false;

    // Header Right
    doc.setFont('times', 'normal');
    doc.setFontSize(9.5);
    doc.text(`No          : ${tx.nomorBukti}`, 20, 20);
    doc.text(`Kode Rek.: ${tx.kodeRekening || '5.1.02.02'}`, 20, 25);
    const yr = new Date(tx.tanggal).getFullYear();
    doc.text(`Tahun     : ${yr}`, 20, 30);

    // Checklist marks
    doc.text('Asli', 155, 20);
    doc.text('Kedua', 155, 25);
    doc.text('Ketiga', 155, 30);
    doc.text('Keempat', 155, 35);
    doc.rect(151, 17, 3, 3);
    doc.text('✓', 151.3, 19.5);
    doc.rect(151, 22, 3, 3);
    doc.rect(151, 27, 3, 3);
    doc.rect(151, 32, 3, 3);

    // Title
    doc.setFont('times', 'bold');
    doc.setFontSize(12);
    doc.text('TANDA PENERIMAAN', 105, 43, { align: 'center' });
    doc.setLineWidth(0.3);
    doc.line(75, 44.5, 135, 44.5);

    // Fields
    doc.setFont('times', 'normal');
    doc.setFontSize(9.5);
    const kY = 52;
    doc.text('Terima dari', 20, kY);
    doc.text(`:  Bendahara ${school.namaSekolah}`, 48, kY);

    doc.text('Banyaknya', 20, kY + 7);
    doc.setFont('times', 'bolditalic');
    const terbilangStr = terbilangRupiah(tx.nominal);
    doc.text(`:  ${terbilangStr}`, 48, kY + 7);
    doc.setFont('times', 'normal');

    doc.text('Yaitu untuk', 20, kY + 14);
    const uraianLines = doc.splitTextToSize(
      `:  ${tx.uraian}`,
      140
    );
    doc.text(uraianLines, 48, kY + 14);

    // Terbilang box (Nominal Rupiah)
    const boxY = kY + 28;
    doc.setLineWidth(0.4);
    doc.rect(20, boxY, 65, 10);
    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.text(`Terbilang : ${formatRupiah(tx.nominal)}`, 24, boxY + 7);

    // 4 Signatures Grid matching the Aceh Tamiang PDF
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    const sig1Y = boxY + 18;

    // Col 1 Top: Kepala Sekolah
    doc.text('Setuju dibayar', 20, sig1Y);
    doc.text(`Kepala ${school.namaSekolah}`, 20, sig1Y + 5);

    if (options.useElectronicSignature) {
      if (options.includeStempel !== false && school.stempelSekolah) {
        drawSignatureImage(doc, school.stempelSekolah, 8, sig1Y + 5, 20, 20);
      }
      if (school.ttdKepalaSekolah) {
        drawSignatureImage(doc, school.ttdKepalaSekolah, 20, sig1Y + 7, 40, 16);
      }
    }

    doc.setFont('times', 'bold');
    doc.text(school.namaKepalaSekolah, 20, sig1Y + 24);
    doc.setLineWidth(0.2);
    doc.line(20, sig1Y + 25, 20 + doc.getTextWidth(school.namaKepalaSekolah), sig1Y + 25);
    doc.setFont('times', 'normal');
    doc.text(`NIP. ${school.nipKepalaSekolah}`, 20, sig1Y + 29);

    // Col 2 Top: Yang Menerima
    doc.text(`${vendorAddress} ${formatTanggalIndo(tx.tanggal)}`, 120, sig1Y);
    doc.text('Yang Menerima', 120, sig1Y + 5);
    doc.text(`Nama         : ${vendorName.toUpperCase()}`, 120, sig1Y + 14);
    doc.text(`Pekerjaan   : ${vendorStore}`, 120, sig1Y + 19);
    doc.text(`Alamat       : ${vendorAddress}`, 120, sig1Y + 24);

    if (options.useElectronicSignature) {
      if (options.includeStempel !== false && pemasok?.stempelToko) {
        drawSignatureImage(doc, pemasok.stempelToko, 108, sig1Y + 16, 20, 20);
      }
      if (vendorTtd) {
        drawSignatureImage(doc, vendorTtd, 120, sig1Y + 18, 40, 15);
      }
    }

    doc.setFont('times', 'bold');
    doc.text(vendorName.toUpperCase(), 120, sig1Y + 34);
    doc.line(120, sig1Y + 35, 120 + doc.getTextWidth(vendorName.toUpperCase()), sig1Y + 35);
    doc.setFont('times', 'normal');

    // Bottom signatures
    const sig2Y = sig1Y + 44;
    // Col 1 Bottom: Pengurus Barang
    doc.text(`Barang-barang pekerjaan yang dimaksud telah`, 20, sig2Y);
    doc.text(`Diterima/diselenggara ${formatTanggalIndo(tx.tanggal)}`, 20, sig2Y + 4);
    doc.text('Pengurus Barang', 20, sig2Y + 10);
    doc.text(school.namaSekolah, 20, sig2Y + 14);

    if (options.useElectronicSignature && school.ttdPengurusBarang) {
      drawSignatureImage(doc, school.ttdPengurusBarang, 20, sig2Y + 15, 40, 16);
    }

    doc.setFont('times', 'bold');
    doc.text(school.namaPengurusBarang, 20, sig2Y + 32);
    doc.line(20, sig2Y + 33, 20 + doc.getTextWidth(school.namaPengurusBarang), sig2Y + 33);
    doc.setFont('times', 'normal');
    doc.text(`NIP. ${school.nipPengurusBarang}`, 20, sig2Y + 37);

    // Col 2 Bottom: Bendahara
    doc.text(`Lunas dibayar, ${formatTanggalIndo(tx.tanggal)}`, 120, sig2Y);
    doc.text('Bendaharawan', 120, sig2Y + 5);
    doc.text(school.namaSekolah, 120, sig2Y + 9);

    if (options.useElectronicSignature && school.ttdBendahara) {
      drawSignatureImage(doc, school.ttdBendahara, 120, sig2Y + 15, 40, 16);
    }

    doc.setFont('times', 'bold');
    doc.text(school.namaBendahara, 120, sig2Y + 32);
    doc.line(120, sig2Y + 33, 120 + doc.getTextWidth(school.namaBendahara), sig2Y + 33);
    doc.setFont('times', 'normal');
    doc.text(`NIP. ${school.nipBendahara}`, 120, sig2Y + 37);
  }

  // 5. LAMPIRAN FOTO DOKUMENTASI BARANG
  if (options.includeFoto && tx.fotoBarang && tx.fotoBarang.length > 0) {
    if (!isFirstPage) doc.addPage();

    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.text('LAMPIRAN DOKUMENTASI FISIK BELANJA BARANG / JASA', 105, 18, { align: 'center' });
    doc.setFontSize(9.5);
    doc.text(`SUMBER DANA : ${tx.sumberDana.toUpperCase()} - ${school.namaSekolah.toUpperCase()}`, 105, 23, { align: 'center' });
    doc.setLineWidth(0.3);
    doc.line(20, 26, 190, 26);

    doc.setFont('times', 'normal');
    doc.text(`Nomor Bukti : ${tx.nomorBukti}    |    Tanggal : ${formatTanggalIndo(tx.tanggal)}    |    Total : ${formatRupiah(tx.nominal)}`, 20, 32);

    let curY = 38;
    tx.fotoBarang.forEach((foto, index) => {
      if (curY > 210) {
        doc.addPage();
        curY = 25;
      }

      doc.setLineWidth(0.2);
      doc.rect(20, curY, 170, 78);

      try {
        if (foto.dataUrl.startsWith('data:image/')) {
          doc.addImage(foto.dataUrl, 'JPEG', 24, curY + 4, 90, 70);
        } else {
          doc.rect(24, curY + 4, 90, 70);
          doc.text('Foto Barang Terlampir', 69, curY + 39, { align: 'center' });
        }
      } catch (e) {
        doc.rect(24, curY + 4, 90, 70);
        doc.text('Preview Foto Barang', 69, curY + 39, { align: 'center' });
      }

      // Metadata photo panel
      doc.setFont('times', 'bold');
      doc.text(`Foto Dokumentasi #${index + 1}`, 120, curY + 12);
      doc.setFont('times', 'normal');
      doc.setFontSize(8.5);
      doc.text(`File: ${foto.namaFile}`, 120, curY + 18);
      doc.text(`Waktu Unggah: ${foto.diunggahPada}`, 120, curY + 24);
      doc.text('Keterangan / Kondisi :', 120, curY + 32);
      const ketLines = doc.splitTextToSize(foto.keterangan || 'Barang diterima dalam kondisi baru, baik, dan sesuai spesifikasi pesanan.', 65);
      doc.text(ketLines, 120, curY + 38);

      doc.setFont('times', 'italic');
      doc.text(`Diperiksa oleh: Pengurus Barang`, 120, curY + 68);

      curY += 84;
    });
  }

  return doc;
}
