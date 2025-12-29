import { create } from "zustand"
import type { FilterState, FocusWindow, ShelfPosition, ViewMode } from "./types"

interface WarehouseStore {
  mode: ViewMode
  selectedRackId: string | null
  hoveredShelf: ShelfPosition | null
  selectedShelf: ShelfPosition | null
  focusWindow: FocusWindow | null
  filters: FilterState
  setMode: (mode: ViewMode) => void
  focusRack: (rackId: string) => void
  selectShelf: (rackId: string, index: number, row: number, col: number) => void
  hoverShelf: (shelf: ShelfPosition | null) => void
  setFocusWindow: (window: FocusWindow | null) => void
  clearSelection: () => void
  setFilters: (filters: Partial<FilterState>) => void
  goToOverview: () => void
}

export const useWarehouseStore = create<WarehouseStore>((set) => ({
  mode: "overview",
  selectedRackId: null,
  hoveredShelf: null,
  selectedShelf: null,
  focusWindow: null,
  filters: {
    query: "",
  },
  setMode: (mode) => set({ mode }),
  focusRack: (rackId) => {
    set({ mode: "focus", selectedRackId: rackId, focusWindow: null })
    set({ selectedShelf: null })
  },
  selectShelf: (rackId, index, row, col) => {
    set({
      selectedShelf: {
        rackId,
        index,
        row,
        col,
      },
    })
  },
  hoverShelf: (shelf) => set({ hoveredShelf: shelf }),
  setFocusWindow: (window) =>
    set({
      focusWindow: window,
      selectedShelf: null,
      hoveredShelf: null,
    }),
  clearSelection: () => set({ selectedShelf: null }),
  setFilters: (newFilters) =>
    set((state) => ({ filters: { ...state.filters, ...newFilters } })),
  goToOverview: () =>
    set({
      mode: "overview",
      selectedRackId: null,
      selectedShelf: null,
      hoveredShelf: null,
      focusWindow: null,
    }),
}))
