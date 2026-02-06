import { Location04Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { apiFetch } from "@/lib/fetcher"
import { RacksSchema } from "@/lib/schemas"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { CancelButton } from "./cancel-button"
import { LocationCard } from "./location-card"
import { ScannerBody } from "./scanner-body"
import type {
  EditablePlacement,
  PlacementPlan,
  RackSelectOption,
} from "./scanner-types"

const RACK_OPTIONS_PAGE_SIZE = 50

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

const formatReservedUntil = (value: string | null): string | null => {
  if (!value) {
    return null
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return new Intl.DateTimeFormat("pl-PL", {
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
  const reservedUntilLabel = formatReservedUntil(plan.reservedUntil)
  const {
    data: racksData,
    fetchNextPage: fetchNextRackPage,
    hasNextPage: hasNextRackPage,
    isError: isRackOptionsError,
    isFetchingNextPage: isFetchingNextRackPage,
    isPending: isRackOptionsPending,
  } = useInfiniteQuery({
    queryKey: ["scanner-rack-options", warehouseId],
    enabled: warehouseId !== null,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      if (warehouseId === null) {
        throw new Error("Brak aktywnego magazynu.")
      }

      return await apiFetch(
        `/api/racks/warehouse/${warehouseId}`,
        RacksSchema,
        {
          queryParams: {
            page: pageParam,
            size: RACK_OPTIONS_PAGE_SIZE,
          },
        }
      )
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.last) {
        return undefined
      }

      return lastPage.page + 1
    },
    staleTime: 60_000,
  })

  const rackOptions = useMemo<RackSelectOption[]>(() => {
    if (!racksData) {
      return []
    }

    return racksData.pages.flatMap((page) =>
      page.content.map((rack) => ({
        id: rack.id,
        name: rack.marker,
      }))
    )
  }, [racksData])

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
              Edytuj rozmieszczenie
            </h2>
            <p className="mt-1 text-muted-foreground text-sm">
              Zmień pozycje ręcznie, jeśli chcesz umieścić towar w innych
              miejscach.
            </p>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl border bg-card/40 p-3 text-center">
            <p className="text-muted-foreground text-xs">Zgłoszono</p>
            <p className="font-semibold text-lg">{plan.requestedQuantity}</p>
          </div>
          <div className="rounded-xl border bg-card/40 p-3 text-center">
            <p className="text-muted-foreground text-xs">Przydzielono</p>
            <p className="font-semibold text-lg">{plan.allocatedQuantity}</p>
          </div>
          <div className="rounded-xl border bg-card/40 p-3 text-center">
            <p className="text-muted-foreground text-xs">Brakuje</p>
            <p className="font-semibold text-lg">{plan.remainingQuantity}</p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge variant={plan.reserved ? "default" : "outline"}>
            {plan.reserved ? "Rezerwacja aktywna" : "Bez rezerwacji"}
          </Badge>
          {reservedUntilLabel ? (
            <Badge variant="outline">Do: {reservedUntilLabel}</Badge>
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
            Dodaj lokalizację
          </Button>
          <Button
            className="h-12 w-full rounded-xl"
            disabled={isConfirmDisabled}
            isLoading={isSubmitting}
            onClick={onConfirm}
            type="button"
          >
            Potwierdź rozmieszczenie
          </Button>
        </div>
      </div>
    </ScannerBody>
  )
}
