const THEME = {
  // Colors
  colors: {
    bgDark: 0x050810,
    bgMid: 0x0a0e1a,
    bgPanel: 0x0f172a,
    bgPanelLight: 0x1e293b,
    bgGlass: 0x16213e,

    gold: 0xfbbf24,
    goldDark: 0xd97706,
    goldGlow: 0xfde68a,

    blue: 0x38bdf8,
    blueDark: 0x0284c7,

    green: 0x22c55e,
    greenDark: 0x16a34a,

    red: 0xef4444,
    redDark: 0xdc2626,

    purple: 0xa855f7,
    purpleDark: 0x7e22ce,

    orange: 0xf97316,

    text: 0xe5e7eb,
    textMuted: 0x94a3b8,
    textDim: 0x64748b,

    border: 0x1e293b,
    borderLight: 0x334155,
  },

  // Fonts
  fonts: {
    body: "'Inter', Arial, sans-serif",
    title: "'Orbitron', Arial, sans-serif",
  },

  // Sizes (dalam px, akan di-scale)
  layout: {
    tileSize: 90,
    tileGap: 6,
    cardW: 120,
    cardH: 155,
    cardGap: 14,
    radius: 12,
    radiusSmall: 8,
  },

  // Hex to string (Phaser suka number, kadang butuh string)
  hex: (num) => "#" + num.toString(16).padStart(6, "0"),
  cssColor: (num) => "#" + num.toString(16).padStart(6, "0"),
};