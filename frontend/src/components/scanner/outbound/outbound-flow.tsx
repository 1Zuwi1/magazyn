"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useTranslations } from "next-intl"
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react"
import { SCANNER_ITEM_MAX_QUANTITY } from "@/config/constants"
import type { AppTranslate } from "@/i18n/use-translations"
import { apiFetch, FetchError } from "@/lib/fetcher"
import {
  type OutboundCheckResult,
  OutboundCheckSchema,
  type OutboundExecuteResult,
  OutboundExecuteSchema,
  type OutboundPickSlot,
  type OutboundPlan,
  OutboundPlanSchema,
} from "@/lib/schemas"
import { ScannerErrorState } from "../scanner-error-state"
import type {
  OutboundStep,
  ScanItem,
  ScannedVerificationEntry,
} from "../scanner-types"
import { OutboundChooseMethod } from "./outbound-choose-method"
import { OutboundFifoWarning } from "./outbound-fifo-warning"
import { OutboundPickList } from "./outbound-pick-list"
import { OutboundScanVerification } from "./outbound-scan-verification"
import { OutboundSelectItem } from "./outbound-select-item"
import { OutboundSelectQuantity } from "./outbound-select-quantity"
import { OutboundSuccess } from "./outbound-success"

const getOutboundErrorMessages = (t: AppTranslate): Record<string, string> => ({
  ASSORTMENT_NOT_FOUND: t(
    "generated.scanner.outbound.assortmentFoundScannedCodeCheck"
  ),
  OUTBOUND_FIFO_VIOLATION: t(
    "generated.scanner.outbound.fifoRuleViolationCannotPick"
  ),
  USER_NOT_FOUND: t("generated.scanner.outbound.userFoundSignAgain"),
})

const getOutboundErrorMessage = (
  error: unknown,
  fallback: string,
  errorMessages: Record<string, string>
): string => {
  if (!FetchError.isError(error)) {
    return fallback
  }

  if (error.code) {
    const msg = errorMessages[error.code]
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
  /** When provided by the parent (from the shared select-item screen), skip
   *  the internal choose-method / select-item steps and go straight to
   *  select-quantity. */
  selectedItem?: ScanItem | null
  /** Called when OutboundFlow wants to fully reset back to the parent's
   *  choose-method screen (e.g. after a successful operation). */
  onReset?: () => void
  ref?: React.Ref<OutboundFlowHandle>
}

export const OutboundFlow = ({
  onRequestCamera,
  onClose,
  pendingScanCode,
  onScanCodeHandled,
  selectedItem: parentSelectedItem,
  onReset: parentOnReset,
  ref,
}: OutboundFlowProps) => {
  const t = useTranslations()
  const outboundErrorMessages = useMemo(() => getOutboundErrorMessages(t), [t])

  const queryClient = useQueryClient()

  const [step, setStep] = useState<OutboundStep>(
    parentSelectedItem ? "select-quantity" : "choose-method"
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Scan flow state
  const [scannedAssortmentCode, setScannedAssortmentCode] = useState<
    string | null
  >(null)
  const [fifoCheckResult, setFifoCheckResult] =
    useState<OutboundCheckResult | null>(null)

  // Select flow state
  const [selectedItem, setSelectedItem] = useState<ScanItem | null>(
    parentSelectedItem ?? null
  )
  const [quantity, setQuantity] = useState(1)
  const [outboundPlan, setOutboundPlan] = useState<OutboundPlan | null>(null)
  const [selectedPickSlots, setSelectedPickSlots] = useState<
    OutboundPickSlot[]
  >([])

  // Result state
  const [executeResult, setExecuteResult] =
    useState<OutboundExecuteResult | null>(null)

  // Scan verification state (select flow only)
  const [scannedVerificationEntries, setScannedVerificationEntries] = useState<
    ScannedVerificationEntry[]
  >([])

  // Sync parent-selected item into internal state
  useEffect(() => {
    if (parentSelectedItem) {
      setSelectedItem(parentSelectedItem)
      setQuantity(1)
      setStep("select-quantity")
    }
  }, [parentSelectedItem])

  // ── Execute (defined first so other callbacks can reference it) ──

  const executeOutbound = useCallback(
    async (assortmentCodes: string[], shouldSkipFifo: boolean) => {
      setIsSubmitting(true)
      setError(null)

      try {
        const result = await apiFetch(
          "/api/inventory/outbound-operation/execute",
          OutboundExecuteSchema,
          {
            method: "POST",
            body: {
              assortments: assortmentCodes.map((code) => ({ code })),
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
            t("generated.scanner.outbound.failedPerformRemovalOperation"),
            outboundErrorMessages
          )
        )
      } finally {
        setIsSubmitting(false)
      }
    },
    [queryClient, t, outboundErrorMessages]
  )

  // ── Reset ───────────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    setStep("choose-method")
    setIsSubmitting(false)
    setError(null)
    setScannedAssortmentCode(null)
    setFifoCheckResult(null)
    setSelectedItem(null)
    setQuantity(1)
    setOutboundPlan(null)
    setSelectedPickSlots([])
    setExecuteResult(null)
    setScannedVerificationEntries([])
    parentOnReset?.()
  }, [parentOnReset])

  // ── Scan verification ────────────────────────────────────────────
  // (defined before handleScanResult so it can be referenced)

  const handleVerificationScanResult = useCallback(
    (code: string) => {
      const scannedCode = code.trim()
      if (!scannedCode) {
        setError(t("generated.scanner.shared.failedReadCodeAgain"))
        return
      }

      // Check if this code matches one of the selected pick slots
      const matchingSlot = selectedPickSlots.find(
        (slot) => slot.assortmentCode === scannedCode
      )

      if (!matchingSlot) {
        setError(t("generated.scanner.outbound.scannedCodeMatchAnySelected"))
        return
      }

      // Check if already scanned
      setScannedVerificationEntries((current) => {
        const alreadyScanned = current.some(
          (entry) => entry.assortmentCode === scannedCode
        )

        if (alreadyScanned) {
          setError(t("generated.scanner.outbound.itemAlreadyBeenScanned"))
          return current
        }

        setError(null)
        return [
          ...current,
          {
            assortmentCode: matchingSlot.assortmentCode,
            rackMarker: matchingSlot.rackMarker,
            positionX: matchingSlot.positionX,
            positionY: matchingSlot.positionY,
            scannedAt: new Date(),
          },
        ]
      })
    },
    [selectedPickSlots, t]
  )

  const handleConfirmAfterVerification = useCallback(async () => {
    const assortmentCodes = selectedPickSlots.map((slot) => slot.assortmentCode)
    const firstAssortmentCode = assortmentCodes[0]
    if (!firstAssortmentCode) {
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      const checkResult = await apiFetch(
        "/api/inventory/outbound-operation/check",
        OutboundCheckSchema,
        {
          method: "POST",
          body: { code: firstAssortmentCode },
        }
      )

      if (checkResult.fifoCompliant) {
        await executeOutbound(assortmentCodes, false)
      } else {
        setFifoCheckResult(checkResult)
        setStep("fifo-warning")
      }
    } catch (checkError) {
      setError(
        getOutboundErrorMessage(
          checkError,
          t("generated.scanner.outbound.failedVerifyFifoCompliance"),
          outboundErrorMessages
        )
      )
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedPickSlots, executeOutbound, t, outboundErrorMessages])

  // ── Scan flow ───────────────────────────────────────────────────

  const handleScanResult = useCallback(
    async (code: string) => {
      const scannedCode = code.trim()
      if (!scannedCode) {
        setError(t("generated.scanner.shared.failedReadCodeAgain"))
        return
      }

      // If we're in scan-verification step, delegate to verification handler
      if (step === "scan-verification") {
        handleVerificationScanResult(scannedCode)
        return
      }

      setError(null)
      setIsSubmitting(true)

      try {
        setScannedAssortmentCode(scannedCode)

        const checkResult = await apiFetch(
          "/api/inventory/outbound-operation/check",
          OutboundCheckSchema,
          {
            method: "POST",
            body: { code: scannedCode },
          }
        )

        if (checkResult.fifoCompliant) {
          await executeOutbound([scannedCode], false)
        } else {
          setFifoCheckResult(checkResult)
          setStep("fifo-warning")
        }
      } catch (scanError) {
        setError(
          getOutboundErrorMessage(
            scanError,
            t("generated.scanner.outbound.failedVerifyScannedCode"),
            outboundErrorMessages
          )
        )
      } finally {
        setIsSubmitting(false)
      }
    },
    [
      executeOutbound,
      handleVerificationScanResult,
      step,
      t,
      outboundErrorMessages,
    ]
  )
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
        OutboundPlanSchema,
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
          t("generated.scanner.outbound.failedGeneratePickPlan"),
          outboundErrorMessages
        )
      )
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedItem, quantity, t, outboundErrorMessages])

  const handleToggleSlot = useCallback((slot: OutboundPickSlot) => {
    setSelectedPickSlots((current) => {
      const exists = current.some((s) => s.assortmentId === slot.assortmentId)

      if (exists) {
        return current.filter((s) => s.assortmentId !== slot.assortmentId)
      }

      return [...current, slot]
    })
  }, [])

  const handleConfirmPickList = useCallback(() => {
    if (selectedPickSlots.length === 0) {
      return
    }

    setScannedVerificationEntries([])
    setStep("scan-verification")
  }, [selectedPickSlots])

  // ── FIFO warning actions ────────────────────────────────────────

  const handleSkipFifo = useCallback(async () => {
    const assortmentCodes = scannedAssortmentCode
      ? [scannedAssortmentCode]
      : selectedPickSlots.map((slot) => slot.assortmentCode)

    if (assortmentCodes.length === 0) {
      return
    }

    await executeOutbound(assortmentCodes, true)
  }, [scannedAssortmentCode, selectedPickSlots, executeOutbound])

  const handleTakeFifoCompliant = useCallback(() => {
    if (fifoCheckResult?.olderAssortments.length) {
      setScannedAssortmentCode(null)
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
          if (step === "scan-verification") {
            // Stay on scan-verification; just clear the error
            return
          }
          if (scannedAssortmentCode) {
            onRequestCamera()
          } else if (outboundPlan) {
            setStep("pick-list")
          } else if (selectedItem) {
            setStep("select-quantity")
          } else if (parentOnReset) {
            parentOnReset()
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
        onCancel={
          parentSelectedItem
            ? () => parentOnReset?.()
            : () => setStep("select-item")
        }
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

  if (step === "scan-verification") {
    return (
      <OutboundScanVerification
        isSubmitting={isSubmitting}
        onCancel={() => setStep("pick-list")}
        onConfirm={handleConfirmAfterVerification}
        onManualCodeSubmit={handleVerificationScanResult}
        onRequestScan={onRequestCamera}
        scannedEntries={scannedVerificationEntries}
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
