import { create } from "zustand"
import type { FilterState, ShelfPosition, ViewMode } from "./types"

interface WarehouseStore {
  mode: ViewMode
  selectedRackId: string | null
  hoveredShelf: ShelfPosition | null
  selectedShelf: ShelfPosition | null
  filters: FilterState
  setMode: (mode: ViewMode) => void
  focusRack: (rackId: string) => void
  selectShelf: (rackId: string, index: number) => void
  hoverShelf: (shelf: ShelfPosition | null) => void
  clearSelection: () => void
  setFilters: (filters: Partial<FilterState>) => void
  goToOverview: () => void
}

export const useWarehouseStore = create<WarehouseStore>((set) => ({
  mode: "overview",
  selectedRackId: null,
  hoveredShelf: null,
  selectedShelf: null,
  filters: {
    query: "",
  },
  setMode: (mode) => set({ mode }),
  focusRack: (rackId) => set({ mode: "focus", selectedRackId: rackId }),
  selectShelf: (rackId, index) => {
    const cols = 10
    set({
      selectedShelf: {
        rackId,
        index,
        row: Math.floor(index / cols),
        col: index % cols,
      },
    })
  },
  hoverShelf: (shelf) => set({ hoveredShelf: shelf }),
  clearSelection: () => set({ selectedShelf: null }),
  setFilters: (newFilters) =>
    set((state) => ({ filters: { ...state.filters, ...newFilters } })),
  goToOverview: () =>
    set({
      mode: "overview",
      selectedRackId: null,
      selectedShelf: null,
      hoveredShelf: null,
    }),
}))
