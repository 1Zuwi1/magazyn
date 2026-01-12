"use client"

import { QrCodeIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react"
import { SCAN_DELAY_MS } from "@/config/constants"
import { useIsMobile } from "@/hooks/use-mobile"
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
import type { Location, ScanItem } from "./scanner-types"

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

type Step = "camera" | "quantity" | "locations" | "success"

interface ScannerState {
  step: Step
  locations: Location[]
}

// TODO: implement data fetching from API instead of mocks when API is ready: https://github.com/1Zuwi1/magazyn/issues/23
export function Scanner({
  scanDelayMs = SCAN_DELAY_MS,
  stopOnScan = false,
  constraints,
  warehouseName,
  className,
  children,
}: ScannerProps) {
  const isMobile = useIsMobile()
  const [mode, setMode] = useState<(typeof TAB_TRIGGERS)[number]["action"]>(
    TAB_TRIGGERS[0].action
  )
  const [open, setOpen] = useState<boolean>(false)
  const armedRef = useRef<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [scannerState, setScannerState] = useState<ScannerState>({
    step: "camera",
    locations: [],
  })
  const [quantity, setQuantity] = useState<number>(1)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [scannedItem, setScannedItem] = useState<ScanItem | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { step, locations } = scannerState

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

  const closeDialog = useCallback(() => {
    if (!open) {
      return
    }

    setOpen(false)

    if (armedRef.current) {
      armedRef.current = false
      window.history.back()
    }
  }, [open])

  const onScan = useCallback(async (text: string) => {
    setIsLoading(true)

    await new Promise((resolve) => setTimeout(resolve, 500))

    setScannedItem({
      expiresIn: 180,
      id: "item-123",
      name: "Przykładowy przedmiot",
      qrCode: text,
      weight: 2.5,
      imageUrl: "https://placehold.co/600x400",
    })
    setScannerState((current) => ({
      ...current,
      step: "quantity",
      locations: [],
    }))
    setIsLoading(false)
  }, [])

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true)

    await new Promise((resolve) => setTimeout(resolve, 500))
    const isError = Math.random() < 0.2
    if (isError) {
      setError("W tym magazynie brakuje miejsca na te przedmioty.")
      setIsSubmitting(false)
      return
    }

    const mockLocations: Location[] = Array.from(
      { length: quantity },
      (_, index) => ({
        rack: Math.floor(Math.random() * 10) + 1,
        row: Math.floor(Math.random() * 5) + 1,
        col: (index % 3) + 1,
      })
    )

    setScannerState((current) => ({
      ...current,
      locations: mockLocations,
      step: "locations",
    }))
    setIsSubmitting(false)
  }, [quantity])

  const handleConfirmPlacement = useCallback(async () => {
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    setScannerState((current) => ({ ...current, step: "success" }))
    setIsSubmitting(false)
  }, [])

  const handleReset = useCallback(() => {
    setScannerState({ step: "camera", locations: [] })
    setQuantity(1)
    setIsSubmitting(false)
    setIsLoading(false)
    setScannedItem(null)
    setError(null)
  }, [])

  const handleQuantityDecrease = useCallback(() => {
    setQuantity((current) => Math.max(1, current - 1))
  }, [])

  const handleQuantityIncrease = useCallback(() => {
    setQuantity((current) => current + 1)
  }, [])

  const handleQuantityChange = useCallback((value: number) => {
    setQuantity(Math.max(1, value))
  }, [])

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
  } else if (scannedItem) {
    if (step === "quantity") {
      content = (
        <ScannerQuantityStep
          isSubmitting={isSubmitting}
          onCancel={() =>
            setScannerState((current) => ({ ...current, step: "camera" }))
          }
          onDecrease={handleQuantityDecrease}
          onIncrease={handleQuantityIncrease}
          onQuantityChange={handleQuantityChange}
          onSubmit={handleSubmit}
          quantity={quantity}
          scannedItem={scannedItem}
        />
      )
    } else if (step === "locations") {
      content = (
        <ScannerLocationsStep
          isSubmitting={isSubmitting}
          locations={locations}
          onBack={() =>
            setScannerState((current) => ({ ...current, step: "quantity" }))
          }
          onConfirm={handleConfirmPlacement}
        />
      )
    } else if (step === "success") {
      content = <ScannerSuccessStep onReset={handleReset} />
    }
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
      <DialogTrigger
        className={buttonVariants({
          variant: "ghost",
          size: "icon",
          className: "mr-1 ml-auto size-8 rounded-xl sm:size-10",
        })}
        title="Skaner kodów"
      >
        <HugeiconsIcon icon={QrCodeIcon} />
      </DialogTrigger>
      <DialogContent
        className={cn(
          "p-0",
          isMobile ? "h-screen w-screen max-w-none rounded-none" : ""
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
