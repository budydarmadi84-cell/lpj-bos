/**
 * Electronic Signature & Stamp Utilities
 * Generates transparent PNG signatures, digital QR certificates, and official stamps.
 */

export function createSignaturePng(
  name: string,
  inkColor: string = '#0B2545'
): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = 100;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Transparent background
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = inkColor;
  ctx.lineWidth = 2.8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Draw natural cursive signature strokes
  ctx.beginPath();
  ctx.moveTo(35, 65);
  ctx.bezierCurveTo(45, 20, 65, 25, 75, 55);
  ctx.bezierCurveTo(85, 80, 105, 30, 125, 45);
  ctx.bezierCurveTo(145, 60, 160, 25, 185, 40);
  ctx.bezierCurveTo(210, 55, 225, 35, 250, 48);
  ctx.stroke();

  // Underline flair
  ctx.beginPath();
  ctx.lineWidth = 2.0;
  ctx.moveTo(40, 75);
  ctx.bezierCurveTo(100, 70, 180, 85, 260, 68);
  ctx.stroke();

  // Accent dot
  ctx.fillStyle = inkColor;
  ctx.beginPath();
  ctx.arc(268, 62, 2.5, 0, Math.PI * 2);
  ctx.fill();

  return canvas.toDataURL('image/png');
}

export function createSchoolStampPng(
  schoolName: string,
  district: string = 'ACEH TAMIANG'
): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const stampColor = 'rgba(126, 34, 206, 0.75)'; // Soft purple stamp
  ctx.strokeStyle = stampColor;
  ctx.fillStyle = stampColor;

  // Outer dashed circle
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(80, 80, 72, 0, Math.PI * 2);
  ctx.stroke();

  // Inner solid circle
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(80, 80, 64, 0, Math.PI * 2);
  ctx.stroke();

  // Center stars / lines
  ctx.beginPath();
  ctx.moveTo(30, 80);
  ctx.lineTo(130, 80);
  ctx.stroke();

  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(schoolName.toUpperCase().slice(0, 22), 80, 60);

  ctx.font = 'bold 8px sans-serif';
  ctx.fillText('DANA BOS', 80, 74);

  ctx.font = 'bold 8px sans-serif';
  ctx.fillText(district.toUpperCase().slice(0, 22), 80, 100);

  return canvas.toDataURL('image/png');
}

export function createVendorStampPng(
  storeName: string,
  ownerName: string
): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const stampColor = 'rgba(2, 132, 199, 0.8)'; // Cyan/Blue vendor stamp
  ctx.strokeStyle = stampColor;
  ctx.fillStyle = stampColor;

  // Outer circle
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(80, 80, 70, 0, Math.PI * 2);
  ctx.stroke();

  // Inner circle
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(80, 80, 62, 0, Math.PI * 2);
  ctx.stroke();

  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(storeName.toUpperCase().slice(0, 20), 80, 60);

  ctx.font = 'bold 8px sans-serif';
  ctx.fillText('LUNAS / CAP REKANAN', 80, 80);

  ctx.font = 'bold 8px sans-serif';
  ctx.fillText(ownerName.toUpperCase().slice(0, 20), 80, 100);

  return canvas.toDataURL('image/png');
}
