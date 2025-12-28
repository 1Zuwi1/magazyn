"use client"

import { useMemo } from "react"
import { DetailsPanel } from "@/components/dashboard/3d-visualization/details-panel"
import { generateMockWarehouse } from "@/components/dashboard/3d-visualization/mock-data"
import { SidebarPanel } from "@/components/dashboard/3d-visualization/sidebar-panel"
import { useWarehouseStore } from "@/components/dashboard/3d-visualization/store"
import { WarehouseScene } from "@/components/dashboard/3d-visualization/warehouse-scene"
import { buttonVariants } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

export default function ThreeDVisualizationPage() {
  const warehouse = useMemo(() => generateMockWarehouse(10), [])
  const { mode, selectedRackId } = useWarehouseStore()

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <div className="border-b px-4 py-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-bold text-xl">Wizualizacja Magazynu 3D</h1>
            <div className="text-muted-foreground text-sm">
              Tryb:{" "}
              <span className="font-semibold">
                {mode === "overview" ? "Przegląd" : "Szczegóły"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 xl:hidden">
            <Sheet>
              <SheetTrigger
                className={cn(
                  buttonVariants({ size: "sm", variant: "outline" })
                )}
              >
                Eksplorator
              </SheetTrigger>
              <SheetContent className="p-0" side="left">
                <SheetHeader className="border-b">
                  <SheetTitle>Eksplorator Magazynu</SheetTitle>
                </SheetHeader>
                <div className="min-h-0 flex-1">
                  <SidebarPanel racks={warehouse.racks} />
                </div>
              </SheetContent>
            </Sheet>
            <Sheet>
              <SheetTrigger
                className={cn(
                  buttonVariants({ size: "sm", variant: "outline" })
                )}
              >
                Szczegóły
              </SheetTrigger>
              <SheetContent className="p-0" side="right">
                <SheetHeader className="border-b">
                  <SheetTitle>Szczegóły Regału</SheetTitle>
                </SheetHeader>
                <div className="min-h-0 flex-1">
                  <DetailsPanel warehouse={warehouse} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="hidden w-72 shrink-0 xl:block">
          <SidebarPanel racks={warehouse.racks} />
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
          <WarehouseScene
            mode={mode}
            selectedRackId={selectedRackId}
            warehouse={warehouse}
          />
        </div>

        <div className="hidden w-80 shrink-0 xl:block">
          <DetailsPanel warehouse={warehouse} />
        </div>
      </div>
    </div>
  )
}
