"use client"

import { translateMessage } from "@/i18n/translate-message"
import { ScannerSelectItem } from "../scanner-select-item"
import type { ScanItem } from "../scanner-types"

interface OutboundSelectItemProps {
  onSelect: (item: ScanItem) => void
  onCancel: () => void
}

export function OutboundSelectItem({
  onSelect,
  onCancel,
}: OutboundSelectItemProps) {
  return (
    <ScannerSelectItem
      description={translateMessage(
        "generated.scanner.shared.findProductWantRemoveWarehouse"
      )}
      onCancel={onCancel}
      onSelect={onSelect}
      title={translateMessage("generated.scanner.shared.selectProduct")}
    />
  )
}
