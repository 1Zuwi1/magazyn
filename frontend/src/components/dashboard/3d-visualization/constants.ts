export const VISUALIZATION_CONSTANTS = {
  LAYOUT: {
    rackOutlinePadding: 0.2,
    rackLayoutGap: 0.4,
    floorPadding: 0.6,
    floorOffset: 0.01,
    focusFloorPadding: 0.6,
    aisleExplodeOffset: 0.45,
    aisleSnap: 0.2,
    aislePadding: 0.5,
  },
  COLORS: {
    floor: "#111827",
    gridCell: "#1f2937",
    gridSection: "#334155",
    aisleLine: "#fbbf24",
    fog: "#0f172a",
    hover: "#60a5fa",
    selected: "#3b82f6",
  },
  OFFSETS: {
    imageZ: 0.01,
    glowZ: 0.008,
    stripeZ: 0.014,
  },
  SCALES: {
    image: 0.9,
    glow: 1.12,
  },
  OPACITY: {
    shelfHighlight: 0.35,
    aisleLine: 0.45,
  },
} as const
