"use client"

import { useMemo } from "react"
import { DetailsPanel } from "@/components/dashboard/3d-visualization/details-panel"
import { generateMockWarehouse } from "@/components/dashboard/3d-visualization/mock-data"
import { SidebarPanel } from "@/components/dashboard/3d-visualization/sidebar-panel"
import { useWarehouseStore } from "@/components/dashboard/3d-visualization/store"
import { WarehouseScene } from "@/components/dashboard/3d-visualization/warehouse-scene"

export default function ThreeDVisualizationPage() {
  const warehouse = useMemo(() => generateMockWarehouse(10), [])
  const { mode, selectedRackId } = useWarehouseStore()

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <div className="border-b px-4 py-2">
        <h1 className="font-bold text-xl">Wizualizacja Magazynu 3D</h1>
        <div className="text-muted-foreground text-sm">
          Tryb:{" "}
          <span className="font-semibold">
            {mode === "overview" ? "Przegląd" : "Szczegóły"}
          </span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-72 shrink-0">
          <SidebarPanel racks={warehouse.racks} />
        </div>

        <div className="flex-1">
          <WarehouseScene
            mode={mode}
            selectedRackId={selectedRackId}
            warehouse={warehouse}
          />
        </div>

        <div className="w-80 shrink-0">
          <DetailsPanel warehouse={warehouse} />
        </div>
      </div>
    </div>
  )
}
