"use client"

import { QrCodeIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { buttonVariants } from "../ui/button"
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog"
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

const TAB_TRIGGERS = [
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

export function Scanner({
  scanDelayMs = 1200,
  stopOnScan = false,
  constraints,
  warehouseName,
  className,
  children,
}: ScannerProps) {
  const isMobile = useIsMobile()
  const [mode, setMode] = useState<number>(0)
  const [open, setOpen] = useState<boolean>(false)
  const armedRef = useRef<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [step, setStep] = useState<Step>("camera")
  const [quantity, setQuantity] = useState<number>(1)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [locations, setLocations] = useState<Location[]>([])
  const [scannedItem, setScannedItem] = useState<ScanItem>(null)
  const [error, setError] = useState<string | null>(null)

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

    if (armedRef.current) {
      window.history.back()
    } else {
      setOpen(false)
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
    setStep("quantity")
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

    setLocations(mockLocations)
    setStep("locations")
    setIsSubmitting(false)
  }, [quantity])

  const handleConfirmPlacement = useCallback(async () => {
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    setStep("success")
    setIsSubmitting(false)
  }, [])

  const handleReset = useCallback(() => {
    setStep("camera")
    setQuantity(1)
    setLocations([])
  }, [])

  const handleQuantityDecrease = useCallback(() => {
    setQuantity((current) => Math.max(1, current - 1))
  }, [])

  const handleQuantityIncrease = useCallback(() => {
    setQuantity((current) => current + 1)
  }, [])

  const handleQuantityChange = useCallback((value: number) => {
    if (value > 0) {
      setQuantity(value)
    }
  }, [])

  const handleErrorReset = useCallback(() => {
    setError(null)
  }, [])

  let content: ReactNode = null

  if (children) {
    content = <ScannerBody>{children}</ScannerBody>
  } else if (error) {
    content = <ScannerErrorState error={error} onRetry={handleErrorReset} />
  } else if (step === "quantity") {
    content = (
      <ScannerQuantityStep
        isSubmitting={isSubmitting}
        onCancel={() => setStep("camera")}
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
        onBack={() => setStep("quantity")}
        onConfirm={handleConfirmPlacement}
      />
    )
  } else if (step === "success") {
    content = <ScannerSuccessStep onReset={handleReset} />
  } else {
    content = (
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
        tabTriggers={TAB_TRIGGERS}
        warehouseName={warehouseName}
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
          {content}
        </div>
      </DialogContent>
    </Dialog>
  )
}
