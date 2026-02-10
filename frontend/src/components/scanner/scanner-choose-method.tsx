import {
  Camera01Icon,
  KeyboardIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { translateMessage } from "@/i18n/translate-message"
import { Button } from "../ui/button"
import { CancelButton } from "./cancel-button"
import { ScannerBody } from "./scanner-body"

interface ScannerChooseMethodProps {
  title: string
  description: string
  scanLabel: string
  scanDescription: string
  selectLabel: string
  selectDescription: string
  manualLabel?: string
  manualDescription?: string
  onScan: () => void
  onSelect: () => void
  onManual?: () => void
  onCancel: () => void
}

export function ScannerChooseMethod({
  title,
  description,
  scanLabel,
  scanDescription,
  selectLabel,
  selectDescription,
  manualLabel,
  manualDescription,
  onScan,
  onSelect,
  onManual,
  onCancel,
}: ScannerChooseMethodProps) {
  const showManualOption =
    manualLabel && manualDescription && typeof onManual === "function"

  return (
    <ScannerBody>
      <div className="relative flex h-full flex-col">
        <CancelButton onClick={onCancel} />

        <div className="mb-6">
          <h2 className="font-semibold text-xl tracking-tight">{title}</h2>
          <p className="mt-1 text-muted-foreground text-sm">{description}</p>
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
              <p className="font-medium">{scanLabel}</p>
              <p className="mt-0.5 text-muted-foreground text-sm">
                {scanDescription}
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
              <p className="font-medium">{selectLabel}</p>
              <p className="mt-0.5 text-muted-foreground text-sm">
                {selectDescription}
              </p>
            </div>
          </button>

          {showManualOption ? (
            <button
              className="group flex items-center gap-4 rounded-xl border bg-card/50 p-5 text-left transition-all hover:border-primary/30 hover:shadow-sm"
              onClick={onManual}
              type="button"
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 transition-colors group-hover:bg-primary/20">
                <HugeiconsIcon
                  className="size-6 text-primary"
                  icon={KeyboardIcon}
                />
              </div>
              <div>
                <p className="font-medium">{manualLabel}</p>
                <p className="mt-0.5 text-muted-foreground text-sm">
                  {manualDescription}
                </p>
              </div>
            </button>
          ) : null}
        </div>

        <div className="pt-4">
          <Button
            className="h-12 w-full rounded-xl"
            onClick={onCancel}
            type="button"
            variant="outline"
          >
            {translateMessage("generated.shared.cancel")}
          </Button>
        </div>
      </div>
    </ScannerBody>
  )
}
