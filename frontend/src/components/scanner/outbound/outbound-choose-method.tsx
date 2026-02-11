import { useTranslations } from "next-intl"
import { ScannerChooseMethod } from "../scanner-choose-method"

interface OutboundChooseMethodProps {
  onScan: () => void
  onSelect: () => void
  onCancel: () => void
}

export function OutboundChooseMethod({
  onScan,
  onSelect,
  onCancel,
}: OutboundChooseMethodProps) {
  const t = useTranslations()

  return (
    <ScannerChooseMethod
      description={t("generated.scanner.shared.chooseHowIndicateGoodsRemove")}
      onCancel={onCancel}
      onScan={onScan}
      onSelect={onSelect}
      scanDescription={t("generated.scanner.shared.scanGs1128CodeAssortment")}
      scanLabel="Zeskanuj kod"
      selectDescription={t(
        "generated.scanner.shared.searchProductSpecifyQuantityRemove"
      )}
      selectLabel="Wybierz z listy"
      title={t("generated.scanner.shared.goodsRemoval")}
    />
  )
}
