"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { DetailsPanel } from "@/components/dashboard/3d-visualization/details-panel"
import { generateMockWarehouse } from "@/components/dashboard/3d-visualization/mock-data"
import { SidebarPanel } from "@/components/dashboard/3d-visualization/sidebar-panel"
import { useWarehouseStore } from "@/components/dashboard/3d-visualization/store"
import type { FocusWindow } from "@/components/dashboard/3d-visualization/types"
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

const HISTORY_STATE_KEY = "__warehouseView"

type WarehouseHistoryView = "overview" | "focus" | "focus-window"

interface WarehouseHistoryState {
  view: WarehouseHistoryView
  rackId?: string
  focusWindow?: FocusWindow | null
}

const isWarehouseHistoryView = (
  value: unknown
): value is WarehouseHistoryView =>
  value === "overview" || value === "focus" || value === "focus-window"

const parseFocusWindow = (value: unknown): FocusWindow | null => {
  if (!value || typeof value !== "object") {
    return null
  }

  const candidate = value as Partial<FocusWindow>
  if (
    typeof candidate.rackId !== "string" ||
    typeof candidate.startRow !== "number" ||
    typeof candidate.startCol !== "number" ||
    typeof candidate.rows !== "number" ||
    typeof candidate.cols !== "number"
  ) {
    return null
  }

  return {
    rackId: candidate.rackId,
    startRow: candidate.startRow,
    startCol: candidate.startCol,
    rows: candidate.rows,
    cols: candidate.cols,
  }
}

const parseWarehouseHistoryState = (
  value: unknown
): WarehouseHistoryState | null => {
  if (!value || typeof value !== "object") {
    return null
  }

  const payload = value as Record<string, unknown>
  if (!isWarehouseHistoryView(payload.view)) {
    return null
  }

  return {
    view: payload.view,
    rackId: typeof payload.rackId === "string" ? payload.rackId : undefined,
    focusWindow: parseFocusWindow(payload.focusWindow),
  }
}

const buildHistoryState = (
  payload: WarehouseHistoryState | null
): Record<string, unknown> => {
  const currentState = window.history.state
  const baseState =
    currentState && typeof currentState === "object"
      ? (currentState as Record<string, unknown>)
      : {}

  if (!payload) {
    if (!(HISTORY_STATE_KEY in baseState)) {
      return { ...baseState }
    }

    const { [HISTORY_STATE_KEY]: _removed, ...rest } = baseState
    return rest
  }

  return {
    ...baseState,
    [HISTORY_STATE_KEY]: payload,
  }
}

const areFocusWindowsEqual = (
  first: FocusWindow | null | undefined,
  second: FocusWindow | null | undefined
): boolean => {
  if (!(first && second)) {
    return first === second
  }

  return (
    first.rackId === second.rackId &&
    first.startRow === second.startRow &&
    first.startCol === second.startCol &&
    first.rows === second.rows &&
    first.cols === second.cols
  )
}

const getHistoryUpdate = (
  historyView: WarehouseHistoryState,
  previous: WarehouseHistoryState | null
): {
  method: "push" | "replace"
  payload: WarehouseHistoryState | null
} | null => {
  if (historyView.view === "overview") {
    if (previous && previous.view !== "overview") {
      return { method: "replace", payload: null }
    }
    return null
  }

  if (!previous || previous.view === "overview") {
    return { method: "push", payload: historyView }
  }

  if (historyView.view === "focus") {
    if (previous.view === "focus" && previous.rackId === historyView.rackId) {
      return null
    }

    return { method: "replace", payload: historyView }
  }

  if (historyView.view === "focus-window") {
    if (
      previous.view === "focus-window" &&
      areFocusWindowsEqual(previous.focusWindow, historyView.focusWindow)
    ) {
      return null
    }

    return {
      method: previous.view === "focus" ? "push" : "replace",
      payload: historyView,
    }
  }

  return null
}

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
  const router = useRouter()
  const {
    mode,
    selectedRackId,
    focusWindow,
    focusRack,
    setFocusWindow,
    goToOverview,
  } = useWarehouseStore()
  const isFocusActive = mode === "focus" && selectedRackId !== null

  const historyView = useMemo<WarehouseHistoryState>(() => {
    if (focusWindow) {
      return {
        view: "focus-window",
        rackId: focusWindow.rackId,
        focusWindow,
      }
    }

    if (isFocusActive) {
      return {
        view: "focus",
        rackId: selectedRackId ?? undefined,
      }
    }

    return { view: "overview" }
  }, [focusWindow, isFocusActive, selectedRackId])

  const backTitle = useMemo(() => {
    if (focusWindow) {
      return "Powrót do bloków"
    }
    if (isFocusActive) {
      return "Powrót do przeglądu"
    }
    return "Wróć do panelu magazynu"
  }, [focusWindow, isFocusActive])

  const skipHistoryRef = useRef(false)
  const previousHistoryRef = useRef<WarehouseHistoryState | null>(null)

  const applyHistoryState = useCallback(
    (nextState: WarehouseHistoryState | null) => {
      if (!nextState || nextState.view === "overview" || !nextState.rackId) {
        goToOverview()
        return
      }

      if (nextState.view === "focus") {
        focusRack(nextState.rackId)
        return
      }

      focusRack(nextState.rackId)
      if (nextState.focusWindow) {
        setFocusWindow(nextState.focusWindow)
      }
    },
    [focusRack, goToOverview, setFocusWindow]
  )

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const payload =
        event.state && typeof event.state === "object"
          ? (event.state as Record<string, unknown>)[HISTORY_STATE_KEY]
          : null
      const nextState = parseWarehouseHistoryState(payload)

      skipHistoryRef.current = true
      applyHistoryState(nextState)
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [applyHistoryState])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    if (skipHistoryRef.current) {
      skipHistoryRef.current = false
      previousHistoryRef.current = historyView
      return
    }

    const previous = previousHistoryRef.current
    const update = getHistoryUpdate(historyView, previous)
    if (update) {
      const nextState = buildHistoryState(update.payload)
      if (update.method === "push") {
        window.history.pushState(nextState, "", window.location.href)
      } else {
        window.history.replaceState(nextState, "", window.location.href)
      }
    }
    previousHistoryRef.current = historyView
  }, [historyView])

  const handleBack = useCallback(() => {
    if (typeof window === "undefined") {
      return
    }

    if (focusWindow || isFocusActive) {
      window.history.back()
      return
    }

    router.push("./")
  }, [focusWindow, isFocusActive, router])

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
        backTitle={backTitle}
        description="Interaktywny widok przestrzenny regałów i produktów"
        onBack={handleBack}
        stats={headerStats}
        statsChildren={panelButtons}
        title="Wizualizacja 3D"
      />

      <div className="flex min-h-0 flex-1 gap-4 overflow-hidden">
        <div className="hidden w-72 shrink-0 overflow-hidden rounded-2xl border 2xl:block">
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

        <div className="hidden w-80 shrink-0 overflow-hidden rounded-2xl border 2xl:block">
          <DetailsPanel warehouse={warehouse} />
        </div>
      </div>
    </div>
  )
}
