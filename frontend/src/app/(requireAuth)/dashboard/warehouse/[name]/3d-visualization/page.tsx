"use client"

import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
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

export default function ThreeDVisualizationPage() {
  const t = useTranslations("threeD")
  // TODO: Replace mock data with real warehouse data fetched from the backend
  const warehouse = useMemo(() => generateMockWarehouse(20), [])
  const { mode, selectedRackId, goToOverview, focusWindow, setFocusWindow } =
    useWarehouseStore()
  const router = useRouter()
  let backLabel = t("actions.backToOverview")
  if (focusWindow) {
    backLabel = t("actions.backToBlocks")
  } else if (mode === "overview") {
    backLabel = t("actions.backToDashboard")
  }
  const renderVisualizationFallback = (_error: Error, reset: () => void) => (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-4 bg-slate-950/40 p-6 text-center"
      role="alert"
    >
      <div>
        <h2 className="font-semibold text-lg">{t("fallback.title")}</h2>
        <p className="mt-2 text-muted-foreground text-sm">
          {t("fallback.description")}
        </p>
      </div>
      <Button onClick={reset} size="sm" variant="outline">
        {t("fallback.retry")}
      </Button>
    </div>
  )

  return (
    <div className="flex h-screen flex-col overflow-hidden rounded-sm border bg-background">
      <div className="border-b px-4 py-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center justify-center gap-2">
            <Button
              aria-label={backLabel}
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
              title={backLabel}
              variant="outline"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} />
            </Button>
            <div>
              <h1 className="font-bold text-xl">{t("title")}</h1>
              <div className="text-muted-foreground text-sm">
                {t("mode.label")}{" "}
                <span className="font-semibold">
                  {mode === "overview" ? t("mode.overview") : t("mode.details")}
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
                {t("sidebar.trigger")}
              </SheetTrigger>
              <SheetContent className="p-0" side="left">
                <SheetHeader className="border-b">
                  <SheetTitle>{t("sidebar.title")}</SheetTitle>
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
                {t("details.trigger")}
              </SheetTrigger>
              <SheetContent className="p-0" side="right">
                <SheetHeader className="border-b">
                  <SheetTitle>{t("details.title")}</SheetTitle>
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
