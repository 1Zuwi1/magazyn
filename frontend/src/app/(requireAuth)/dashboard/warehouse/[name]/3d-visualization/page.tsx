"use client"

import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useRouter } from "next/navigation"
import { useMemo } from "react"
import { DetailsPanel } from "@/components/dashboard/3d-visualization/details-panel"
import { generateMockWarehouse } from "@/components/dashboard/3d-visualization/mock-data"
import { SidebarPanel } from "@/components/dashboard/3d-visualization/sidebar-panel"
import { useWarehouseStore } from "@/components/dashboard/3d-visualization/store"
import { WarehouseScene } from "@/components/dashboard/3d-visualization/warehouse-scene"
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
    <button
      className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
      onClick={reset}
      type="button"
    >
      Spróbuj ponownie
    </button>
  </div>
)

const LABELS = {
  overview: "Wróć do panelu",
  focus: "Wróć do przeglądu",
  details: "Wróć do bloków",
}

export default function ThreeDVisualizationPage() {
  // TODO: Replace mock data with real warehouse data fetched from the backend
  const warehouse = useMemo(() => generateMockWarehouse(20), [])
  const { mode, selectedRackId, goToOverview, focusWindow, setFocusWindow } =
    useWarehouseStore()
  const router = useRouter()

  return (
    <div className="flex h-screen flex-col overflow-hidden rounded-sm border bg-background">
      <div className="border-b px-4 py-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center justify-center gap-2">
            <Button
              aria-label={LABELS[focusWindow ? "details" : mode]}
              onClick={() => {
                if (focusWindow) {
                  setFocusWindow(null)
                } else if (mode === "focus") {
                  goToOverview()
                } else {
                  router.back()
                }
              }}
              size={"icon"}
              title={LABELS[focusWindow ? "details" : mode]}
              variant="outline"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} />
            </Button>
            <div>
              <h1 className="font-bold text-xl">Wizualizacja Magazynu 3D</h1>
              <div className="text-muted-foreground text-sm">
                Tryb:{" "}
                <span className="font-semibold">
                  {mode === "overview" ? "Przegląd" : "Szczegóły"}
                </span>
              </div>
            </div>
          </div>
          <div className="grid items-center gap-2 md:flex xl:hidden">
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

        <div className="hidden w-80 shrink-0 xl:block">
          <DetailsPanel warehouse={warehouse} />
        </div>
      </div>
    </div>
  )
}
