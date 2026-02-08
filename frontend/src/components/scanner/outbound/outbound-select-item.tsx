"use client"

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
      description="Znajdź produkt który chcesz zdjąć z magazynu."
      onCancel={onCancel}
      onSelect={onSelect}
      title="Wybierz produkt"
    />
  )
}
