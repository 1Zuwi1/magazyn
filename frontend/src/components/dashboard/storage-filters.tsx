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
import { translateMessage } from "@/i18n/translate-message"
import { cn } from "@/lib/utils"
import type { FilterState } from "./types"

interface WarehouseFiltersProps {
  filters: FilterState
  onFilterChange: (newFilters: FilterState) => void
}

export const DEFAULT_FILTERS: FilterState = {
  query: "",
  minOccupancy: 0,
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
            <h4 className="font-medium leading-none">
              {translateMessage("generated.m0651")}
            </h4>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>{translateMessage("generated.m0652")}</Label>
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

          <div className="flex items-center justify-between">
            <Label htmlFor="showEmpty">
              {translateMessage("generated.m0653")}
            </Label>
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
            {translateMessage("generated.m0654")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
