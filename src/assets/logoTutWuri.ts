/**
 * Logo Tut Wuri Handayani (Kementerian Pendidikan dan Kebudayaan RI)
 * Digunakan sebagai logo standar sekolah (di sebelah kanan kop surat) jika belum diimpor secara khusus.
 */
export const LOGO_TUT_WURI_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <radialGradient id="tutWuriBg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#1e3a8a" />
      <stop offset="100%" stop-color="#0f172a" />
    </radialGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#eab308" />
      <stop offset="100%" stop-color="#ca8a04" />
    </linearGradient>
  </defs>
  <!-- Outer Pentagon / Perisai Segilima -->
  <polygon points="100,10 188,74 154,178 46,178 12,74" fill="#0284c7" stroke="#ffffff" stroke-width="4" stroke-linejoin="round"/>
  <polygon points="100,16 182,76 150,172 50,172 18,76" fill="#0369a1" stroke="#facc15" stroke-width="3" stroke-linejoin="round"/>
  
  <!-- Semboyan Lingkaran / Sayap -->
  <!-- Sayap Kiri dan Kanan Tut Wuri Handayani -->
  <path d="M100 95 C85 80, 50 85, 38 120 C52 118, 70 125, 80 135 C72 128, 55 130, 48 145 C62 140, 78 145, 90 152 L100 115" fill="url(#goldGrad)" opacity="0.95"/>
  <path d="M100 95 C115 80, 150 85, 162 120 C148 118, 130 125, 120 135 C128 128, 145 130, 152 145 C138 140, 122 145, 110 152 L100 115" fill="url(#goldGrad)" opacity="0.95"/>

  <!-- Belimbing / Nyala Api (Api Keabadian Pendidikan) -->
  <path d="M100 42 C92 56, 92 68, 100 78 C108 68, 108 56, 100 42 Z" fill="#ef4444"/>
  <path d="M100 48 C95 58, 96 66, 100 72 C104 66, 105 58, 100 48 Z" fill="#facc15"/>

  <!-- Buku Terbuka (Sumber Ilmu Pengetahuan) -->
  <path d="M100 132 C82 124, 60 126, 46 138 L48 145 C64 135, 84 134, 100 142 C116 134, 136 135, 152 145 L154 138 C140 126, 118 124, 100 132 Z" fill="#ffffff" stroke="#0f172a" stroke-width="1.5"/>

  <!-- Batang Obor / Tiang Pendidikan -->
  <path d="M96 74 L104 74 L102 118 L98 118 Z" fill="#ffffff"/>
  <circle cx="100" cy="115" r="4" fill="#f59e0b"/>

  <!-- Burung Gagak Perkasa / Garuda Pusat -->
  <circle cx="100" cy="92" r="7" fill="url(#goldGrad)"/>

  <!-- Teks Tut Wuri Handayani di Perisai -->
  <text x="100" y="166" font-family="Arial, sans-serif" font-size="8.5" font-weight="900" fill="#fef08a" text-anchor="middle" letter-spacing="1.2">TUT WURI HANDAYANI</text>
</svg>`;

export const LOGO_TUT_WURI_B64 = `data:image/svg+xml;utf8,${encodeURIComponent(LOGO_TUT_WURI_SVG)}`;
