"use client"

import { Cancel01Icon, Mic01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type { ReactNode } from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { VoiceAssistantIdleStep } from "./voice-assistant-idle-step"
import { VoiceAssistantListeningStep } from "./voice-assistant-listening-step"

export type VoiceAssistantStep = "idle" | "listening" | "processing" | "success"

interface VoiceAssistantProps {
  className?: string
  dialogTrigger?: ReactNode
}

export function VoiceAssistantProcessingStep() {
  return (
    <div className="relative flex h-full flex-col items-center justify-center p-6 text-center">
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-primary/5 via-transparent to-transparent opacity-50" />

      <div className="relative flex flex-col items-center gap-6">
        <div className="relative">
          <div className="size-20 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>

        <div className="max-w-sm space-y-2">
          <h2 className="font-semibold text-foreground text-xl">
            Przetwarzam...
          </h2>
          <p className="text-muted-foreground text-sm">
            Analizuję Twoje polecenie
          </p>
        </div>
      </div>
    </div>
  )
}

export function VoiceAssistant({
  className,
  dialogTrigger,
}: VoiceAssistantProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const armedRef = useRef(false)
  const [step, setStep] = useState<VoiceAssistantStep>("idle")

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

  const handleReset = useCallback(() => {
    setStep("idle")
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

  const handleStartListening = useCallback(() => {
    setStep("listening")
    // TODO: Start actual voice recognition
  }, [])

  const handleStopListening = useCallback(() => {
    setStep("processing")
    // TODO: Stop voice recognition and process

    // Simulate processing
    setTimeout(() => {
      setStep("success")
    }, 1500)
  }, [])

  let content: ReactNode

  switch (step) {
    case "idle":
      content = (
        <VoiceAssistantIdleStep onStartListening={handleStartListening} />
      )
      break
    case "listening":
      content = (
        <VoiceAssistantListeningStep onStopListening={handleStopListening} />
      )
      break
    case "processing":
      content = <VoiceAssistantProcessingStep />
      break
    case "success":
      content = <VoiceAssistantSuccessStep onReset={handleReset} />
      break
    default:
      content = null
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
          aria-label="Asystent głosowy"
          className={buttonVariants({
            variant: "ghost",
            size: "icon",
            className: "mr-3",
          })}
          title="Asystent głosowy"
        >
          <HugeiconsIcon icon={Mic01Icon} />
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
          <Button
            className={cn("absolute top-12 right-2 z-10 rounded-xl", {
              "top-4 right-4": !isMobile,
            })}
            onClick={closeDialog}
            size="icon-sm"
            variant="ghost"
          >
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
            <span className="sr-only">Zamknij</span>
          </Button>

          {content}
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface VoiceAssistantSuccessStepProps {
  onReset: () => void
}

function VoiceAssistantSuccessStep({
  onReset,
}: VoiceAssistantSuccessStepProps) {
  return (
    <div className="relative flex h-full flex-col items-center justify-center p-6 text-center">
      <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-emerald-500/5 via-transparent to-transparent opacity-50" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 size-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 opacity-30 blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-2xl bg-emerald-500/20" />
          <div className="relative flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
            <HugeiconsIcon
              className="size-8 text-emerald-500"
              icon={Mic01Icon}
            />
          </div>
        </div>

        <div className="max-w-sm space-y-2">
          <h2 className="font-semibold text-foreground text-xl">
            Polecenie wykonane
          </h2>
          <p className="text-muted-foreground text-sm">
            Twoje polecenie zostało przetworzone
          </p>
        </div>

        <div className="pt-2">
          <Button onClick={onReset} type="button">
            Nowe polecenie
          </Button>
        </div>
      </div>
    </div>
  )
}
