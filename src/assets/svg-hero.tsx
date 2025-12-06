// SVG assets for Hero section exported from Figma

export const imgEllipse1 = (
  <svg viewBox="0 0 2238 298" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="1119" cy="149" rx="1119" ry="149" fill="url(#gradient1)" />
    <defs>
      <radialGradient id="gradient1">
        <stop offset="0%" stopColor="rgba(115,0,255,0.3)" />
        <stop offset="100%" stopColor="rgba(115,0,255,0)" />
      </radialGradient>
    </defs>
  </svg>
);

export const imgEllipse2 = (
  <svg viewBox="0 0 1967 310" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="983.5" cy="155" rx="983.5" ry="155" fill="url(#gradient2)" />
    <defs>
      <radialGradient id="gradient2">
        <stop offset="0%" stopColor="rgba(63,50,228,0.2)" />
        <stop offset="100%" stopColor="rgba(63,50,228,0)" />
      </radialGradient>
    </defs>
  </svg>
);

export const imgVector168 = (
  <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 0L12 6L6 12L5.17 11.17L9.41 6.93H0V5.07H9.41L5.17 0.83L6 0Z" fill="white"/>
  </svg>
);

export const imgMetricContainer = (
  <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="30" cy="30" r="28" stroke="rgba(115,0,255,0.5)" strokeWidth="2" fill="rgba(115,0,255,0.1)"/>
    <path d="M30 15L35 25L30 30L25 25L30 15Z" fill="white"/>
  </svg>
);

export const imgVector209 = (
  <svg viewBox="0 0 192 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 58C20 45 40 25 60 20C80 15 100 25 120 15C140 5 160 40 190 2" stroke="rgba(115,0,255,0.6)" strokeWidth="2" fill="none"/>
  </svg>
);

export const imgDropdownIcon = (
  <svg viewBox="0 0 13 9" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.5 9L0 0H13L6.5 9Z" fill="currentColor"/>
  </svg>
);

export const imgVector = (
  <svg viewBox="0 0 13 7" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.5 7L0 0H13L6.5 7Z" fill="white"/>
  </svg>
);

export const imgVector1 = (
  <svg viewBox="0 0 19 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 9H16M16 9L9.5 3M16 9L9.5 15" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const imgNexVisi = (
  <svg viewBox="0 0 79 15" fill="none"  xmlns="http://www.w3.org/2000/svg">
    <text x="0" y="12" fill="white" fontSize="14" fontWeight="bold" fontFamily="Poppins">NEXVISI</text>
  </svg>
);

export const imgVector210 = (
  <svg viewBox="0 0 1 29" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="0.5" y1="0" x2="0.5" y2="29" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
  </svg>
);

export const imgVector2 = (
  <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 0L14 7L7 14L6.17 13.17L10.41 8.93H0V5.07H10.41L6.17 0.83L7 0Z" fill="currentColor"/>
  </svg>
);

// Prism Cloud Logo - Geometric Prism Design
export const PrismCloudLogo = () => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Left triangle (blue) */}
    <path d="M4 20L12 4L12 20Z" fill="url(#prismGradient1)" />
    {/* Right triangle (purple) */}
    <path d="M12 4L20 20L12 20Z" fill="url(#prismGradient2)" />
    {/* Center highlight */}
    <circle cx="12" cy="12" r="2" fill="white" opacity="0.8" />
    <defs>
      <linearGradient id="prismGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6366f1" />
        <stop offset="100%" stopColor="#4f46e5" />
      </linearGradient>
      <linearGradient id="prismGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#a855f7" />
        <stop offset="100%" stopColor="#9333ea" />
      </linearGradient>
    </defs>
  </svg>
);
