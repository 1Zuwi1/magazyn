"use client"

import { useMemo } from "react"
import { DetailsPanel } from "@/components/dashboard/3d-visualization/details-panel"
import { generateMockWarehouse } from "@/components/dashboard/3d-visualization/mock-data"
import { SidebarPanel } from "@/components/dashboard/3d-visualization/sidebar-panel"
import { useWarehouseStore } from "@/components/dashboard/3d-visualization/store"
import { WarehouseScene } from "@/components/dashboard/3d-visualization/warehouse-scene"
import { PageHeader } from "@/components/dashboard/page-header"
import { Button, buttonVariants } from "@/components/ui/button"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const renderVisualizationFallback = (_error: Error, reset: () => void) => (
  <div
    className="flex h-full w-full flex-col items-center justify-center gap-4 bg-slate-950/40 p-6 text-center"
    role="alert"
  >
    <div>
      <h2 className="font-semibold text-lg">Wizualizacja 3D niedostępna</h2>
      <p className="mt-2 text-muted-foreground text-sm">
        Wystąpił problem podczas renderowania sceny. Spróbuj ponownie lub wróć
        do trybu przeglądu.
      </p>
    </div>
    <Button onClick={reset} size="sm" variant="outline">
      Spróbuj ponownie
    </Button>
  </div>
)

export default function ThreeDVisualizationPage() {
  // TODO: Replace mock data with real warehouse data fetched from the backend
  const warehouse = useMemo(() => generateMockWarehouse(20), [])
  const { mode, selectedRackId } = useWarehouseStore()

  const headerStats = [
    {
      label: "Regałów",
      value: warehouse.racks.length,
    },
    {
      label: "Tryb",
      value: mode === "overview" ? "Przegląd" : "Szczegóły",
    },
  ]

  const panelButtons = (
    <div className="flex flex-wrap items-center gap-2 xl:hidden">
      <Sheet>
        <SheetTrigger
          className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
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
          className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
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
  )

  return (
    <div
      className="flex flex-col gap-4 overflow-hidden"
      style={{
        height: "calc(100dvh - var(--header-height) - 3.5rem - 1px)",
      }}
    >
      <PageHeader
        backHref="./"
        backTitle="Wróć do panelu magazynu"
        description="Interaktywny widok przestrzenny regałów i produktów"
        stats={headerStats}
        statsChildren={panelButtons}
        title="Wizualizacja 3D"
      />

      <div className="flex min-h-0 flex-1 gap-4 overflow-hidden">
        <div className="hidden w-72 shrink-0 overflow-hidden rounded-2xl border xl:block">
          <SidebarPanel racks={warehouse.racks} />
        </div>

        <div className="min-h-0 min-w-0 flex-1 overflow-hidden rounded-2xl border bg-background">
          <ErrorBoundary
            fallback={renderVisualizationFallback}
            resetKeys={[mode, selectedRackId]}
          >
            <WarehouseScene
              mode={mode}
              selectedRackId={selectedRackId}
              warehouse={warehouse}
            />
          </ErrorBoundary>
        </div>

        <div className="hidden w-80 shrink-0 overflow-hidden rounded-2xl border xl:block">
          <DetailsPanel warehouse={warehouse} />
        </div>
      </div>
    </div>
  )
}
