import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useWarehouseStore } from "./store"
import type { Rack3D } from "./types"

interface SidebarPanelProps {
  racks: Rack3D[]
}

export function SidebarPanel({ racks }: SidebarPanelProps) {
  const { focusRack, selectedRackId, filters, setFilters } = useWarehouseStore()

  const filteredRacks = racks.filter(
    (rack) =>
      !filters.query ||
      rack.name.toLowerCase().includes(filters.query.toLowerCase()) ||
      rack.code.toLowerCase().includes(filters.query.toLowerCase())
  )

  return (
    <div className="flex h-full flex-col border-r bg-background p-4">
      <div className="mb-4">
        <h2 className="mb-2 font-bold text-lg">Eksplorator Magazynu</h2>
        <div className="space-y-2">
          <Input
            onChange={(e) => {
              setFilters({ query: e.target.value })
            }}
            placeholder="Szukaj regałów..."
            value={filters.query}
          />
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto pr-2">
        {filteredRacks.map((rack) => {
          const occupiedCount = rack.items.filter(
            (item) => item !== null
          ).length
          const occupancy =
            (occupiedCount / (rack.grid.rows * rack.grid.cols)) * 100
          return (
            <Button
              className={cn(
                "flex h-fit w-full flex-col items-start rounded-lg border p-3 text-left transition-colors",
                {
                  "border-primary bg-primary/5 hover:bg-primary/10!":
                    selectedRackId === rack.id,
                  "border-border hover:bg-muted": selectedRackId !== rack.id,
                }
              )}
              key={rack.id}
              onClick={() => {
                focusRack(rack.id)
              }}
              variant="ghost"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold">{rack.name}</span>
              </div>
              <div className="mb-1 text-muted-foreground text-sm">
                Siatka: {rack.grid.rows}×{rack.grid.cols}
              </div>
              <div className="flex items-center justify-between gap-1 text-xs">
                <span>Zajętość:</span>
                <span className="font-semibold">{Math.round(occupancy)}%</span>
              </div>
            </Button>
          )
        })}
      </div>

      <div className="mt-4 border-t pt-4">
        <h3 className="mb-2 font-semibold text-sm">Legenda</h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-green-500" />
            <span>Normalne</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-orange-500" />
            <span>Przeterminowane</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-red-500" />
            <span>Niebezpieczne</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-[linear-gradient(45deg,transparent_35%,var(--color-orange-500)_35%,var(--color-orange-500)_65%,transparent_65%)] bg-red-500" />
            <span>Niebezpieczne i przeterminowane</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-slate-200" />
            <span>Pusta półka</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-blue-500" />
            <span>Wybrana</span>
          </div>
        </div>
      </div>
    </div>
  )
}
