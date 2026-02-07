import { create } from "zustand"

export interface RemoveItemPayload {
  itemName: string
  rackName?: string
}

export interface MoveItemPayload {
  itemName: string
  sourceRack?: string
  targetRack: string
}

export interface SearchItemPayload {
  itemName: string
}

export interface InventoryCheckPayload {
  rackName?: string
  itemName?: string
}

export type PendingAction =
  | { type: "remove-item"; payload: RemoveItemPayload }
  | { type: "search-item"; payload: SearchItemPayload }
  | { type: "inventory-check"; payload: InventoryCheckPayload }

interface VoiceCommandState {
  scannerOpen: boolean
  addItemDialogOpen: boolean
  pendingAction: PendingAction | null
  openScanner: () => void
  closeScanner: () => void
  openAddItemDialog: () => void
  closeAddItemDialog: () => void
  setPendingAction: (action: PendingAction) => void
  clearPendingAction: () => void
}

export const useVoiceCommandStore = create<VoiceCommandState>((set) => ({
  scannerOpen: false,
  addItemDialogOpen: false,
  pendingAction: null,
  openScanner: () => set({ scannerOpen: true }),
  closeScanner: () => set({ scannerOpen: false }),
  openAddItemDialog: () => set({ addItemDialogOpen: true }),
  closeAddItemDialog: () => set({ addItemDialogOpen: false }),
  setPendingAction: (action) => set({ pendingAction: action }),
  clearPendingAction: () => set({ pendingAction: null }),
}))
