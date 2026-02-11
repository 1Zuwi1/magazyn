"use client"

import { useTranslations } from "next-intl"
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
  const t = useTranslations()

  return (
    <ScannerSelectItem
      description={t("generated.scanner.shared.findProductWantRemoveWarehouse")}
      onCancel={onCancel}
      onSelect={onSelect}
      title={t("generated.scanner.shared.selectProduct")}
    />
  )
}
