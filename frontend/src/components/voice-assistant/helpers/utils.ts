import type { Warehouse } from "@/components/dashboard/types"
import {
  type matchVoiceCommand,
  normalizeTranscript,
} from "@/lib/voice/commands"
import type { PendingAction } from "@/lib/voice/voice-command-store"
import type { VoiceAssistantViews } from "../voice-assistant"

export const findWarehouseByName = (
  inputName: string,
  warehouses: Pick<Warehouse, "id" | "name">[]
) => {
  const normalizedInput = normalizeTranscript(inputName, { toLowerCase: true })
  return (
    warehouses.find((warehouse) => {
      const normalizedName = normalizeTranscript(warehouse.name, {
        toLowerCase: true,
      })
      const normalizedId = normalizeTranscript(warehouse.id, {
        toLowerCase: true,
      })
      return (
        normalizedName === normalizedInput || normalizedId === normalizedInput
      )
    }) ?? null
  )
}

export const getCommandLabel = (
  match: NonNullable<ReturnType<typeof matchVoiceCommand>>,
  warehouses: Pick<Warehouse, "id" | "name">[]
): string => {
  if (match.command.id === "warehouses:id") {
    const warehouseName = match.params.warehouseName
    if (warehouseName) {
      const warehouse = findWarehouseByName(warehouseName, warehouses)
      const label = warehouse?.name ?? warehouseName
      return `Otwórz magazyn ${label}`
    }
  }

  if (match.command.id === "remove-item") {
    const { itemName, rackName } = match.params
    if (rackName) {
      return `Usuń "${itemName}" z regału ${rackName}`
    }
    return `Usuń produkt "${itemName}"`
  }

  if (match.command.id === "search-item") {
    return `Wyszukaj "${match.params.itemName}"`
  }

  if (match.command.id === "inventory-check") {
    const { rackName, itemName } = match.params
    if (rackName) {
      return `Sprawdź stan regału ${rackName}`
    }
    if (itemName) {
      return `Sprawdź stan "${itemName}"`
    }
  }

  return match.command.description
}

export const isCommandMatchValid = (
  match: NonNullable<ReturnType<typeof matchVoiceCommand>>,
  warehouses: Pick<Warehouse, "id" | "name">[]
): boolean => {
  if (match.command.id !== "warehouses:id") {
    return true
  }

  const warehouseName = match.params.warehouseName
  if (!warehouseName) {
    return false
  }

  return Boolean(findWarehouseByName(warehouseName, warehouses))
}

export interface VoiceAssistantActions {
  navigateAndClose: (href: string) => void
  openScanner: () => void
  openAddItemDialog: () => void
  setPendingAction: (action: PendingAction) => void
  closeDialog: () => void
  setErrorMessage: (msg: string) => void
  setView: (view: VoiceAssistantViews) => void
}

export const handleConfirmCommandAction = (
  matchedCommand: ReturnType<typeof matchVoiceCommand>,
  warehouses: Pick<Warehouse, "id" | "name">[],
  actions: VoiceAssistantActions
) => {
  if (!matchedCommand) {
    actions.setErrorMessage("Brak komendy do wykonania.")
    actions.setView("error")
    return
  }

  switch (matchedCommand.command.id) {
    case "dashboard":
      actions.navigateAndClose("/dashboard")
      return
    case "warehouses:id":
      {
        const warehouseName = matchedCommand.params.warehouseName
        if (!warehouseName) {
          actions.setErrorMessage("Brak nazwy magazynu w komendzie.")
          actions.setView("error")
          return
        }
        const warehouse = findWarehouseByName(warehouseName, warehouses)
        if (!warehouse) {
          actions.setErrorMessage("Nie znaleziono magazynu o takiej nazwie.")
          actions.setView("error")
          return
        }
        const encodedName = encodeURIComponent(warehouse.name)
        actions.navigateAndClose(
          `/dashboard/warehouse/id/${warehouse.id}/${encodedName}`
        )
      }
      return
    case "warehouses":
      actions.navigateAndClose("/dashboard/warehouse")
      return
    case "items":
      actions.navigateAndClose("/dashboard/items")
      return
    case "settings":
      actions.navigateAndClose("/settings")
      return
    case "open-scanner":
      actions.openScanner()
      actions.closeDialog()
      return
    case "add-item":
      actions.openAddItemDialog()
      actions.navigateAndClose("/admin/assortment")
      return
    case "remove-item":
      {
        const { itemName, rackName } = matchedCommand.params
        if (!itemName) {
          actions.setErrorMessage("Brak nazwy produktu w komendzie.")
          actions.setView("error")
          return
        }
        actions.setPendingAction({
          type: "remove-item",
          payload: { itemName, rackName },
        })
        actions.navigateAndClose("/dashboard/items")
      }
      return
    case "search-item":
      {
        const { itemName } = matchedCommand.params
        if (!itemName) {
          actions.setErrorMessage("Brak nazwy produktu do wyszukania.")
          actions.setView("error")
          return
        }
        actions.setPendingAction({
          type: "search-item",
          payload: { itemName },
        })
        actions.navigateAndClose("/dashboard/items")
      }
      return
    case "notifications":
      actions.navigateAndClose("/admin/notifications")
      return
    case "inventory-check":
      {
        const { rackName, itemName } = matchedCommand.params
        actions.setPendingAction({
          type: "inventory-check",
          payload: { rackName, itemName },
        })
        actions.navigateAndClose("/dashboard/warehouse")
      }
      return
    case "admin-users":
      actions.navigateAndClose("/admin/users")
      return
    default:
      actions.setErrorMessage("Nieobsługiwana komenda")
      actions.setView("error")
      return
  }
}
