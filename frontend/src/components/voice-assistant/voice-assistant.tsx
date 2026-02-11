"use client"

import { Cancel01Icon, Mic01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import type { ReactNode } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { useIsMobile } from "@/hooks/use-mobile"
import { useSpeechRecognition } from "@/hooks/use-speech-recognition"
import useWarehouses from "@/hooks/use-warehouses"
import type { Warehouse } from "@/lib/schemas"
import { cn } from "@/lib/utils"
import type { VoiceCommandMatch } from "@/lib/voice/commands"
import { matchVoiceCommand } from "@/lib/voice/commands"
import { useVoiceCommandStore } from "@/lib/voice/voice-command-store"
import {
  findWarehouseByName,
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
  dialogTrigger?: ReactNode
}

type WarehouseReference = Pick<Warehouse, "id" | "name">

export function VoiceAssistant({ dialogTrigger }: VoiceAssistantProps) {
  const t = useTranslations()

  const listenTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMobile = useIsMobile()
  const router = useRouter()
  const { openAddItemDialog, openScanner, setPendingAction } =
    useVoiceCommandStore()
  const [open, setOpen] = useState(false)
  const armedRef = useRef(false)
  const [view, setView] = useState<VoiceAssistantViews>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [matchedCommand, setMatchedCommand] =
    useState<VoiceCommandMatch | null>(null)
  const [manualTranscript, setManualTranscript] = useState<string | null>(null)
  const [pendingWarehouseLookupMatch, setPendingWarehouseLookupMatch] =
    useState<VoiceCommandMatch | null>(null)
  const [warehouseLookupName, setWarehouseLookupName] = useState<string | null>(
    null
  )
  const [resolvedWarehouse, setResolvedWarehouse] =
    useState<WarehouseReference | null>(null)
  const resetWarehouseLookupState = useCallback(() => {
    setPendingWarehouseLookupMatch(null)
    setWarehouseLookupName(null)
    setResolvedWarehouse(null)
  }, [])

  const {
    finalTranscript,
    interimTranscript,
    reset,
    start,
    stop,
    isSupported,
  } = useSpeechRecognition()
  const warehouseLookupParams = useMemo(
    () =>
      warehouseLookupName
        ? {
            nameFilter: warehouseLookupName,
            page: 0,
            size: 1,
          }
        : undefined,
    [warehouseLookupName]
  )
  const {
    data: warehouseLookupData,
    isError: isWarehouseLookupError,
    isFetching: isWarehouseLookupFetching,
  } = useWarehouses(warehouseLookupParams, {
    enabled: Boolean(warehouseLookupParams),
  })

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
        setManualTranscript(null)
        resetWarehouseLookupState()
      }
    }

    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [open, stop, reset, resetWarehouseLookupState])

  useEffect(() => {
    if (view !== "processing" || pendingWarehouseLookupMatch) {
      return
    }

    const finalText = finalTranscript.trim()
    const interimText = interimTranscript.trim()
    const resolvedText = finalText || interimText
    if (!resolvedText) {
      setMatchedCommand(null)
      resetWarehouseLookupState()
      setErrorMessage(t("generated.voiceAssistant.commandRecognized2"))
      setView("error")
      return
    }

    const match = matchVoiceCommand(resolvedText)
    if (!(match && isCommandMatchValid(match))) {
      setMatchedCommand(null)
      resetWarehouseLookupState()
      setErrorMessage(t("generated.voiceAssistant.dontKnowCommand"))
      setView("error")
      return
    }

    if (match.command.id === "warehouses:id") {
      const warehouseName = match.params.warehouseName?.trim()
      if (!warehouseName) {
        setMatchedCommand(null)
        resetWarehouseLookupState()
        setErrorMessage(
          t("generated.voiceAssistant.warehouseNameMissingCommand")
        )
        setView("error")
        return
      }
      resetWarehouseLookupState()
      setMatchedCommand(null)
      setPendingWarehouseLookupMatch(match)
      setWarehouseLookupName(warehouseName)
      return
    }

    resetWarehouseLookupState()
    setMatchedCommand(match)
    setView("confirm")
  }, [
    view,
    finalTranscript,
    interimTranscript,
    pendingWarehouseLookupMatch,
    resetWarehouseLookupState,
    t,
  ])

  useEffect(() => {
    if (
      view !== "processing" ||
      !pendingWarehouseLookupMatch ||
      !warehouseLookupName
    ) {
      return
    }

    if (isWarehouseLookupFetching) {
      return
    }

    if (isWarehouseLookupError) {
      setMatchedCommand(null)
      resetWarehouseLookupState()
      setErrorMessage(t("generated.voiceAssistant.warehouseFoundAgain"))
      setView("error")
      return
    }

    const warehouse = findWarehouseByName(
      warehouseLookupName,
      warehouseLookupData?.content ?? []
    )

    if (!warehouse) {
      setMatchedCommand(null)
      resetWarehouseLookupState()
      setErrorMessage(t("generated.voiceAssistant.warehouseNameFound"))
      setView("error")
      return
    }

    setResolvedWarehouse(warehouse)
    setMatchedCommand(pendingWarehouseLookupMatch)
    setPendingWarehouseLookupMatch(null)
    setWarehouseLookupName(null)
    setView("confirm")
  }, [
    view,
    pendingWarehouseLookupMatch,
    warehouseLookupName,
    isWarehouseLookupError,
    isWarehouseLookupFetching,
    warehouseLookupData,
    resetWarehouseLookupState,
    t,
  ])

  const handleReset = useCallback(() => {
    setView("idle")
    setErrorMessage(null)
    setMatchedCommand(null)
    setManualTranscript(null)
    resetWarehouseLookupState()
    reset()
    stop()
  }, [reset, stop, resetWarehouseLookupState])

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
  const hasSpeech = Boolean(finalTranscript || interimTranscript)
  const liveCommand = useMemo(() => {
    if (!liveTranscript) {
      return null
    }

    const match = matchVoiceCommand(liveTranscript)
    return match && isCommandMatchValid(match) ? match : null
  }, [liveTranscript])
  const commandWarehouses = useMemo(
    () => (resolvedWarehouse ? [resolvedWarehouse] : []),
    [resolvedWarehouse]
  )

  const handleStopListening = useCallback(() => {
    stop()
    setView("processing")
  }, [stop])

  const AUTO_STOP_DELAY = 1500
  const SILENCE_TIMEOUT = 3000

  useEffect(() => {
    if (view !== "listening") {
      if (listenTimeoutRef.current) {
        clearTimeout(listenTimeoutRef.current)
        listenTimeoutRef.current = null
      }
      return
    }

    let delay: number | null = null
    if (liveCommand) {
      delay = AUTO_STOP_DELAY
    } else if (hasSpeech) {
      delay = SILENCE_TIMEOUT
    }

    if (listenTimeoutRef.current) {
      clearTimeout(listenTimeoutRef.current)
      listenTimeoutRef.current = null
    }

    if (delay == null) {
      return
    }

    listenTimeoutRef.current = setTimeout(() => {
      listenTimeoutRef.current = null
      handleStopListening()
    }, delay)

    return () => {
      if (listenTimeoutRef.current) {
        clearTimeout(listenTimeoutRef.current)
        listenTimeoutRef.current = null
      }
    }
  }, [view, liveCommand, hasSpeech, handleStopListening])

  const navigateAndClose = useCallback(
    (href: string) => {
      router.push(href)
      closeDialog({ shouldPopHistory: false })
    },
    [router, closeDialog]
  )

  const handleStartListening = useCallback(() => {
    if (!isSupported) {
      setErrorMessage(
        t("generated.voiceAssistant.browserSupportSpeechRecognition")
      )
      setView("error")
      return
    }

    setManualTranscript(null)
    setMatchedCommand(null)
    resetWarehouseLookupState()
    reset()
    start()
    setView("listening")
  }, [isSupported, reset, start, resetWarehouseLookupState, t])

  const handleSuggestionSelect = useCallback(
    (suggestion: string) => {
      const match = matchVoiceCommand(suggestion)
      if (!(match && isCommandMatchValid(match))) {
        setMatchedCommand(null)
        resetWarehouseLookupState()
        setErrorMessage(t("generated.voiceAssistant.dontKnowCommand"))
        setView("error")
        return
      }

      if (match.command.id === "warehouses:id") {
        const warehouseName = match.params.warehouseName?.trim()
        if (!warehouseName) {
          setMatchedCommand(null)
          resetWarehouseLookupState()
          setErrorMessage(
            t("generated.voiceAssistant.warehouseNameMissingCommand")
          )
          setView("error")
          return
        }

        setErrorMessage(null)
        setManualTranscript(suggestion)
        resetWarehouseLookupState()
        setMatchedCommand(null)
        setPendingWarehouseLookupMatch(match)
        setWarehouseLookupName(warehouseName)
        setView("processing")
        return
      }

      setErrorMessage(null)
      resetWarehouseLookupState()
      setMatchedCommand(match)
      setManualTranscript(suggestion)
      setView("confirm")
    },
    [resetWarehouseLookupState, t]
  )

  let content: ReactNode

  const handleConfirmCommand = useCallback(() => {
    handleConfirmCommandAction(
      matchedCommand,
      commandWarehouses,
      {
        navigateAndClose,
        openScanner,
        openAddItemDialog,
        setPendingAction,
        closeDialog,
        setErrorMessage,
        setView,
      },
      t
    )
  }, [
    matchedCommand,
    navigateAndClose,
    openAddItemDialog,
    openScanner,
    setPendingAction,
    closeDialog,
    commandWarehouses,
    t,
  ])

  switch (view) {
    case "idle":
      content = (
        <VoiceAssistantNormalView
          onStartListening={handleStartListening}
          onSuggestionSelect={handleSuggestionSelect}
        />
      )
      break
    case "listening":
      {
        const liveLabel = liveCommand
          ? getCommandLabel(liveCommand, [], t)
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
          commandLabel={getCommandLabel(matchedCommand, commandWarehouses, t)}
          onCancel={handleReset}
          onConfirm={handleConfirmCommand}
          transcript={
            manualTranscript ?? (finalTranscript || interimTranscript)
          }
        />
      ) : null
      break
    case "error":
      content = (
        <VoiceAssistantErrorView
          message={
            errorMessage ?? t("generated.voiceAssistant.commandFailedProcess")
          }
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
          aria-label={t("generated.shared.voiceAssistant")}
          className={buttonVariants({
            variant: "ghost",
            size: "icon",
            className:
              "relative mr-3 text-muted-foreground transition-colors duration-200 hover:text-primary",
          })}
          title={t("generated.shared.voiceAssistant")}
        >
          <HugeiconsIcon icon={Mic01Icon} strokeWidth={1.75} />
        </DialogTrigger>
      )}
      <DialogContent
        className={cn(
          "gap-0 overflow-hidden p-0",
          isMobile ? "h-dvh w-screen max-w-none rounded-none" : "sm:max-w-sm"
        )}
        showCloseButton={false}
      >
        <div
          className={cn(
            "relative overflow-hidden",
            isMobile ? "h-full w-full py-8" : "aspect-3/4 w-full"
          )}
          data-slot="voice-assistant"
        >
          <Button
            aria-label={t("generated.voiceAssistant.closeVoiceAssistant")}
            className={cn(
              "absolute right-3 z-10 rounded-full text-muted-foreground transition-colors hover:text-foreground",
              isMobile ? "top-12" : "top-3"
            )}
            onClick={() => closeDialog()}
            size="icon-sm"
            variant="ghost"
          >
            <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
          </Button>

          {content}
        </div>
      </DialogContent>
    </Dialog>
  )
}
