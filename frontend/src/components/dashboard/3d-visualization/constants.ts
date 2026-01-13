import type { ItemStatus, ItemVisual } from "./types"

export const VISUALIZATION_CONSTANTS = {
  LOADING: {
    IMAGE_OPACITY: 0.45,
    GLOW_OPACITY_SCALE: 0.6,
    EMISSIVE_SCALE: 0.7,
  },
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

export type BlockStatusKey = ItemStatus | "empty"

export const BLOCK_EMPTY_VISUAL: ItemVisual = {
  color: "#1f2937",
  glow: "#0f172a",
  emissiveIntensity: 0.05,
}

export const BLOCK_OPACITY = 0.32
export const HOVER_COLOR = "#60a5fa"
export const HIGHLIGHT_OPACITY = 0.4
export const BLOCK_VISUAL_SCALE = 2
export const BLOCK_GAP_RATIO = 0.18
export const TOOLTIP_OFFSET = 0.45
export const CAMERA_KEYBOARD_STEP = 0.6
export const OVERVIEW_CAMERA_DISTANCE = 15
export const OVERVIEW_CAMERA_HEIGHT = 4
export const FOCUS_CAMERA_HEIGHT = 3
export const FOCUS_CAMERA_DISTANCE = 6

export const GLOW_SETTINGS: Record<
  ItemStatus,
  { glowOpacity: number; emissiveIntensity: number }
> = {
  normal: { glowOpacity: 0.05, emissiveIntensity: 0.12 },
  dangerous: { glowOpacity: 0.22, emissiveIntensity: 0.3 },
  expired: { glowOpacity: 0.14, emissiveIntensity: 0.2 },
  "expired-dangerous": { glowOpacity: 0.3, emissiveIntensity: 0.38 },
}
