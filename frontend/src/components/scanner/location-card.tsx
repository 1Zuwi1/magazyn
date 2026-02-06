import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import type { EditablePlacement } from "./scanner-types"

interface LocationCardProps {
  placement: EditablePlacement
  index: number
  canRemove: boolean
  onRemove: (placementId: string) => void
  onChange: (
    placementId: string,
    field: "rackId" | "positionX" | "positionY",
    value: number
  ) => void
}

const normalizeNumberInput = (value: string): number => {
  const parsedValue = Number.parseInt(value, 10)

  if (Number.isNaN(parsedValue)) {
    return 0
  }

  return Math.max(0, parsedValue)
}

export function LocationCard({
  placement,
  index,
  canRemove,
  onRemove,
  onChange,
}: LocationCardProps) {
  const baseId = `placement-${placement.id}`

  return (
    <div className="group relative overflow-hidden rounded-xl border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-sm">
      <div className="absolute top-0 left-0 h-full w-1 bg-primary opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-bold font-mono text-primary text-sm">
            {index + 1}
          </div>
          <p className="font-medium text-sm">Lokalizacja</p>
        </div>
        <div className="flex items-center gap-2">
          {placement.rackMarker ? (
            <Badge variant="outline">{placement.rackMarker}</Badge>
          ) : null}
          <Button
            disabled={!canRemove}
            onClick={() => onRemove(placement.id)}
            size="sm"
            type="button"
            variant="ghost"
          >
            Usuń
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor={`${baseId}-rack`}>ID Regału</Label>
          <Input
            id={`${baseId}-rack`}
            min={0}
            onChange={(event) => {
              onChange(
                placement.id,
                "rackId",
                normalizeNumberInput(event.currentTarget.value)
              )
            }}
            type="number"
            value={placement.rackId}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`${baseId}-x`}>Rząd</Label>
          <Input
            id={`${baseId}-x`}
            min={0}
            onChange={(event) => {
              onChange(
                placement.id,
                "positionX",
                normalizeNumberInput(event.currentTarget.value)
              )
            }}
            type="number"
            value={placement.positionX}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`${baseId}-y`}>Kolumna</Label>
          <Input
            id={`${baseId}-y`}
            min={0}
            onChange={(event) => {
              onChange(
                placement.id,
                "positionY",
                normalizeNumberInput(event.currentTarget.value)
              )
            }}
            type="number"
            value={placement.positionY}
          />
        </div>
      </div>
    </div>
  )
}
