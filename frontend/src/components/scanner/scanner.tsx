"use client"

import { QrCodeIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useCallback, useEffect, useRef, useState } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { buttonVariants } from "../ui/button"
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog"
import { ScannerCamera } from "./scanner-camera"

interface ScannerProps {
  /** Prevents spamming the same result continuously */
  scanDelayMs?: number
  /** Stop camera as soon as a QR is read */
  stopOnScan?: boolean
  /** Override camera constraints if you want */
  constraints?: MediaStreamConstraints
  warehouseName?: string
  className?: string
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

export function Scanner({
  scanDelayMs = 1200,
  stopOnScan = false,
  constraints,
  warehouseName,
  className,
}: ScannerProps) {
  const isMobile = useIsMobile()
  const [mode, setMode] = useState<number>(0)
  const [open, setOpen] = useState<boolean>(false)
  const modeRef = useRef<number>(mode)
  modeRef.current = mode
  const armedRef = useRef<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  useEffect(() => {
    if (!open) {
      return
    }

    // Add exactly one "guard" entry per open
    if (!armedRef.current) {
      window.history.pushState({ __overlay: true }, "", window.location.href)
      armedRef.current = true
    }

    const onPopState = () => {
      // If overlay is open, consume this Back by closing it
      if (open) {
        setOpen(false)
        armedRef.current = false // guard entry already popped
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
      // This triggers popstate, which closes the overlay
      window.history.back()
    } else {
      setOpen(false)
    }
  }, [open])

  const onScan = useCallback(async (text: string) => {
    setIsLoading(true)
    console.log("Scanned code:", text, "mode:", modeRef.current)

    await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate async operation

    setIsLoading(false)
  }, [])

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  return (
    <Dialog
      onOpenChange={(o) => {
        if (o) {
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
            isMobile ? "h-full w-full" : "aspect-3/4 w-full rounded-lg border",
            className
          )}
        >
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
