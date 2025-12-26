import { Filter } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import type { FilterState } from "./types"

interface WarehouseFiltersProps {
  filters: FilterState
  onFilterChange: (newFilters: FilterState) => void
}

export const DEFAULT_FILTERS: FilterState = {
  query: "",
  minOccupancy: 0,
  tempRange: [-30, 30],
  showEmpty: true,
}

export function WarehouseFilters({
  filters,
  onFilterChange,
}: WarehouseFiltersProps) {
  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "cursor-pointer"
        )}
      >
        <HugeiconsIcon className="h-4 w-4" icon={Filter} />
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Filtry zaawansowane</h4>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Min. zapełnienie</Label>
              <span className="text-muted-foreground text-sm">
                {filters.minOccupancy}%
              </span>
            </div>
            <Slider
              max={100}
              onValueChange={(value) => {
                const newValue = Array.isArray(value) ? value[0] : value
                onFilterChange({
                  ...filters,
                  minOccupancy: newValue ?? 0,
                })
              }}
              step={10}
              value={[filters.minOccupancy]}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Zakres temperatur</Label>
              <span className="text-muted-foreground text-sm">
                {filters.tempRange[0]}°C - {filters.tempRange[1]}°C
              </span>
            </div>
            <Slider
              max={50}
              min={-30}
              onValueChange={(value) => {
                if (Array.isArray(value) && value.length === 2) {
                  onFilterChange({
                    ...filters,
                    tempRange: [value[0], value[1]],
                  })
                }
              }}
              step={5}
              value={filters.tempRange}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="showEmpty">Pokaż puste regały</Label>
            <Switch
              checked={filters.showEmpty}
              id="showEmpty"
              onCheckedChange={(checked) =>
                onFilterChange({
                  ...filters,
                  showEmpty: checked,
                })
              }
            />
          </div>

          <Button
            onClick={() => onFilterChange(DEFAULT_FILTERS)}
            size="sm"
            variant="ghost"
          >
            Resetuj filtry
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
