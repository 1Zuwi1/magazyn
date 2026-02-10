import { Tick02Icon, UnfoldMoreIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useVirtualizer } from "@tanstack/react-virtual"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useAppTranslations } from "@/i18n/use-translations"
import { cn } from "@/lib/utils"
import { Badge } from "../ui/badge"
import { Button, buttonVariants } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { ScrollArea } from "../ui/scroll-area"
import { Skeleton } from "../ui/skeleton"
import { Spinner } from "../ui/spinner"
import type { EditablePlacement, RackSelectOption } from "./scanner-types"

const RACK_OPTION_HEIGHT_PX = 36
const RACK_FETCH_THRESHOLD_ITEMS = 6

interface LocationCardProps {
  placement: EditablePlacement
  index: number
  rackName?: string
  rackOptions: RackSelectOption[]
  isRackOptionsPending: boolean
  isRackOptionsError: boolean
  hasNextRackPage: boolean
  isFetchingNextRackPage: boolean
  isRackSelectDisabled: boolean
  canRemove: boolean
  onFetchNextRackPage: () => void
  onRemove: (placementId: string) => void
  onChange: (
    placementId: string,
    field: "rackId" | "positionX" | "positionY",
    value: number
  ) => void
}

const normalizeNumberInput = (value: string, max?: number): number => {
  const parsedValue = Number.parseInt(value, 10)

  if (Number.isNaN(parsedValue)) {
    return 1
  }

  const clamped = Math.max(1, parsedValue)

  if (max !== undefined) {
    return Math.min(clamped, max)
  }

  return clamped
}

interface RackSelectProps {
  id: string
  value: number
  rackName?: string
  rackOptions: RackSelectOption[]
  isRackOptionsPending: boolean
  isRackOptionsError: boolean
  hasNextRackPage: boolean
  isFetchingNextRackPage: boolean
  disabled: boolean
  onFetchNextRackPage: () => void
  onChange: (rackId: number) => void
}

function RackSelect({
  id,
  value,
  rackName,
  rackOptions,
  isRackOptionsPending,
  isRackOptionsError,
  hasNextRackPage,
  isFetchingNextRackPage,
  disabled,
  onFetchNextRackPage,
  onChange,
}: RackSelectProps) {
  const t = useAppTranslations()

  const [isRackSelectOpen, setIsRackSelectOpen] = useState(false)
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(
    null
  )

  const selectedRackName = useMemo(() => {
    const selectedRack = rackOptions.find((rack) => rack.id === value)
    return selectedRack?.name ?? rackName ?? ""
  }, [rackName, rackOptions, value])

  const rackListVirtualizer = useVirtualizer({
    count: rackOptions.length,
    getScrollElement: () => scrollElement,
    estimateSize: () => RACK_OPTION_HEIGHT_PX,
    overscan: 8,
  })

  const virtualRackItems = rackListVirtualizer.getVirtualItems()

  const scrollAreaRef = useCallback((node: HTMLDivElement | null) => {
    setScrollElement(node)
  }, [])

  useEffect(() => {
    if (!(isRackSelectOpen && hasNextRackPage) || isFetchingNextRackPage) {
      return
    }

    const lastVisibleRack = virtualRackItems.at(-1)
    if (!lastVisibleRack) {
      return
    }

    if (
      lastVisibleRack.index >=
      rackOptions.length - RACK_FETCH_THRESHOLD_ITEMS
    ) {
      onFetchNextRackPage()
    }
  }, [
    hasNextRackPage,
    isFetchingNextRackPage,
    isRackSelectOpen,
    onFetchNextRackPage,
    rackOptions.length,
    virtualRackItems,
  ])

  const triggerLabel = selectedRackName || t("generated.shared.selectRack")

  return (
    <Popover onOpenChange={setIsRackSelectOpen} open={isRackSelectOpen}>
      <PopoverTrigger
        className={cn(
          buttonVariants({ size: "default", variant: "outline" }),
          "w-full justify-between font-normal",
          !selectedRackName && "text-muted-foreground"
        )}
        disabled={disabled}
        id={id}
        type="button"
      >
        <span className="truncate">{triggerLabel}</span>
        <HugeiconsIcon icon={UnfoldMoreIcon} strokeWidth={2} />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--anchor-width) gap-0 p-0">
        <ScrollArea
          aria-label={t("generated.scanner.rackList")}
          className="h-56 p-1 pr-3"
          ref={scrollAreaRef}
          role="listbox"
        >
          {rackOptions.length > 0 ? (
            <div
              className="relative"
              style={{ height: `${rackListVirtualizer.getTotalSize()}px` }}
            >
              {virtualRackItems.map((virtualRack) => {
                const rack = rackOptions[virtualRack.index]
                if (!rack) {
                  return null
                }

                const isSelected = rack.id === value

                return (
                  <button
                    aria-selected={isSelected}
                    className={cn(
                      "absolute top-0 left-0 flex w-full items-center justify-between rounded-sm px-2 text-left text-sm outline-hidden transition-colors",
                      "hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground",
                      isSelected && "bg-accent text-accent-foreground"
                    )}
                    key={rack.id}
                    onClick={() => {
                      onChange(rack.id)
                      setIsRackSelectOpen(false)
                    }}
                    role="option"
                    style={{
                      height: `${virtualRack.size}px`,
                      transform: `translateY(${virtualRack.start}px)`,
                    }}
                    type="button"
                  >
                    <span className="truncate">{rack.name}</span>
                    {isSelected ? (
                      <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} />
                    ) : null}
                  </button>
                )
              })}
            </div>
          ) : null}

          {isRackOptionsPending && rackOptions.length === 0 ? (
            <div className="space-y-1 p-1">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton
                  className="h-9 w-full rounded-sm"
                  key={`skeleton-${i.toString()}`}
                />
              ))}
            </div>
          ) : null}

          {!(isRackOptionsPending || isRackOptionsError) &&
          rackOptions.length === 0 ? (
            <p className="px-2 py-3 text-muted-foreground text-sm">
              {t("generated.scanner.racksAvailable")}
            </p>
          ) : null}

          {isRackOptionsError ? (
            <p className="px-2 py-3 text-destructive text-sm">
              {t("generated.scanner.failedFetchRackList")}
            </p>
          ) : null}
        </ScrollArea>

        {isFetchingNextRackPage && (
          <div className="flex items-center gap-2 border-t px-2 py-1.5 text-muted-foreground text-xs">
            <Spinner className="size-3.5" />
            <span>{t("generated.scanner.loadingRacks")}</span>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

export function LocationCard({
  placement,
  index,
  rackName,
  rackOptions,
  isRackOptionsPending,
  isRackOptionsError,
  hasNextRackPage,
  isFetchingNextRackPage,
  isRackSelectDisabled,
  canRemove,
  onFetchNextRackPage,
  onRemove,
  onChange,
}: LocationCardProps) {
  const t = useAppTranslations()

  const baseId = `placement-${placement.id}`

  const selectedRack = useMemo(
    () => rackOptions.find((rack) => rack.id === placement.rackId),
    [rackOptions, placement.rackId]
  )

  const maxColumn = selectedRack ? Math.max(0, selectedRack.sizeX) : undefined
  const maxRow = selectedRack ? Math.max(0, selectedRack.sizeY) : undefined

  return (
    <div className="group relative overflow-hidden rounded-xl border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm">
      <div className="absolute top-0 left-0 h-full w-1 bg-primary opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-bold font-mono text-primary text-sm">
            {index + 1}
          </div>
          <p className="font-medium text-sm">
            {t("generated.shared.location")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {rackName ? <Badge variant="outline">{rackName}</Badge> : null}
          <Button
            disabled={!canRemove}
            onClick={() => onRemove(placement.id)}
            size="sm"
            type="button"
            variant="ghost"
          >
            {t("generated.shared.remove")}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor={`${baseId}-rack`}>{t("generated.shared.rack")}</Label>
          <RackSelect
            disabled={isRackSelectDisabled}
            hasNextRackPage={hasNextRackPage}
            id={`${baseId}-rack`}
            isFetchingNextRackPage={isFetchingNextRackPage}
            isRackOptionsError={isRackOptionsError}
            isRackOptionsPending={isRackOptionsPending}
            onChange={(rackId) => {
              onChange(placement.id, "rackId", rackId)
            }}
            onFetchNextRackPage={onFetchNextRackPage}
            rackName={rackName}
            rackOptions={rackOptions}
            value={placement.rackId}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`${baseId}-x`}>{t("generated.scanner.shelf")}</Label>
          <Input
            id={`${baseId}-x`}
            max={maxColumn}
            min={1}
            onChange={(event) => {
              onChange(
                placement.id,
                "positionX",
                normalizeNumberInput(event.currentTarget.value, maxColumn)
              )
            }}
            type="number"
            value={placement.positionX}
          />
          {maxColumn !== undefined ? (
            <p className="text-muted-foreground text-xs">
              {t("generated.scanner.max", { value0: maxColumn })}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`${baseId}-y`}>{t("generated.scanner.row")}</Label>
          <Input
            id={`${baseId}-y`}
            max={maxRow}
            min={1}
            onChange={(event) => {
              onChange(
                placement.id,
                "positionY",
                normalizeNumberInput(event.currentTarget.value, maxRow)
              )
            }}
            type="number"
            value={placement.positionY}
          />
          {maxRow !== undefined ? (
            <p className="text-muted-foreground text-xs">
              {t("generated.scanner.max", { value0: maxRow })}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
