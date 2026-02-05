"use client"

import { Cancel01Icon, Mic01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useRouter } from "next/navigation"
import type { ReactNode } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { Warehouse } from "@/components/dashboard/types"
import { Button, buttonVariants } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { useIsMobile } from "@/hooks/use-mobile"
import { useSpeechRecognition } from "@/hooks/use-speech-recognition"
import { cn } from "@/lib/utils"
import { matchVoiceCommand, normalizeTranscript } from "@/lib/voice/commands"
import { useVoiceCommandStore } from "@/lib/voice/voice-command-store"
import { MOCK_WAREHOUSES } from "../dashboard/mock-data"
import { VoiceAssistantConfirmView } from "./voice-assistant-confirm-view"
import { VoiceAssistantListeningView } from "./voice-assistant-listening-view"
import { VoiceAssistantNormalView } from "./voice-assistant-normal-view"
import {
  VoiceAssistantErrorView,
  VoiceAssistantProcessingView,
  VoiceAssistantSuccessView,
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

  const warehouses = MOCK_WAREHOUSES.map(({ id, name }) => ({ id, name }))
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
          const warehouse = findWarehouseByName(warehouseName, warehouses)
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
    warehouses,
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
    if (!(match && isCommandMatchValid(match, warehouses))) {
      setErrorMessage("Nie znam tego polecenia.")
      setView("error")
      return
    }

    setMatchedCommand(match)
    setView("confirm")
  }, [view, finalTranscript, interimTranscript, warehouses])

  const liveTranscript = finalTranscript || interimTranscript
  const liveCommand = useMemo(() => {
    if (!liveTranscript) {
      return null
    }

    const match = matchVoiceCommand(liveTranscript)
    return match && isCommandMatchValid(match, warehouses) ? match : null
  }, [liveTranscript, warehouses])

  useEffect(() => {
    if (view !== "listening") {
      if (autoStopTimeoutRef.current) {
        clearTimeout(autoStopTimeoutRef.current)
        autoStopTimeoutRef.current = null
      }
      return
    }

    if (!liveCommand) {
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
  }, [view, liveCommand, handleStopListening])

  let content: ReactNode

  switch (view) {
    case "idle":
      content = (
        <VoiceAssistantNormalView onStartListening={handleStartListening} />
      )
      break
    case "listening":
      {
        const liveLabel = liveCommand
          ? getCommandLabel(liveCommand, warehouses)
          : null
        content = (
          <VoiceAssistantListeningView
            detectedCommandLabel={liveLabel}
            isCommandDetected={Boolean(liveCommand)}
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
          commandLabel={getCommandLabel(matchedCommand, warehouses)}
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
  match: NonNullable<ReturnType<typeof matchVoiceCommand>>,
  warehouses: Pick<Warehouse, "id" | "name">[]
): string => {
  if (match.command.id === "warehouses:id") {
    const warehouseName = match.params.warehouseName
    if (warehouseName) {
      const warehouse = findWarehouseByName(warehouseName, warehouses)
      const label = warehouse?.name ?? warehouseName
      return `Otwórz magazyn ${label}`
    }
  }

  return match.command.description
}

const findWarehouseByName = (
  inputName: string,
  warehouses: Pick<Warehouse, "id" | "name">[]
) => {
  const normalizedInput = normalizeTranscript(inputName, { toLowerCase: true })
  return (
    warehouses.find((warehouse) => {
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
  match: NonNullable<ReturnType<typeof matchVoiceCommand>>,
  warehouses: Pick<Warehouse, "id" | "name">[]
): boolean => {
  if (match.command.id !== "warehouses:id") {
    return true
  }

  const warehouseName = match.params.warehouseName
  if (!warehouseName) {
    return false
  }

  return Boolean(findWarehouseByName(warehouseName, warehouses))
}
