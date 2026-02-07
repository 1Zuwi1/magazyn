"use client"

import { useQueryClient } from "@tanstack/react-query"
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react"
import { SCANNER_ITEM_MAX_QUANTITY } from "@/config/constants"
import { apiFetch, FetchError } from "@/lib/fetcher"
import {
  ASSORTMENT_BY_CODE_SCHEMA,
  OUTBOUND_CHECK_SCHEMA,
  OUTBOUND_EXECUTE_SCHEMA,
  OUTBOUND_PLAN_SCHEMA,
  type OutboundCheckResult,
  type OutboundExecuteResult,
  type OutboundPickSlot,
  type OutboundPlan,
} from "@/lib/schemas"
import { ScannerErrorState } from "../scanner-error-state"
import type { OutboundStep, ScanItem } from "../scanner-types"
import { OutboundChooseMethod } from "./outbound-choose-method"
import { OutboundFifoWarning } from "./outbound-fifo-warning"
import { OutboundPickList } from "./outbound-pick-list"
import { OutboundSelectItem } from "./outbound-select-item"
import { OutboundSelectQuantity } from "./outbound-select-quantity"
import { OutboundSuccess } from "./outbound-success"

const OUTBOUND_ERROR_MESSAGES: Record<string, string> = {
  ASSORTMENT_NOT_FOUND:
    "Nie znaleziono asortymentu dla zeskanowanego kodu. Sprawdź etykietę.",
  OUTBOUND_FIFO_VIOLATION:
    "Naruszenie zasady FIFO. Nie można pobrać tego asortymentu bez pominięcia FIFO.",
  USER_NOT_FOUND: "Nie znaleziono użytkownika. Zaloguj się ponownie.",
}

const getOutboundErrorMessage = (error: unknown, fallback: string): string => {
  if (!FetchError.isError(error)) {
    return fallback
  }

  if (error.code) {
    const msg = OUTBOUND_ERROR_MESSAGES[error.code]
    if (msg) {
      return msg
    }
  }

  return error.message || fallback
}

export interface OutboundFlowHandle {
  handleScanResult: (code: string) => Promise<void>
  reset: () => void
}

interface OutboundFlowProps {
  onRequestCamera: () => void
  onClose: () => void
  pendingScanCode?: string | null
  onScanCodeHandled?: () => void
}

interface Position {
  rackId: number
  positionX: number
  positionY: number
}

export const OutboundFlow = forwardRef<OutboundFlowHandle, OutboundFlowProps>(
  function OutboundFlow(
    { onRequestCamera, onClose, pendingScanCode, onScanCodeHandled },
    ref
  ) {
    const queryClient = useQueryClient()

    const [step, setStep] = useState<OutboundStep>("choose-method")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Scan flow state
    const [scannedAssortment, setScannedAssortment] = useState<Position | null>(
      null
    )
    const [fifoCheckResult, setFifoCheckResult] =
      useState<OutboundCheckResult | null>(null)

    // Select flow state
    const [selectedItem, setSelectedItem] = useState<ScanItem | null>(null)
    const [quantity, setQuantity] = useState(1)
    const [outboundPlan, setOutboundPlan] = useState<OutboundPlan | null>(null)
    const [selectedPickSlots, setSelectedPickSlots] = useState<
      OutboundPickSlot[]
    >([])

    // Result state
    const [executeResult, setExecuteResult] =
      useState<OutboundExecuteResult | null>(null)

    // ── Execute (defined first so other callbacks can reference it) ──

    const executeOutbound = useCallback(
      async (positions: Position[], shouldSkipFifo: boolean) => {
        setIsSubmitting(true)
        setError(null)

        try {
          const result = await apiFetch(
            "/api/inventory/outbound-operation/execute",
            OUTBOUND_EXECUTE_SCHEMA,
            {
              method: "POST",
              body: {
                positions,
                skipFifo: shouldSkipFifo,
              },
            }
          )

          setExecuteResult(result)
          setStep("success")

          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["assortments"] }),
            queryClient.invalidateQueries({ queryKey: ["items"] }),
          ])
        } catch (executeError) {
          setError(
            getOutboundErrorMessage(
              executeError,
              "Nie udało się wykonać operacji zdejmowania."
            )
          )
        } finally {
          setIsSubmitting(false)
        }
      },
      [queryClient]
    )

    // ── Reset ───────────────────────────────────────────────────────

    const handleReset = useCallback(() => {
      setStep("choose-method")
      setIsSubmitting(false)
      setError(null)
      setScannedAssortment(null)
      setFifoCheckResult(null)
      setSelectedItem(null)
      setQuantity(1)
      setOutboundPlan(null)
      setSelectedPickSlots([])
      setExecuteResult(null)
    }, [])

    // ── Scan flow ───────────────────────────────────────────────────

    const handleScanResult = useCallback(
      async (code: string) => {
        setError(null)
        setIsSubmitting(true)

        try {
          const assortment = await apiFetch(
            `/api/assortments/code/${encodeURIComponent(code)}`,
            ASSORTMENT_BY_CODE_SCHEMA
          )

          const position: Position = {
            rackId: assortment.rackId,
            positionX: assortment.positionX,
            positionY: assortment.positionY,
          }

          setScannedAssortment(position)

          const checkResult = await apiFetch(
            "/api/inventory/outbound-operation/check",
            OUTBOUND_CHECK_SCHEMA,
            {
              method: "POST",
              body: position,
            }
          )

          if (checkResult.fifoCompliant) {
            await executeOutbound([position], false)
          } else {
            setFifoCheckResult(checkResult)
            setStep("fifo-warning")
            setIsSubmitting(false)
          }
        } catch (scanError) {
          setError(
            getOutboundErrorMessage(
              scanError,
              "Nie udało się pobrać danych asortymentu."
            )
          )
          setIsSubmitting(false)
        }
      },
      [executeOutbound]
    )

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({ handleScanResult, reset: handleReset }), [
      handleScanResult,
      handleReset,
    ])

    useEffect(() => {
      if (!pendingScanCode) {
        return
      }

      handleScanResult(pendingScanCode)
        .catch(() => {
          // `handleScanResult` sets the component error state.
        })
        .finally(() => {
          onScanCodeHandled?.()
        })
    }, [handleScanResult, onScanCodeHandled, pendingScanCode])

    // ── Select flow ─────────────────────────────────────────────────

    const handleItemSelected = useCallback((item: ScanItem) => {
      setSelectedItem(item)
      setQuantity(1)
      setStep("select-quantity")
    }, [])

    const handlePlanOutbound = useCallback(async () => {
      if (!selectedItem) {
        return
      }

      setError(null)
      setIsSubmitting(true)

      try {
        const plan = await apiFetch(
          "/api/inventory/outbound-operation/plan",
          OUTBOUND_PLAN_SCHEMA,
          {
            method: "POST",
            body: {
              itemId: selectedItem.id,
              quantity,
            },
          }
        )

        setOutboundPlan(plan)
        setSelectedPickSlots(plan.pickSlots.slice(0, quantity))
        setStep("pick-list")
      } catch (planError) {
        setError(
          getOutboundErrorMessage(
            planError,
            "Nie udało się wyznaczyć planu pobrania."
          )
        )
      } finally {
        setIsSubmitting(false)
      }
    }, [selectedItem, quantity])

    const handleToggleSlot = useCallback((slot: OutboundPickSlot) => {
      setSelectedPickSlots((current) => {
        const exists = current.some((s) => s.assortmentId === slot.assortmentId)

        if (exists) {
          return current.filter((s) => s.assortmentId !== slot.assortmentId)
        }

        return [...current, slot]
      })
    }, [])

    const handleConfirmPickList = useCallback(async () => {
      if (selectedPickSlots.length === 0) {
        return
      }

      setError(null)
      setIsSubmitting(true)

      try {
        const positions = selectedPickSlots.map((slot) => ({
          rackId: slot.rackId,
          positionX: slot.positionX,
          positionY: slot.positionY,
        }))

        const firstPosition = positions[0]
        if (!firstPosition) {
          return
        }

        const checkResult = await apiFetch(
          "/api/inventory/outbound-operation/check",
          OUTBOUND_CHECK_SCHEMA,
          {
            method: "POST",
            body: firstPosition,
          }
        )

        if (checkResult.fifoCompliant) {
          await executeOutbound(positions, false)
        } else {
          setFifoCheckResult(checkResult)
          setStep("fifo-warning")
          setIsSubmitting(false)
        }
      } catch (checkError) {
        setError(
          getOutboundErrorMessage(
            checkError,
            "Nie udało się zweryfikować zgodności FIFO."
          )
        )
        setIsSubmitting(false)
      }
    }, [selectedPickSlots, executeOutbound])

    // ── FIFO warning actions ────────────────────────────────────────

    const handleSkipFifo = useCallback(async () => {
      const positions = scannedAssortment
        ? [scannedAssortment]
        : selectedPickSlots.map((slot) => ({
            rackId: slot.rackId,
            positionX: slot.positionX,
            positionY: slot.positionY,
          }))

      if (positions.length === 0) {
        return
      }

      await executeOutbound(positions, true)
    }, [scannedAssortment, selectedPickSlots, executeOutbound])

    const handleTakeFifoCompliant = useCallback(() => {
      if (fifoCheckResult?.olderAssortments.length) {
        setScannedAssortment(null)
        setFifoCheckResult(null)
        setError(null)
        onRequestCamera()
        return
      }

      handleReset()
    }, [fifoCheckResult, handleReset, onRequestCamera])

    // ── Quantity controls ───────────────────────────────────────────

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

    // ── Error state ─────────────────────────────────────────────────

    if (error) {
      return (
        <ScannerErrorState
          error={error}
          onRetry={() => {
            setError(null)
            if (scannedAssortment) {
              onRequestCamera()
            } else if (outboundPlan) {
              setStep("pick-list")
            } else if (selectedItem) {
              setStep("select-quantity")
            } else {
              setStep("choose-method")
            }
          }}
        />
      )
    }

    // ── Step rendering ──────────────────────────────────────────────

    if (step === "choose-method") {
      return (
        <OutboundChooseMethod
          onCancel={onClose}
          onScan={onRequestCamera}
          onSelect={() => setStep("select-item")}
        />
      )
    }

    if (step === "select-item") {
      return (
        <OutboundSelectItem
          onCancel={() => setStep("choose-method")}
          onSelect={handleItemSelected}
        />
      )
    }

    if (step === "select-quantity" && selectedItem) {
      return (
        <OutboundSelectQuantity
          isSubmitting={isSubmitting}
          item={selectedItem}
          onCancel={() => setStep("select-item")}
          onDecrease={handleQuantityDecrease}
          onIncrease={handleQuantityIncrease}
          onQuantityChange={handleQuantityChange}
          onSubmit={handlePlanOutbound}
          quantity={quantity}
        />
      )
    }

    if (step === "pick-list" && outboundPlan) {
      return (
        <OutboundPickList
          isSubmitting={isSubmitting}
          onCancel={() => setStep("select-quantity")}
          onConfirm={handleConfirmPickList}
          onToggleSlot={handleToggleSlot}
          plan={outboundPlan}
          selectedSlots={selectedPickSlots}
        />
      )
    }

    if (step === "fifo-warning" && fifoCheckResult) {
      return (
        <OutboundFifoWarning
          checkResult={fifoCheckResult}
          isSubmitting={isSubmitting}
          onCancel={() => {
            setFifoCheckResult(null)
            if (outboundPlan) {
              setStep("pick-list")
            } else {
              handleReset()
            }
          }}
          onSkipFifo={handleSkipFifo}
          onTakeFifoCompliant={handleTakeFifoCompliant}
        />
      )
    }

    if (step === "success" && executeResult) {
      return <OutboundSuccess onReset={handleReset} result={executeResult} />
    }

    return (
      <OutboundChooseMethod
        onCancel={onClose}
        onScan={onRequestCamera}
        onSelect={() => setStep("select-item")}
      />
    )
  }
)
