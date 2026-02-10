import { Location04Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useLocale } from "next-intl"
import { useMemo } from "react"
import { useInfiniteRacks } from "@/hooks/use-racks"
import { translateMessage } from "@/i18n/translate-message"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { CancelButton } from "./cancel-button"
import { LocationCard } from "./location-card"
import { ScannerBody } from "./scanner-body"
import type { EditablePlacement, PlacementPlan } from "./scanner-types"

interface ScannerLocationsStepProps {
  plan: PlacementPlan
  placements: EditablePlacement[]
  warehouseId: number | null
  isSubmitting: boolean
  isConfirmDisabled: boolean
  onBack: () => void
  onConfirm: () => void
  onAddPlacement: () => void
  onRemovePlacement: (placementId: string) => void
  onPlacementChange: (
    placementId: string,
    field: "rackId" | "positionX" | "positionY",
    value: number
  ) => void
}

const formatReservedUntil = (
  value: string | null,
  locale: string
): string | null => {
  if (!value) {
    return null
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export function ScannerLocationsStep({
  plan,
  placements,
  warehouseId,
  isSubmitting,
  isConfirmDisabled,
  onBack,
  onConfirm,
  onAddPlacement,
  onRemovePlacement,
  onPlacementChange,
}: ScannerLocationsStepProps) {
  const locale = useLocale()
  const reservedUntilLabel = formatReservedUntil(plan.reservedUntil, locale)
  const {
    fetchNextPage: fetchNextRackPage,
    hasNextPage: hasNextRackPage,
    isError: isRackOptionsError,
    isFetchingNextPage: isFetchingNextRackPage,
    isPending: isRackOptionsPending,
    rackOptions,
  } = useInfiniteRacks({ warehouseId })

  const rackNamesById = useMemo(() => {
    const map = new Map<number, string>()

    for (const rackOption of rackOptions) {
      map.set(rackOption.id, rackOption.name)
    }

    return map
  }, [rackOptions])

  const handleFetchNextRackPage = () => {
    if (!hasNextRackPage || isFetchingNextRackPage) {
      return
    }

    fetchNextRackPage()
  }

  return (
    <ScannerBody>
      <div className="relative flex h-full flex-col">
        <CancelButton onClick={onBack} />

        <div className="mb-4 flex items-start gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <HugeiconsIcon
              className="size-6 text-primary"
              icon={Location04Icon}
            />
          </div>
          <div>
            <h2 className="font-semibold text-xl tracking-tight">
              {translateMessage("generated.scanner.editPlacement")}
            </h2>
            <p className="mt-1 text-muted-foreground text-sm">
              {translateMessage(
                "generated.scanner.changePositionsManuallyWantPlace"
              )}
            </p>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl border bg-card/40 p-3 text-center">
            <p className="text-muted-foreground text-xs">
              {translateMessage("generated.scanner.requested")}
            </p>
            <p className="font-semibold text-lg">{plan.requestedQuantity}</p>
          </div>
          <div className="rounded-xl border bg-card/40 p-3 text-center">
            <p className="text-muted-foreground text-xs">
              {translateMessage("generated.scanner.allocated")}
            </p>
            <p className="font-semibold text-lg">{plan.allocatedQuantity}</p>
          </div>
          <div className="rounded-xl border bg-card/40 p-3 text-center">
            <p className="text-muted-foreground text-xs">
              {translateMessage("generated.scanner.missing")}
            </p>
            <p className="font-semibold text-lg">{plan.remainingQuantity}</p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge variant={plan.reserved ? "default" : "outline"}>
            {plan.reserved
              ? translateMessage("generated.scanner.reservationActive")
              : translateMessage("generated.scanner.reservation")}
          </Badge>
          {reservedUntilLabel ? (
            <Badge variant="outline">
              {translateMessage("generated.scanner.until", {
                value0: reservedUntilLabel,
              })}
            </Badge>
          ) : null}
        </div>

        <div className="relative -mx-2 mb-4 flex-1 overflow-hidden">
          <div className="absolute inset-x-0 top-0 z-10 h-4 bg-linear-to-b from-background to-transparent" />
          <div className="h-full space-y-3 overflow-y-auto px-2 py-2">
            {placements.map((placement, index) => (
              <LocationCard
                canRemove={placements.length > 1}
                hasNextRackPage={Boolean(hasNextRackPage)}
                index={index}
                isFetchingNextRackPage={isFetchingNextRackPage}
                isRackOptionsError={isRackOptionsError}
                isRackOptionsPending={isRackOptionsPending}
                isRackSelectDisabled={warehouseId === null}
                key={placement.id}
                onChange={onPlacementChange}
                onFetchNextRackPage={handleFetchNextRackPage}
                onRemove={onRemovePlacement}
                placement={placement}
                rackName={
                  rackNamesById.get(placement.rackId) ?? placement.rackMarker
                }
                rackOptions={rackOptions}
              />
            ))}
          </div>
          <div className="absolute inset-x-0 bottom-0 z-10 h-4 bg-linear-to-t from-background to-transparent" />
        </div>

        <div className="space-y-3">
          <Button onClick={onAddPlacement} type="button" variant="outline">
            {translateMessage("generated.scanner.addLocation")}
          </Button>
          <Button
            className="h-12 w-full rounded-xl"
            disabled={isConfirmDisabled}
            isLoading={isSubmitting}
            onClick={onConfirm}
            type="button"
          >
            {translateMessage("generated.scanner.confirmPlacement")}
          </Button>
        </div>
      </div>
    </ScannerBody>
  )
}
