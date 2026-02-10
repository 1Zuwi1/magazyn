import { translateMessage } from "@/i18n/translate-message"
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
  return (
    <ScannerChooseMethod
      description={translateMessage(
        "generated.scanner.shared.chooseHowIndicateGoodsRemove"
      )}
      onCancel={onCancel}
      onScan={onScan}
      onSelect={onSelect}
      scanDescription={translateMessage(
        "generated.scanner.shared.scanGs1128CodeAssortment"
      )}
      scanLabel="Zeskanuj kod"
      selectDescription={translateMessage(
        "generated.scanner.shared.searchProductSpecifyQuantityRemove"
      )}
      selectLabel="Wybierz z listy"
      title={translateMessage("generated.scanner.shared.goodsRemoval")}
    />
  )
}
