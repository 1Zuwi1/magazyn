"use client"

import { Layers01Icon, PackageSearchIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { DetailsPanel } from "@/components/dashboard/3d-visualization/details-panel"
import { buildWarehouse3DFromApi } from "@/components/dashboard/3d-visualization/map-api-data"
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
import { DISABLE_PAGINATION_PAGE_SIZE } from "@/config/constants"
import useAssortments from "@/hooks/use-assortment"
import useRacks from "@/hooks/use-racks"
import useWarehouses from "@/hooks/use-warehouses"
import { translateMessage } from "@/i18n/translate-message"
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
      <h2 className="font-semibold text-lg">
        {translateMessage("generated.m0073")}
      </h2>
      <p className="mt-2 text-muted-foreground text-sm">
        {translateMessage("generated.m0074")}
      </p>
    </div>
    <Button onClick={reset} size="sm" variant="outline">
      {translateMessage("generated.m0075")}
    </Button>
  </div>
)

const ASSORTMENTS_MIN_PAGE_SIZE = 20

const decodeWarehouseName = (encodedName: string): string => {
  try {
    return decodeURIComponent(encodedName)
  } catch {
    return encodedName
  }
}

export default function ThreeDVisualizationPage() {
  const params = useParams<{ name: string }>()
  const encodedWarehouseName = Array.isArray(params?.name)
    ? (params.name[0] ?? "")
    : (params?.name ?? "")
  const decodedWarehouseName = useMemo(
    () => decodeWarehouseName(encodedWarehouseName),
    [encodedWarehouseName]
  )

  const {
    data: warehousesData,
    isError: isWarehousesError,
    isPending: isWarehousesPending,
  } = useWarehouses({
    page: 0,
    size: DISABLE_PAGINATION_PAGE_SIZE,
  })

  const apiWarehouse = useMemo(
    () =>
      warehousesData?.content.find(
        (candidate) =>
          candidate.name.toLocaleLowerCase() ===
          decodedWarehouseName.toLocaleLowerCase()
      ),
    [decodedWarehouseName, warehousesData?.content]
  )

  const {
    data: racksData,
    isError: isRacksError,
    isPending: isRacksPending,
  } = useRacks(
    {
      page: 0,
      size: DISABLE_PAGINATION_PAGE_SIZE,
      warehouseId: apiWarehouse?.id ?? -1,
    },
    {
      enabled: !!apiWarehouse,
    }
  )

  const assortmentsPageSize = useMemo(() => {
    if (!racksData?.content) {
      return ASSORTMENTS_MIN_PAGE_SIZE
    }

    const expectedAssortmentsCount = racksData.content.reduce(
      (sum, rack) => sum + rack.occupiedSlots,
      0
    )

    return Math.max(ASSORTMENTS_MIN_PAGE_SIZE, expectedAssortmentsCount)
  }, [racksData?.content])

  const {
    data: assortmentsData,
    isError: isAssortmentsError,
    isPending: isAssortmentsPending,
  } = useAssortments({
    page: 0,
    size: assortmentsPageSize,
    warehouseId: apiWarehouse?.id ?? -1,
  })

  const warehouse = useMemo(() => {
    if (!(apiWarehouse && racksData)) {
      return null
    }
    return buildWarehouse3DFromApi(
      apiWarehouse,
      racksData.content,
      assortmentsData?.content ?? []
    )
  }, [apiWarehouse, racksData, assortmentsData?.content])

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
      return translateMessage("generated.m0076")
    }
    if (isFocusActive) {
      return translateMessage("generated.m0077")
    }
    return translateMessage("generated.m0078")
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

  const isLoading =
    isWarehousesPending || isRacksPending || isAssortmentsPending
  const isError = isWarehousesError || isRacksError || isAssortmentsError

  if (isLoading) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2"
        style={{
          height: "calc(100dvh - var(--header-height) - 3.5rem - 1px)",
        }}
      >
        <p className="text-muted-foreground text-sm">
          {translateMessage("generated.m0079")}
        </p>
      </div>
    )
  }

  if (isError) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2"
        style={{
          height: "calc(100dvh - var(--header-height) - 3.5rem - 1px)",
        }}
      >
        <p className="text-muted-foreground text-sm">
          {translateMessage("generated.m0080")}
        </p>
      </div>
    )
  }

  if (!apiWarehouse) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-2"
        style={{
          height: "calc(100dvh - var(--header-height) - 3.5rem - 1px)",
        }}
      >
        <p className="text-muted-foreground text-sm">
          {translateMessage("generated.m1093", {
            value0: decodedWarehouseName,
          })}
        </p>
      </div>
    )
  }

  if (!warehouse) {
    return null
  }

  if (warehouse.racks.length === 0) {
    return (
      <div
        className="flex flex-col gap-4 overflow-hidden"
        style={{
          height: "calc(100dvh - var(--header-height) - 3.5rem - 1px)",
        }}
      >
        <PageHeader
          backTitle={translateMessage("generated.m0078")}
          description={translateMessage("generated.m0082")}
          onBack={() => router.push("./")}
          stats={[
            {
              label: translateMessage("generated.m0083"),
              value: 0,
              icon: Layers01Icon,
            },
          ]}
          title={translateMessage("generated.m0084")}
        />
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-2xl border bg-background">
          <div className="flex max-w-sm flex-col items-center gap-4 p-8 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
              <HugeiconsIcon
                className="size-8 text-muted-foreground"
                icon={PackageSearchIcon}
              />
            </div>
            <div className="space-y-2">
              <h2 className="font-semibold text-lg">
                {translateMessage("generated.m0085")}
              </h2>
              <p className="text-muted-foreground text-sm">
                {translateMessage("generated.m0086")}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const headerStats = [
    {
      label: translateMessage("generated.m0083"),
      value: warehouse.racks.length,
    },
    {
      label: translateMessage("generated.m0879"),
      value:
        mode === "overview"
          ? translateMessage("generated.m0087")
          : translateMessage("generated.m0088"),
    },
  ]

  const panelButtons = (
    <div className="flex flex-wrap items-center gap-2 xl:hidden">
      <Sheet>
        <SheetTrigger
          className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
        >
          {translateMessage("generated.m0880")}
        </SheetTrigger>
        <SheetContent className="p-0" side="left">
          <SheetHeader className="border-b">
            <SheetTitle>{translateMessage("generated.m0089")}</SheetTitle>
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
          {translateMessage("generated.m0088")}
        </SheetTrigger>
        <SheetContent className="p-0" side="right">
          <SheetHeader className="border-b">
            <SheetTitle>{translateMessage("generated.m0090")}</SheetTitle>
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
        description={translateMessage("generated.m0082")}
        onBack={handleBack}
        stats={headerStats}
        statsChildren={panelButtons}
        title={translateMessage("generated.m0084")}
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
