"use client"

import { Cancel01Icon, Mic01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useRouter } from "next/navigation"
import type { ReactNode } from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { MOCK_WAREHOUSES } from "@/components/dashboard/mock-data"
import { Button, buttonVariants } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { useIsMobile } from "@/hooks/use-mobile"
import { useSpeechRecognition } from "@/hooks/use-speech-recognition"
import { cn } from "@/lib/utils"
import { matchVoiceCommand, normalizeTranscript } from "@/lib/voice/commands"
import { useVoiceCommandStore } from "@/lib/voice/voice-command-store"
import { VoiceAssistantConfirmView } from "./voice-assistant-confirm-view"
import { VoiceAssistantListeningView } from "./voice-assistant-listening-view"
import { VoiceAssistantNormalView } from "./voice-assistant-normal-view"
import {
  VoiceAssistantErrorView,
  VoiceAssistantProcessingView,
} from "./voice-assistant-other-views"

export type VoiceAssistantViews =
  | "idle"
  | "listening"
  | "processing"
  | "confirm"
  | "success"
  | "error"

interface VoiceAssistantProps {
  className?: string
  dialogTrigger?: ReactNode
}

export function VoiceAssistant({
  className,
  dialogTrigger,
}: VoiceAssistantProps) {
  const autoStopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMobile = useIsMobile()
  const router = useRouter()
  const { openAddItemDialog, openScanner } = useVoiceCommandStore()
  const [open, setOpen] = useState(false)
  const armedRef = useRef(false)
  const [view, setView] = useState<VoiceAssistantViews>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [matchedCommand, setMatchedCommand] =
    useState<ReturnType<typeof matchVoiceCommand>>(null)
  const {
    finalTranscript,
    interimTranscript,
    reset,
    start,
    stop,
    isSupported,
  } = useSpeechRecognition()

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
    setView("idle")
    setErrorMessage(null)
    setMatchedCommand(null)
    reset()
    stop()
  }, [reset, stop])

  const closeDialog = useCallback(
    (options?: { shouldPopHistory?: boolean }) => {
      if (!open) {
        return
      }

      const shouldPopHistory = options?.shouldPopHistory ?? true
      setOpen(false)

      if (armedRef.current && shouldPopHistory) {
        armedRef.current = false
        window.history.back()
      }
      handleReset()
    },
    [open, handleReset]
  )

  const navigateAndClose = useCallback(
    (href: string) => {
      router.push(href)
      setView("success")
      closeDialog({ shouldPopHistory: false })
    },
    [router, closeDialog]
  )

  const handleStartListening = useCallback(() => {
    if (!isSupported) {
      setErrorMessage("Przeglądarka nie obsługuje rozpoznawania mowy.")
      setView("error")
      return
    }

    reset()
    start()
    setView("listening")
  }, [isSupported, reset, start])

  const handleStopListening = useCallback(() => {
    stop()
    setView("processing")
  }, [stop])

  const handleConfirmCommand = useCallback(() => {
    if (!matchedCommand) {
      setErrorMessage("Brak komendy do wykonania.")
      setView("error")
      return
    }

    switch (matchedCommand.command.id) {
      case "dashboard":
        navigateAndClose("/dashboard")
        return
      case "warehouses:id":
        {
          const warehouseName = matchedCommand.params.warehouseName
          if (!warehouseName) {
            setErrorMessage("Brak nazwy magazynu w komendzie.")
            setView("error")
            return
          }
          const warehouse = findWarehouseByName(warehouseName)
          if (!warehouse) {
            setErrorMessage("Nie znaleziono magazynu o takiej nazwie.")
            setView("error")
            return
          }
          const encodedName = encodeURIComponent(warehouse.name)
          navigateAndClose(`/dashboard/warehouse/${encodedName}`)
        }
        return
      case "warehouses":
        navigateAndClose("/dashboard/warehouse")
        return
      case "items":
        navigateAndClose("/dashboard/items")
        return
      case "settings":
        navigateAndClose("/settings")
        return
      case "open-scanner":
        openScanner()
        break
      case "add-item":
        openAddItemDialog()
        break
      default:
        setErrorMessage("Nieobsługiwana komenda")
        setView("error")
        return
    }

    setView("success")
    closeDialog()
  }, [
    matchedCommand,
    navigateAndClose,
    openAddItemDialog,
    openScanner,
    closeDialog,
  ])

  useEffect(() => {
    if (view !== "processing") {
      return
    }

    const finalText = finalTranscript.trim()
    const interimText = interimTranscript.trim()
    const resolvedText = finalText || interimText
    if (!resolvedText) {
      setErrorMessage("Nie rozpoznano polecenia.")
      setView("error")
      return
    }

    const match = matchVoiceCommand(resolvedText)
    if (!(match && isCommandMatchValid(match))) {
      setErrorMessage("Nie znam tego polecenia.")
      setView("error")
      return
    }

    setMatchedCommand(match)
    setView("confirm")
  }, [view, finalTranscript, interimTranscript])

  useEffect(() => {
    if (view !== "listening") {
      if (autoStopTimeoutRef.current) {
        clearTimeout(autoStopTimeoutRef.current)
        autoStopTimeoutRef.current = null
      }
      return
    }

    const liveTranscript = finalTranscript || interimTranscript
    const liveCommand = liveTranscript
      ? matchVoiceCommand(liveTranscript)
      : null
    const validatedLiveCommand =
      liveCommand && isCommandMatchValid(liveCommand) ? liveCommand : null

    if (!validatedLiveCommand) {
      if (autoStopTimeoutRef.current) {
        clearTimeout(autoStopTimeoutRef.current)
        autoStopTimeoutRef.current = null
      }
      return
    }

    if (autoStopTimeoutRef.current) {
      return
    }

    autoStopTimeoutRef.current = setTimeout(() => {
      autoStopTimeoutRef.current = null
      handleStopListening()
    }, 600)
  }, [view, finalTranscript, interimTranscript, handleStopListening])

  let content: ReactNode

  switch (view) {
    case "idle":
      content = (
        <VoiceAssistantNormalView onStartListening={handleStartListening} />
      )
      break
    case "listening":
      {
        const liveTranscript = finalTranscript || interimTranscript
        const liveCommand = liveTranscript
          ? matchVoiceCommand(liveTranscript)
          : null
        const validatedLiveCommand =
          liveCommand && isCommandMatchValid(liveCommand) ? liveCommand : null
        const liveLabel = validatedLiveCommand
          ? getCommandLabel(validatedLiveCommand)
          : null
        content = (
          <VoiceAssistantListeningView
            detectedCommandLabel={liveLabel}
            isCommandDetected={Boolean(validatedLiveCommand)}
            onStopListening={handleStopListening}
            transcript={liveTranscript}
          />
        )
      }
      break
    case "processing":
      content = <VoiceAssistantProcessingView />
      break
    case "confirm":
      content = matchedCommand ? (
        <VoiceAssistantConfirmView
          commandLabel={getCommandLabel(matchedCommand)}
          onCancel={handleReset}
          onConfirm={handleConfirmCommand}
          transcript={finalTranscript || interimTranscript}
        />
      ) : null
      break
    case "success":
      content = <VoiceAssistantSuccessView onReset={handleReset} />
      break
    case "error":
      content = (
        <VoiceAssistantErrorView
          message={errorMessage ?? "Nie udało się przetworzyć polecenia."}
          onReset={handleReset}
        />
      )
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
            onClick={() => closeDialog()}
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

const getCommandLabel = (
  match: NonNullable<ReturnType<typeof matchVoiceCommand>>
): string => {
  if (match.command.id === "warehouses:id") {
    const warehouseName = match.params.warehouseName
    if (warehouseName) {
      const warehouse = findWarehouseByName(warehouseName)
      const label = warehouse?.name ?? warehouseName
      return `Otwórz magazyn ${label}`
    }
  }

  return match.command.description
}

const findWarehouseByName = (inputName: string) => {
  const normalizedInput = normalizeTranscript(inputName, { toLowerCase: true })
  return (
    MOCK_WAREHOUSES.find((warehouse) => {
      const normalizedName = normalizeTranscript(warehouse.name, {
        toLowerCase: true,
      })
      const normalizedId = normalizeTranscript(warehouse.id, {
        toLowerCase: true,
      })
      return (
        normalizedName === normalizedInput || normalizedId === normalizedInput
      )
    }) ?? null
  )
}

const isCommandMatchValid = (
  match: NonNullable<ReturnType<typeof matchVoiceCommand>>
): boolean => {
  if (match.command.id !== "warehouses:id") {
    return true
  }

  const warehouseName = match.params.warehouseName
  if (!warehouseName) {
    return false
  }

  return Boolean(findWarehouseByName(warehouseName))
}

interface VoiceAssistantSuccessViewProps {
  onReset: () => void
}

function VoiceAssistantSuccessView({
  onReset,
}: VoiceAssistantSuccessViewProps) {
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
