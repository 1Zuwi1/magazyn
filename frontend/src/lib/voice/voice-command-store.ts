import { create } from "zustand"

export interface InventoryCheckPayload {
  rackName?: string
  itemName?: string
}

export interface PendingAction {
  type: "inventory-check"
  payload: InventoryCheckPayload
}

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
