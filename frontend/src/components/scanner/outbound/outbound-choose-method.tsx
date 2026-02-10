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
      description={translateMessage("generated.m0675")}
      onCancel={onCancel}
      onScan={onScan}
      onSelect={onSelect}
      scanDescription={translateMessage("generated.m1012")}
      scanLabel="Zeskanuj kod"
      selectDescription={translateMessage("generated.m1013")}
      selectLabel="Wybierz z listy"
      title={translateMessage("generated.m0676")}
    />
  )
}
