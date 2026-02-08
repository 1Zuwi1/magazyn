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
      description="Wybierz sposób wskazania towaru do zdjęcia z magazynu."
      onCancel={onCancel}
      onScan={onScan}
      onSelect={onSelect}
      scanDescription="Zeskanuj kod GS1-128 z etykiety asortymentu."
      scanLabel="Zeskanuj kod"
      selectDescription="Wyszukaj produkt i wskaż ilość do zdjęcia."
      selectLabel="Wybierz z listy"
      title="Zdejmowanie towaru"
    />
  )
}
