"use client"

import { Cancel01Icon, Mic01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useRouter } from "next/navigation"
import type { ReactNode } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { useIsMobile } from "@/hooks/use-mobile"
import { useSpeechRecognition } from "@/hooks/use-speech-recognition"
import { cn } from "@/lib/utils"
import { matchVoiceCommand } from "@/lib/voice/commands"
import { useVoiceCommandStore } from "@/lib/voice/voice-command-store"
import { MOCK_WAREHOUSES } from "../dashboard/mock-data"
import {
  getCommandLabel,
  handleConfirmCommandAction,
  isCommandMatchValid,
} from "./helpers/utils"
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
  let content: ReactNode
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
      stop()
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
        stop()
        reset()
        setView("idle")
        setErrorMessage(null)
        setMatchedCommand(null)
      }
    }

    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [open, stop, reset])

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

      if (armedRef.current) {
        if (shouldPopHistory) {
          window.history.back()
        }
        armedRef.current = false
      }
      handleReset()
    },
    [open, handleReset]
  )

  const liveTranscript = finalTranscript || interimTranscript
  const liveCommand = useMemo(() => {
    if (!liveTranscript) {
      return null
    }

    const match = matchVoiceCommand(liveTranscript)
    return match && isCommandMatchValid(match, warehouses) ? match : null
  }, [liveTranscript, warehouses])

  const handleStopListening = useCallback(() => {
    stop()
    setView("processing")
  }, [stop])

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

  const navigateAndClose = useCallback(
    (href: string) => {
      router.push(href)
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

  const handleConfirmCommand = useCallback(() => {
    handleConfirmCommandAction(matchedCommand, warehouses, {
      navigateAndClose,
      openScanner,
      openAddItemDialog,
      closeDialog,
      setErrorMessage,
      setView,
    })
  }, [
    matchedCommand,
    navigateAndClose,
    openAddItemDialog,
    openScanner,
    closeDialog,
    warehouses,
  ])

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
