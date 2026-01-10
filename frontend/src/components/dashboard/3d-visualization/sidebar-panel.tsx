import { Input } from "@/components/ui/input"
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

      <div className="flex-1 space-y-2 overflow-y-auto">
        {filteredRacks.map((rack) => {
          const occupiedCount = rack.items.filter(
            (item) => item !== null
          ).length
          const occupancy =
            (occupiedCount / (rack.grid.rows * rack.grid.cols)) * 100
          return (
            <button
              className={`w-full rounded-lg border p-3 text-left transition-colors ${
                selectedRackId === rack.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted"
              }`}
              key={rack.id}
              onClick={() => {
                focusRack(rack.id)
              }}
              type="button"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold">{rack.name}</span>
              </div>
              <div className="mb-1 text-muted-foreground text-sm">
                Siatka: {rack.grid.rows}×{rack.grid.cols}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>Zajętość:</span>
                <span className="font-semibold">{Math.round(occupancy)}%</span>
              </div>
            </button>
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
