import { Camera01Icon, Search01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "../../ui/button"
import { CancelButton } from "../cancel-button"
import { ScannerBody } from "../scanner-body"

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
    <ScannerBody>
      <div className="relative flex h-full flex-col">
        <CancelButton onClick={onCancel} />

        <div className="mb-6">
          <h2 className="font-semibold text-xl tracking-tight">
            Zdejmowanie towaru
          </h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Wybierz sposób wskazania towaru do zdjęcia z magazynu.
          </p>
        </div>

        <div className="flex flex-1 flex-col justify-center gap-4">
          <button
            className="group flex items-center gap-4 rounded-xl border bg-card/50 p-5 text-left transition-all hover:border-primary/30 hover:shadow-sm"
            onClick={onScan}
            type="button"
          >
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 transition-colors group-hover:bg-primary/20">
              <HugeiconsIcon
                className="size-6 text-primary"
                icon={Camera01Icon}
              />
            </div>
            <div>
              <p className="font-medium">Zeskanuj kod</p>
              <p className="mt-0.5 text-muted-foreground text-sm">
                Zeskanuj kod GS1-128 z etykiety asortymentu.
              </p>
            </div>
          </button>

          <button
            className="group flex items-center gap-4 rounded-xl border bg-card/50 p-5 text-left transition-all hover:border-primary/30 hover:shadow-sm"
            onClick={onSelect}
            type="button"
          >
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 transition-colors group-hover:bg-primary/20">
              <HugeiconsIcon
                className="size-6 text-primary"
                icon={Search01Icon}
              />
            </div>
            <div>
              <p className="font-medium">Wybierz z listy</p>
              <p className="mt-0.5 text-muted-foreground text-sm">
                Wyszukaj produkt i wskaż ilość do zdjęcia.
              </p>
            </div>
          </button>
        </div>

        <div className="pt-4">
          <Button
            className="h-12 w-full rounded-xl"
            onClick={onCancel}
            type="button"
            variant="outline"
          >
            Anuluj
          </Button>
        </div>
      </div>
    </ScannerBody>
  )
}
