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
import { SCAN_DELAY_MS, SCANNER_ITEM_MAX_QUANTITY } from "@/config/constants"
import { useCurrentWarehouseId } from "@/hooks/use-current-warehouse-id"
import { useIsMobile } from "@/hooks/use-mobile"
import { apiFetch, FetchError } from "@/lib/fetcher"
import {
  type IdentificationCandidate,
  type IdentificationResult,
  INBOUND_OPERATION_EXECUTE_SCHEMA,
  INBOUND_OPERATION_PLAN_SCHEMA,
  ITEM_BY_CODE_SCHEMA,
  ITEM_IDENTIFY_MISMATCH_SCHEMA,
  ITEM_IDENTIFY_SCHEMA,
} from "@/lib/schemas"
import { cn } from "@/lib/utils"
import { buttonVariants } from "../ui/button"
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog"
import { ErrorBoundary } from "../ui/error-boundary"
import { OutboundFlow, type OutboundFlowHandle } from "./outbound/outbound-flow"
import { ScannerBody } from "./scanner-body"
import { ScannerCamera } from "./scanner-camera"
import { ScannerErrorState } from "./scanner-error-state"
import { ScannerIdentifyStep } from "./scanner-identify-step"
import { ScannerLocationsStep } from "./scanner-locations-step"
import { ScannerManualInput } from "./scanner-manual-input"
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

const SCANNER_ERROR_MESSAGES = {
  ITEM_NOT_FOUND: "Nie znaleziono produktu dla zeskanowanego kodu.",
  INVALID_INPUT: "Wprowadzono nieprawidłowe dane. Sprawdź i spróbuj ponownie.",
  PLACEMENT_INVALID:
    "Wybrany regał nie spełnia wymagań dla tego produktu. Zmień lokalizację.",
  PLACEMENT_CONFLICT:
    "Wybrana pozycja jest zajęta. Ustaw inną lokalizację i potwierdź ponownie.",
} as const

type Step =
  | "camera"
  | "manual-input"
  | "identify"
  | "quantity"
  | "locations"
  | "success"

interface ScannerState {
  step: Step
  isLoading: boolean
  isSubmitting: boolean
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
  const outboundRef = useRef<OutboundFlowHandle>(null)
  const [scannerState, setScannerState] = useState<ScannerState>({
    step: "camera",
    isLoading: false,
    isSubmitting: false,
  })
  const [quantity, setQuantity] = useState<number>(1)
  const [reserve, setReserve] = useState<boolean>(true)
  const [scannedItem, setScannedItem] = useState<ScanItem | null>(null)
  const [scannedCode, setScannedCode] = useState<string>("")
  const [placementPlan, setPlacementPlan] = useState<PlacementPlan | null>(null)
  const [currentWarehouseId, setCurrentWarehouseId] = useState<number | null>(
    null
  )
  const [editablePlacements, setEditablePlacements] = useState<
    EditablePlacement[]
  >([])
  const [confirmedPlacementsCount, setConfirmedPlacementsCount] =
    useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [lastManualCode, setLastManualCode] = useState<string>("")
  const [identificationResult, setIdentificationResult] =
    useState<IdentificationResult | null>(null)
  const [isReportingMismatch, setIsReportingMismatch] = useState<boolean>(false)
  const [outboundShowsCamera, setOutboundShowsCamera] = useState<boolean>(true)
  const [pendingOutboundScanCode, setPendingOutboundScanCode] = useState<
    string | null
  >(null)

  const placementIdRef = useRef<number>(0)
  const { warehouseId, isHydrated } = useCurrentWarehouseId()

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
        rackId: placement?.rackId ?? -1,
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
    setScannedCode("")
    setPlacementPlan(null)
    setCurrentWarehouseId(null)
    setEditablePlacements([])
    setConfirmedPlacementsCount(0)
    setError(null)
    setLastManualCode("")
    setIdentificationResult(null)
    setIsReportingMismatch(false)
    setPendingOutboundScanCode(null)
    setOutboundShowsCamera(true)
    placementIdRef.current = 0
    outboundRef.current?.reset()
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

  const resolveCurrentWarehouseId = useCallback((): number => {
    if (!isHydrated) {
      throw new Error(
        "Trwa odczytywanie kontekstu magazynu. Spróbuj ponownie za chwilę."
      )
    }

    if (warehouseId === null) {
      throw new Error("Nie znaleziono warehouseId dla bieżącej sesji.")
    }

    return warehouseId
  }, [isHydrated, warehouseId])

  const onScan = useCallback(async (rawCode: string) => {
    const code = rawCode.trim()
    if (!code) {
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
        `/api/items/code/${encodeURIComponent(code)}`,
        ITEM_BY_CODE_SCHEMA
      )

      setScannedItem(item)
      setScannedCode(code)
      setPlacementPlan(null)
      setCurrentWarehouseId(null)
      setEditablePlacements([])
      setConfirmedPlacementsCount(0)
      setScannerState({
        step: "quantity",
        isLoading: false,
        isSubmitting: false,
      })
    } catch (scanError) {
      setScannedItem(null)
      setScannedCode("")
      setPlacementPlan(null)
      setCurrentWarehouseId(null)
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

  const onManualScan = useCallback(async (code: string) => {
    setLastManualCode(code)
    const trimmed = code.trim()
    if (!trimmed) {
      return
    }

    setError(null)
    setScannerState((current) => ({
      ...current,
      isLoading: true,
    }))

    try {
      const item = await apiFetch(
        `/api/items/code/${encodeURIComponent(trimmed)}`,
        ITEM_BY_CODE_SCHEMA
      )

      setScannedItem(item)
      setScannedCode(trimmed)
      setLastManualCode("")
      setPlacementPlan(null)
      setCurrentWarehouseId(null)
      setEditablePlacements([])
      setConfirmedPlacementsCount(0)
      setScannerState({
        step: "quantity",
        isLoading: false,
        isSubmitting: false,
      })
    } catch (scanError) {
      setScannedItem(null)
      setScannedCode("")
      setPlacementPlan(null)
      setCurrentWarehouseId(null)
      setEditablePlacements([])
      setError(
        getScannerErrorMessage(
          scanError,
          "Nie udało się pobrać danych produktu dla wprowadzonego kodu."
        )
      )
      setScannerState({
        step: "manual-input",
        isLoading: false,
        isSubmitting: false,
      })
    }
  }, [])

  const onTakePhoto = useCallback(async (file: File) => {
    setError(null)
    setScannerState((current) => ({
      ...current,
      isLoading: true,
    }))

    try {
      const result = await apiFetch(
        "/api/items/identify",
        ITEM_IDENTIFY_SCHEMA,
        {
          method: "POST",
          body: { file },
          formData: (formData, data) => {
            formData.append("file", data.file)
          },
        }
      )

      if (!result.itemId) {
        setError("Nie udało się rozpoznać przedmiotu ze zdjęcia.")
        setScannerState({
          step: "camera",
          isLoading: false,
          isSubmitting: false,
        })
        return
      }

      setIdentificationResult(result)
      setScannerState({
        step: "identify",
        isLoading: false,
        isSubmitting: false,
      })
    } catch (photoError) {
      setError(
        getScannerErrorMessage(
          photoError,
          "Nie udało się rozpoznać przedmiotu ze zdjęcia."
        )
      )
      setScannerState({
        step: "camera",
        isLoading: false,
        isSubmitting: false,
      })
    }
  }, [])

  const onAcceptIdentification = useCallback(
    async (candidate: IdentificationCandidate) => {
      setError(null)
      setScannerState((current) => ({
        ...current,
        isLoading: true,
      }))

      try {
        const item = await apiFetch(
          `/api/items/code/${encodeURIComponent(candidate.code)}`,
          ITEM_BY_CODE_SCHEMA
        )

        setScannedItem(item)
        setScannedCode(candidate.code)
        setPlacementPlan(null)
        setCurrentWarehouseId(null)
        setEditablePlacements([])
        setConfirmedPlacementsCount(0)
        setIdentificationResult(null)
        setScannerState({
          step: "quantity",
          isLoading: false,
          isSubmitting: false,
        })
      } catch (fetchError) {
        setError(
          getScannerErrorMessage(
            fetchError,
            "Nie udało się pobrać danych przedmiotu."
          )
        )
        setScannerState({
          step: "identify",
          isLoading: false,
          isSubmitting: false,
        })
      }
    },
    []
  )

  const onReportMismatch = useCallback(
    async (rejectedItemId: number) => {
      if (!identificationResult) {
        return
      }

      setIsReportingMismatch(true)

      try {
        const result = await apiFetch(
          "/api/items/identify/mismatch",
          ITEM_IDENTIFY_MISMATCH_SCHEMA,
          {
            method: "POST",
            body: {
              identificationId: identificationResult.identificationId,
              rejectedItemId,
            },
          }
        )

        setIdentificationResult(result)
      } catch (mismatchError) {
        setError(
          getScannerErrorMessage(
            mismatchError,
            "Nie udało się zgłosić niezgodności."
          )
        )
      } finally {
        setIsReportingMismatch(false)
      }
    },
    [identificationResult]
  )

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
      const warehouseId = resolveCurrentWarehouseId()
      setCurrentWarehouseId(warehouseId)
      const plan = await apiFetch(
        "/api/inventory/inbound-operation/plan",
        INBOUND_OPERATION_PLAN_SCHEMA,
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
      console.error(planError)
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
        "/api/inventory/inbound-operation/execute",
        INBOUND_OPERATION_EXECUTE_SCHEMA,
        {
          method: "POST",
          body: {
            itemId: scannedItem.id,
            code: scannedCode || scannedItem.code,
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
  }, [editablePlacements, queryClient, scannedCode, scannedItem])

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

  const handleManualInputCancel = useCallback(() => {
    setError(null)
    setLastManualCode("")
    setPendingOutboundScanCode(null)
    setOutboundShowsCamera(true)
    setScannerState({
      step: "camera",
      isLoading: false,
      isSubmitting: false,
    })
  }, [])

  const handleManualInputOpen = useCallback(() => {
    setScannerState({
      step: "manual-input",
      isLoading: false,
      isSubmitting: false,
    })
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

  const queueOutboundScanCode = useCallback((rawCode: string) => {
    const code = rawCode.trim()
    if (!code) {
      return false
    }

    setError(null)
    setPendingOutboundScanCode(code)
    setOutboundShowsCamera(false)
    setScannerState((current) => ({
      ...current,
      step: "camera",
      isLoading: false,
      isSubmitting: false,
    }))

    return true
  }, [])

  const handleOutboundManualScan = useCallback(
    (rawCode: string) => {
      setLastManualCode(rawCode)

      const didQueueCode = queueOutboundScanCode(rawCode)
      if (didQueueCode) {
        setLastManualCode("")
      }
    },
    [queueOutboundScanCode]
  )

  const handleOutboundRequestCamera = useCallback(() => {
    setPendingOutboundScanCode(null)
    setOutboundShowsCamera(true)
    setScannerState({
      step: "camera",
      isLoading: false,
      isSubmitting: false,
    })
  }, [])

  const handleOutboundScanCodeHandled = useCallback(() => {
    setPendingOutboundScanCode(null)
  }, [])

  const handleModeChange = useCallback(
    (
      nextMode: (typeof TAB_TRIGGERS)[number]["action"],
      options?: {
        keepManualInput?: boolean
      }
    ) => {
      setMode(nextMode)
      handleReset()

      if (options?.keepManualInput) {
        setScannerState({
          step: "manual-input",
          isLoading: false,
          isSubmitting: false,
        })
      }
    },
    [handleReset]
  )

  const handleManualInputModeChange = useCallback(
    (nextMode: (typeof TAB_TRIGGERS)[number]["action"]) => {
      handleModeChange(nextMode, { keepManualInput: true })
    },
    [handleModeChange]
  )

  // ── Inbound content helper ────────────────────────────────────────

  function resolveInboundContent(): ReactNode {
    if (step === "camera") {
      return (
        <ScannerCamera
          constraints={constraints}
          isLoading={isLoading}
          isMobile={isMobile}
          isOpen={open}
          mode={mode}
          onManualInput={handleManualInputOpen}
          onModeChange={handleModeChange}
          onRequestClose={closeDialog}
          onScan={onScan}
          onTakePhoto={onTakePhoto}
          scanDelayMs={scanDelayMs}
          stopOnScan={stopOnScan}
          warehouseName={warehouseName}
        />
      )
    }

    if (step === "identify" && identificationResult) {
      return (
        <ScannerIdentifyStep
          isAccepting={isLoading}
          isReporting={isReportingMismatch}
          onAccept={onAcceptIdentification}
          onCancel={handleReset}
          onMismatch={onReportMismatch}
          result={identificationResult}
        />
      )
    }

    if (error) {
      return <ScannerErrorState error={error} onRetry={handleErrorReset} />
    }

    if (step === "quantity" && scannedItem) {
      return (
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
    }

    if (step === "locations" && scannedItem && placementPlan) {
      return (
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
          warehouseId={currentWarehouseId}
        />
      )
    }

    if (step === "success" && scannedItem) {
      return (
        <ScannerSuccessStep
          itemName={scannedItem.name}
          onReset={handleReset}
          placementsCount={confirmedPlacementsCount}
        />
      )
    }

    // Default: show camera
    return (
      <ScannerCamera
        constraints={constraints}
        isLoading={isLoading}
        isMobile={isMobile}
        isOpen={open}
        mode={mode}
        onManualInput={handleManualInputOpen}
        onModeChange={handleModeChange}
        onRequestClose={closeDialog}
        onScan={onScan}
        onTakePhoto={onTakePhoto}
        scanDelayMs={scanDelayMs}
        stopOnScan={stopOnScan}
        warehouseName={warehouseName}
      />
    )
  }

  function renderManualInput(): ReactNode {
    return (
      <ScannerManualInput
        error={mode === "take" ? error : null}
        initialCode={lastManualCode}
        isLoading={isLoading}
        mode={mode}
        onCancel={handleManualInputCancel}
        onModeChange={handleManualInputModeChange}
        onSubmit={mode === "remove" ? handleOutboundManualScan : onManualScan}
      />
    )
  }

  // ── Content resolution ──────────────────────────────────────────────

  let content: ReactNode

  if (children) {
    content = <ScannerBody>{children}</ScannerBody>
  } else if (step === "manual-input") {
    content = renderManualInput()
  } else if (mode === "remove") {
    // Outbound mode: show camera when scanning, otherwise delegate to OutboundFlow
    if (outboundShowsCamera) {
      content = (
        <ScannerCamera
          constraints={constraints}
          isLoading={isLoading}
          isMobile={isMobile}
          isOpen={open}
          mode={mode}
          onManualInput={handleManualInputOpen}
          onModeChange={handleModeChange}
          onRequestClose={closeDialog}
          onScan={queueOutboundScanCode}
          onTakePhoto={onTakePhoto}
          scanDelayMs={scanDelayMs}
          stopOnScan={stopOnScan}
          warehouseName={warehouseName}
        />
      )
    } else {
      content = (
        <OutboundFlow
          onClose={closeDialog}
          onRequestCamera={handleOutboundRequestCamera}
          onScanCodeHandled={handleOutboundScanCodeHandled}
          pendingScanCode={pendingOutboundScanCode}
          ref={outboundRef}
        />
      )
    }
  } else {
    content = resolveInboundContent()
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
          isMobile ? "h-dvh w-screen max-w-none! rounded-none" : ""
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
