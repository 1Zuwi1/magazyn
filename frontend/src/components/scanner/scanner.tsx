"use client"

import { QrCodeIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useQueryClient } from "@tanstack/react-query"
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import z from "zod"
import { SCAN_DELAY_MS, SCANNER_ITEM_MAX_QUANTITY } from "@/config/constants"
import { useIsMobile } from "@/hooks/use-mobile"
import { createApiSchema } from "@/lib/create-api-schema"
import { apiFetch, FetchError } from "@/lib/fetcher"
import { WarehousesSchema } from "@/lib/schemas"
import { cn } from "@/lib/utils"
import { buttonVariants } from "../ui/button"
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog"
import { ErrorBoundary } from "../ui/error-boundary"
import { ScannerBody } from "./scanner-body"
import { ScannerCamera } from "./scanner-camera"
import { ScannerErrorState } from "./scanner-error-state"
import { ScannerLocationsStep } from "./scanner-locations-step"
import { ScannerQuantityStep } from "./scanner-quantity-step"
import { ScannerSuccessStep } from "./scanner-success-step"
import type {
  EditablePlacement,
  PlacementPlan,
  PlacementPlanLocation,
  ScanItem,
} from "./scanner-types"

interface ScannerProps {
  /** Prevents spamming the same result continuously */
  scanDelayMs?: number
  /** Stop camera as soon as a QR is read */
  stopOnScan?: boolean
  /** Override camera constraints if you want */
  constraints?: MediaStreamConstraints
  warehouseName?: string
  className?: string
  /** Children to show instead of camera (e.g. scan results) */
  children?: ReactNode

  /** Custom trigger for opening the scanner dialog */
  dialogTrigger?: ReactNode
}

export const TAB_TRIGGERS = [
  {
    text: "Przyjmowanie",
    action: "take",
  },
  {
    text: "Zdejmowanie",
    action: "remove",
  },
] as const

const ITEM_BY_BARCODE_SCHEMA = createApiSchema({
  GET: {
    output: z.object({
      id: z.number().int().nonnegative(),
      barcode: z.string(),
      name: z.string(),
      photoUrl: z.string().nullable(),
      minTemp: z.number(),
      maxTemp: z.number(),
      weight: z.number(),
      sizeX: z.number(),
      sizeY: z.number(),
      sizeZ: z.number(),
      comment: z.string().nullable(),
      expireAfterDays: z.number(),
      dangerous: z.boolean(),
    }),
  },
})

const PLACEMENT_PLAN_SCHEMA = createApiSchema({
  POST: {
    input: z.object({
      itemId: z.number().int().nonnegative(),
      quantity: z.number().int().positive(),
      warehouseId: z.number().int().nonnegative(),
      reserve: z.boolean(),
    }),
    output: z.object({
      itemId: z.number().int().nonnegative(),
      requestedQuantity: z.number().int().nonnegative(),
      allocatedQuantity: z.number().int().nonnegative(),
      remainingQuantity: z.number().int().nonnegative(),
      placements: z.array(
        z.object({
          rackId: z.number().int().nonnegative(),
          rackMarker: z.string(),
          positionX: z.number().int().nonnegative(),
          positionY: z.number().int().nonnegative(),
        })
      ),
      reserved: z.boolean(),
      reservedUntil: z.string().nullable(),
      reservedCount: z.number().int().nonnegative(),
    }),
  },
})

const PLACEMENT_CONFIRM_SCHEMA = createApiSchema({
  POST: {
    input: z.object({
      itemId: z.number().int().nonnegative(),
      barcode: z.string().min(1),
      placements: z
        .array(
          z.object({
            rackId: z.number().int().nonnegative(),
            positionX: z.number().int().nonnegative(),
            positionY: z.number().int().nonnegative(),
          })
        )
        .min(1),
    }),
    output: z.unknown(),
  },
})

const WAREHOUSE_LOOKUP_PAGE_SIZE = 500

const SCANNER_ERROR_MESSAGES = {
  ITEM_NOT_FOUND: "Nie znaleziono produktu dla zeskanowanego kodu.",
  INVALID_INPUT: "Wprowadzono nieprawidłowe dane. Sprawdź i spróbuj ponownie.",
  PLACEMENT_INVALID:
    "Wybrany regał nie spełnia wymagań dla tego produktu. Zmień lokalizację.",
  PLACEMENT_CONFLICT:
    "Wybrana pozycja jest zajęta. Ustaw inną lokalizację i potwierdź ponownie.",
} as const

type Step = "camera" | "quantity" | "locations" | "success"

interface ScannerState {
  step: Step
  isLoading: boolean
  isSubmitting: boolean
}

const normalizeWarehouseName = (warehouseName: string): string => {
  return warehouseName.trim().toLocaleLowerCase()
}

const getScannerErrorMessage = (error: unknown, fallback: string): string => {
  if (!FetchError.isError(error)) {
    return fallback
  }

  if (error.code) {
    const code = error.code as keyof typeof SCANNER_ERROR_MESSAGES
    if (Object.hasOwn(SCANNER_ERROR_MESSAGES, code)) {
      return SCANNER_ERROR_MESSAGES[code]
    }
  }

  return error.message || fallback
}

export function Scanner({
  scanDelayMs = SCAN_DELAY_MS,
  stopOnScan = false,
  constraints,
  warehouseName,
  className,
  dialogTrigger,
  children,
}: ScannerProps) {
  const isMobile = useIsMobile()
  const queryClient = useQueryClient()
  const [mode, setMode] = useState<(typeof TAB_TRIGGERS)[number]["action"]>(
    TAB_TRIGGERS[0].action
  )
  const [open, setOpen] = useState<boolean>(false)
  const armedRef = useRef<boolean>(false)
  const [scannerState, setScannerState] = useState<ScannerState>({
    step: "camera",
    isLoading: false,
    isSubmitting: false,
  })
  const [quantity, setQuantity] = useState<number>(1)
  const [reserve, setReserve] = useState<boolean>(true)
  const [scannedItem, setScannedItem] = useState<ScanItem | null>(null)
  const [scannedBarcode, setScannedBarcode] = useState<string>("")
  const [placementPlan, setPlacementPlan] = useState<PlacementPlan | null>(null)
  const [editablePlacements, setEditablePlacements] = useState<
    EditablePlacement[]
  >([])
  const [confirmedPlacementsCount, setConfirmedPlacementsCount] =
    useState<number>(0)
  const [error, setError] = useState<string | null>(null)

  const placementIdRef = useRef<number>(0)
  const warehouseCacheRef = useRef<{ name: string; id: number } | null>(null)

  const { step, isLoading, isSubmitting } = scannerState

  useEffect(() => {
    if (!open) {
      return
    }

    if (!armedRef.current) {
      window.history.pushState({ __overlay: true }, "", window.location.href)
      armedRef.current = true
    }

    const onPopState = () => {
      if (open) {
        setOpen(false)
        armedRef.current = false
      }
    }

    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [open])

  const createEditablePlacement = useCallback(
    (placement?: PlacementPlanLocation): EditablePlacement => {
      placementIdRef.current += 1

      return {
        id: String(placementIdRef.current),
        rackId: placement?.rackId ?? 0,
        positionX: placement?.positionX ?? 0,
        positionY: placement?.positionY ?? 0,
        rackMarker: placement?.rackMarker,
      }
    },
    []
  )

  const handleReset = useCallback(() => {
    setScannerState({
      step: "camera",
      isLoading: false,
      isSubmitting: false,
    })
    setQuantity(1)
    setReserve(true)
    setScannedItem(null)
    setScannedBarcode("")
    setPlacementPlan(null)
    setEditablePlacements([])
    setConfirmedPlacementsCount(0)
    setError(null)
    placementIdRef.current = 0
  }, [])

  const closeDialog = useCallback(() => {
    if (!open) {
      return
    }

    setOpen(false)

    if (armedRef.current) {
      armedRef.current = false
      window.history.back()
    }
    handleReset()
  }, [open, handleReset])

  const resolveCurrentWarehouseId = useCallback(async (): Promise<number> => {
    const warehouseLabel = warehouseName?.trim()
    if (!warehouseLabel) {
      throw new Error("Wybierz magazyn, aby zaplanować rozmieszczenie.")
    }

    const normalizedLabel = normalizeWarehouseName(warehouseLabel)
    if (warehouseCacheRef.current?.name === normalizedLabel) {
      return warehouseCacheRef.current.id
    }

    const warehouses = await apiFetch("/api/warehouses", WarehousesSchema, {
      queryParams: {
        page: 0,
        size: WAREHOUSE_LOOKUP_PAGE_SIZE,
      },
    })

    const currentWarehouse = warehouses.content.find((warehouse) => {
      return normalizeWarehouseName(warehouse.name) === normalizedLabel
    })

    if (!currentWarehouse) {
      throw new Error(`Nie znaleziono magazynu: ${warehouseLabel}`)
    }

    warehouseCacheRef.current = {
      name: normalizedLabel,
      id: currentWarehouse.id,
    }
    return currentWarehouse.id
  }, [warehouseName])

  const onScan = useCallback(async (rawCode: string) => {
    const barcode = rawCode.trim()
    if (!barcode) {
      setError("Nie udało się odczytać kodu. Spróbuj ponownie.")
      return
    }

    setError(null)
    setScannerState((current) => ({
      ...current,
      isLoading: true,
    }))

    try {
      const item = await apiFetch(
        `/api/items/barcode/${encodeURIComponent(barcode)}`,
        ITEM_BY_BARCODE_SCHEMA
      )

      setScannedItem(item)
      setScannedBarcode(barcode)
      setPlacementPlan(null)
      setEditablePlacements([])
      setConfirmedPlacementsCount(0)
      setScannerState({
        step: "quantity",
        isLoading: false,
        isSubmitting: false,
      })
    } catch (scanError) {
      setScannedItem(null)
      setScannedBarcode("")
      setPlacementPlan(null)
      setEditablePlacements([])
      setError(
        getScannerErrorMessage(
          scanError,
          "Nie udało się pobrać danych produktu dla zeskanowanego kodu."
        )
      )
      setScannerState({
        step: "camera",
        isLoading: false,
        isSubmitting: false,
      })
    }
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!scannedItem) {
      return
    }

    setError(null)
    setScannerState((current) => ({
      ...current,
      isSubmitting: true,
    }))

    try {
      const warehouseId = await resolveCurrentWarehouseId()
      const plan = await apiFetch(
        "/api/inventory/placements/plan",
        PLACEMENT_PLAN_SCHEMA,
        {
          method: "POST",
          body: {
            itemId: scannedItem.id,
            quantity,
            warehouseId,
            reserve,
          },
        }
      )

      const placements = [
        ...plan.placements.map((placement) =>
          createEditablePlacement(placement)
        ),
        ...Array.from({ length: plan.remainingQuantity }, () =>
          createEditablePlacement()
        ),
      ]

      if (placements.length === 0) {
        placements.push(createEditablePlacement())
      }

      setPlacementPlan(plan)
      setEditablePlacements(placements)
      setScannerState((current) => ({
        ...current,
        step: "locations",
        isSubmitting: false,
      }))
    } catch (planError) {
      setError(
        getScannerErrorMessage(
          planError,
          "Nie udało się przygotować planu rozmieszczenia dla tego produktu."
        )
      )
      setScannerState((current) => ({
        ...current,
        isSubmitting: false,
      }))
    }
  }, [
    createEditablePlacement,
    quantity,
    reserve,
    resolveCurrentWarehouseId,
    scannedItem,
  ])

  const handleConfirmPlacement = useCallback(async () => {
    if (!scannedItem) {
      return
    }

    if (editablePlacements.length === 0) {
      setError("Dodaj co najmniej jedną lokalizację przed potwierdzeniem.")
      return
    }

    setError(null)
    setScannerState((current) => ({
      ...current,
      isSubmitting: true,
    }))

    try {
      await apiFetch(
        "/api/inventory/placements/confirm",
        PLACEMENT_CONFIRM_SCHEMA,
        {
          method: "POST",
          body: {
            itemId: scannedItem.id,
            barcode: scannedBarcode || scannedItem.barcode,
            placements: editablePlacements.map((placement) => ({
              rackId: placement.rackId,
              positionX: placement.positionX,
              positionY: placement.positionY,
            })),
          },
        }
      )

      setConfirmedPlacementsCount(editablePlacements.length)
      setScannerState((current) => ({
        ...current,
        step: "success",
        isSubmitting: false,
      }))

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["assortments"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["items"],
        }),
      ])
    } catch (confirmError) {
      setError(
        getScannerErrorMessage(
          confirmError,
          "Nie udało się potwierdzić rozmieszczenia. Spróbuj ponownie."
        )
      )
      setScannerState((current) => ({
        ...current,
        isSubmitting: false,
      }))
    }
  }, [editablePlacements, queryClient, scannedBarcode, scannedItem])

  const handleQuantityDecrease = useCallback(() => {
    setQuantity((current) => Math.max(1, current - 1))
  }, [])

  const handleQuantityIncrease = useCallback(() => {
    setQuantity((current) =>
      Math.max(1, Math.min(current + 1, SCANNER_ITEM_MAX_QUANTITY))
    )
  }, [])

  const handleQuantityChange = useCallback((value: number) => {
    setQuantity(Math.max(1, Math.min(value, SCANNER_ITEM_MAX_QUANTITY)))
  }, [])

  const handleAddPlacement = useCallback(() => {
    setEditablePlacements((current) => [...current, createEditablePlacement()])
  }, [createEditablePlacement])

  const handleRemovePlacement = useCallback((placementId: string) => {
    setEditablePlacements((current) => {
      if (current.length <= 1) {
        return current
      }

      return current.filter((placement) => placement.id !== placementId)
    })
  }, [])

  const handlePlacementChange = useCallback(
    (
      placementId: string,
      field: "rackId" | "positionX" | "positionY",
      value: number
    ) => {
      setEditablePlacements((current) =>
        current.map((placement) => {
          if (placement.id !== placementId) {
            return placement
          }

          return {
            ...placement,
            [field]: value,
          }
        })
      )
    },
    []
  )

  const isConfirmDisabled = useMemo(() => {
    if (editablePlacements.length === 0) {
      return true
    }

    return editablePlacements.some((placement) => {
      return (
        !(
          Number.isInteger(placement.rackId) &&
          Number.isInteger(placement.positionX) &&
          Number.isInteger(placement.positionY)
        ) ||
        placement.rackId < 0 ||
        placement.positionX < 0 ||
        placement.positionY < 0
      )
    })
  }, [editablePlacements])

  const handleErrorReset = useCallback(() => {
    setError(null)
  }, [])

  const renderScannerFallback = useCallback(
    (_error: Error, reset: () => void) => (
      <ScannerErrorState
        error="Wystąpił problem z działaniem skanera. Spróbuj ponownie."
        onRetry={() => {
          handleReset()
          reset()
        }}
      />
    ),
    [handleReset]
  )

  let content: ReactNode = (
    <ScannerCamera
      constraints={constraints}
      isLoading={isLoading}
      isMobile={isMobile}
      isOpen={open}
      mode={mode}
      onModeChange={setMode}
      onRequestClose={closeDialog}
      onScan={onScan}
      scanDelayMs={scanDelayMs}
      stopOnScan={stopOnScan}
      warehouseName={warehouseName}
    />
  )

  if (children) {
    content = <ScannerBody>{children}</ScannerBody>
  } else if (error) {
    content = <ScannerErrorState error={error} onRetry={handleErrorReset} />
  } else if (step === "quantity" && scannedItem) {
    content = (
      <ScannerQuantityStep
        isSubmitting={isSubmitting}
        onCancel={handleReset}
        onDecrease={handleQuantityDecrease}
        onIncrease={handleQuantityIncrease}
        onQuantityChange={handleQuantityChange}
        onReserveChange={setReserve}
        onSubmit={handleSubmit}
        quantity={quantity}
        reserve={reserve}
        scannedItem={scannedItem}
      />
    )
  } else if (step === "locations" && scannedItem && placementPlan) {
    content = (
      <ScannerLocationsStep
        isConfirmDisabled={isConfirmDisabled}
        isSubmitting={isSubmitting}
        onAddPlacement={handleAddPlacement}
        onBack={() =>
          setScannerState((current) => ({ ...current, step: "quantity" }))
        }
        onConfirm={handleConfirmPlacement}
        onPlacementChange={handlePlacementChange}
        onRemovePlacement={handleRemovePlacement}
        placements={editablePlacements}
        plan={placementPlan}
      />
    )
  } else if (step === "success" && scannedItem) {
    content = (
      <ScannerSuccessStep
        itemName={scannedItem.name}
        onReset={handleReset}
        placementsCount={confirmedPlacementsCount}
      />
    )
  }

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setOpen(true)
        } else {
          closeDialog()
        }
      }}
      open={open}
    >
      {dialogTrigger ? (
        dialogTrigger
      ) : (
        <DialogTrigger
          aria-label="Skaner kodów"
          className={buttonVariants({
            variant: "ghost",
            size: "icon",
            className: "mr-1 ml-auto size-8 rounded-xl sm:size-10",
          })}
          title="Skaner kodów"
        >
          <HugeiconsIcon icon={QrCodeIcon} />
        </DialogTrigger>
      )}
      <DialogContent
        className={cn(
          "p-0",
          isMobile ? "h-dvh w-screen max-w-none rounded-none" : ""
        )}
        showCloseButton={false}
      >
        <div
          className={cn(
            "relative overflow-hidden",
            isMobile
              ? "h-full w-full py-8"
              : "aspect-3/4 w-full rounded-lg border",
            className
          )}
        >
          <ErrorBoundary
            fallback={renderScannerFallback}
            resetKeys={[open, step, scannedItem?.id]}
          >
            {content}
          </ErrorBoundary>
        </div>
      </DialogContent>
    </Dialog>
  )
}
