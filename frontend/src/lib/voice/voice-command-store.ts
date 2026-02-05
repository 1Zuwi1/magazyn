import { create } from "zustand"

interface VoiceCommandState {
  scannerOpen: boolean
  addItemDialogOpen: boolean
  openScanner: () => void
  closeScanner: () => void
  openAddItemDialog: () => void
  closeAddItemDialog: () => void
}

export const useVoiceCommandStore = create<VoiceCommandState>((set) => ({
  scannerOpen: false,
  addItemDialogOpen: false,
  openScanner: () => set({ scannerOpen: true }),
  closeScanner: () => set({ scannerOpen: false }),
  openAddItemDialog: () => set({ addItemDialogOpen: true }),
  closeAddItemDialog: () => set({ addItemDialogOpen: false }),
}))
