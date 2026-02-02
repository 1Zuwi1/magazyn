import { Location04Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "../ui/button"
import { CancelButton } from "./cancel-button"
import { LocationCard } from "./location-card"
import { ScannerBody } from "./scanner-body"
import type { Location } from "./scanner-types"

interface ScannerLocationsStepProps {
  locations: Location[]
  isSubmitting: boolean
  onBack: () => void
  onConfirm: () => void
}

export function ScannerLocationsStep({
  locations,
  isSubmitting,
  onBack,
  onConfirm,
}: ScannerLocationsStepProps) {
  return (
    <ScannerBody>
      <div className="relative flex h-full flex-col">
        <CancelButton onClick={onBack} />

        {/* Header with icon */}
        <div className="mb-6 flex items-start gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <HugeiconsIcon
              className="size-6 text-primary"
              icon={Location04Icon}
            />
          </div>
          <div>
            <h2 className="font-semibold text-xl tracking-tight">
              Lokalizacje do umieszczenia
            </h2>
            <p className="mt-1 text-muted-foreground text-sm">
              Umieść przedmioty w następujących miejscach:
            </p>
          </div>
        </div>

        {/* Location cards with scrollable area */}
        <div className="relative -mx-2 mb-4 flex-1 overflow-hidden">
          <div className="absolute inset-x-0 top-0 z-10 h-4 bg-linear-to-b from-background to-transparent" />
          <div className="h-full space-y-3 overflow-y-auto px-2 py-2">
            {locations.map((location, index) => (
              <LocationCard
                index={index}
                key={`${location.rack}-${location.row}-${location.col}`}
                location={location}
              />
            ))}
          </div>
          <div className="absolute inset-x-0 bottom-0 z-10 h-4 bg-linear-to-t from-background to-transparent" />
        </div>

        {/* Confirm button */}
        <Button
          className="h-12 w-full rounded-xl"
          isLoading={isSubmitting}
          onClick={onConfirm}
          type="button"
        >
          Przedmioty umieszczone
        </Button>
      </div>
    </ScannerBody>
  )
}
