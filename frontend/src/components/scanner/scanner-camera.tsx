"use client"

import {
  AlertCircleIcon,
  Camera01Icon,
  Cancel01Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser"
import {
  BarcodeFormat,
  DecodeHintType,
  NotFoundException,
  type Result,
} from "@zxing/library"
import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "../ui/button"
import { TAB_TRIGGERS } from "./scanner"

const CODE_FORMATS = [BarcodeFormat.QR_CODE, BarcodeFormat.CODE_128] as const

const TAKE_DECODE_HINTS: Map<DecodeHintType, unknown> = new Map()
TAKE_DECODE_HINTS.set(DecodeHintType.POSSIBLE_FORMATS, CODE_FORMATS)
TAKE_DECODE_HINTS.set(DecodeHintType.ASSUME_GS1, false)

const REMOVE_DECODE_HINTS: Map<DecodeHintType, unknown> = new Map()
REMOVE_DECODE_HINTS.set(DecodeHintType.POSSIBLE_FORMATS, CODE_FORMATS)
REMOVE_DECODE_HINTS.set(DecodeHintType.ASSUME_GS1, true)

const getDecodeHints = (
  mode: (typeof TAB_TRIGGERS)[number]["action"]
): Map<DecodeHintType, unknown> => {
  return mode === "remove" ? REMOVE_DECODE_HINTS : TAKE_DECODE_HINTS
}

interface ScannerCameraProps {
  scanDelayMs: number
  stopOnScan: boolean
  constraints?: MediaStreamConstraints
  warehouseName?: string
  isMobile: boolean
  isOpen: boolean
  mode: (typeof TAB_TRIGGERS)[number]["action"]
  onScan: (text: string) => void
  onRequestClose: () => void
  onTakePhoto: (file: File) => void
  isLoading?: boolean
}

export function ScannerCamera({
  scanDelayMs,
  stopOnScan,
  constraints,
  warehouseName,
  isMobile,
  isOpen,
  mode,
  onRequestClose,
  onTakePhoto,
  onScan,
  isLoading,
}: ScannerCameraProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(
    null
  )
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const startSessionRef = useRef<number>(0)
  const setVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node
    setVideoElement(node)
  }, [])

  const lastAtRef = useRef<number>(0)

  const capturePhoto = useCallback(() => {
    const video = videoRef.current
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      return
    }

    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      return
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], "photo.jpg", { type: "image/jpeg" })
          onTakePhoto(file)
        }
      },
      "image/jpeg",
      0.85
    )
  }, [onTakePhoto])

  const modeLabel = TAB_TRIGGERS.find(
    (trigger) => trigger.action === mode
  )?.text

  const stopAfterScan = useCallback(() => {
    controlsRef.current?.stop()
    controlsRef.current = null
  }, [])

  const shouldIgnoreScan = useCallback(
    (now: number) => {
      return now - lastAtRef.current <= scanDelayMs
    },
    [scanDelayMs]
  )

  const recordScan = useCallback(
    (text: string, now: number) => {
      onScan(text)
      lastAtRef.current = now
    },
    [onScan]
  )

  const handleDecodedText = useCallback(
    (text: string) => {
      const now = Date.now()
      if (shouldIgnoreScan(now)) {
        return
      }

      recordScan(text, now)

      if (stopOnScan) {
        stopAfterScan()
      }
    },
    [recordScan, shouldIgnoreScan, stopAfterScan, stopOnScan]
  )

  const handleScanResult = useCallback(
    (result: Result | undefined, err: unknown) => {
      if (result) {
        handleDecodedText(result.getText())
        return
      }

      if (err && !(err instanceof NotFoundException)) {
        const msg =
          err instanceof Error ? err.message : "Unexpected scanner error."
        setErrorMsg(msg)
      }
    },
    [handleDecodedText]
  )

  const stop = useCallback(() => {
    startSessionRef.current += 1
    controlsRef.current?.stop()
    controlsRef.current = null
    readerRef.current = null

    // Helps release camera in some browsers
    if (videoRef.current) {
      const v = videoRef.current
      v.pause()
      v.srcObject = null
    }
  }, [])

  const start = useCallback(
    async (currentVideo: HTMLVideoElement) => {
      const startSession = startSessionRef.current + 1
      startSessionRef.current = startSession
      setErrorMsg(null)
      try {
        // iOS Safari friendliness
        currentVideo.setAttribute("playsinline", "true")
        currentVideo.setAttribute("webkit-playsinline", "true")
        currentVideo.setAttribute("autoplay", "true")
        currentVideo.setAttribute("muted", "true")

        const reader = new BrowserMultiFormatReader(getDecodeHints(mode), {
          delayBetweenScanAttempts: 300,
        })
        readerRef.current = reader

        const mediaConstraints: MediaStreamConstraints =
          constraints ??
          ({
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1080 },
              height: { ideal: 1920 },
              aspectRatio: { ideal: 9 / 16 },
              frameRate: { ideal: 30, max: 60 },
            },
            audio: false,
          } satisfies MediaStreamConstraints)

        const controls = await reader.decodeFromConstraints(
          mediaConstraints,
          currentVideo,
          handleScanResult
        )

        if (startSessionRef.current !== startSession) {
          controls.stop()
          return
        }

        controlsRef.current = controls
      } catch (e) {
        if (startSessionRef.current !== startSession) {
          return
        }

        const msg =
          e instanceof Error ? e.message : "Could not start the camera scanner."
        setErrorMsg(msg)
        stop()
      }
    },
    [constraints, handleScanResult, stop, mode]
  )

  useEffect(() => {
    if (!isOpen) {
      stop()
      return
    }

    if (!videoElement) {
      return
    }

    start(videoElement)

    return () => stop()
  }, [isOpen, stop, start, videoElement])

  return (
    <>
      <Button
        className={cn("absolute top-12 right-2 z-10 rounded-xl", {
          "top-4 right-4": !isMobile,
        })}
        onClick={onRequestClose}
        size="icon-sm"
        variant="ghost"
      >
        <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
        <span className="sr-only">Close</span>
      </Button>

      {errorMsg ? (
        <div className="relative flex h-full flex-col items-center justify-center p-6 text-center">
          {/* Decorative background gradient */}
          <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-destructive/5 via-transparent to-transparent opacity-50" />

          {/* Decorative blur circle */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 size-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-destructive/10 opacity-30 blur-3xl" />
          </div>

          <div className="relative flex flex-col items-center gap-4">
            {/* Icon */}
            <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10 ring-1 ring-destructive/20">
              <HugeiconsIcon
                className="size-8 text-destructive"
                icon={AlertCircleIcon}
              />
            </div>

            {/* Text content */}
            <div className="max-w-sm space-y-2">
              <h2 className="font-semibold text-foreground text-xl">
                Problem z kamerą
              </h2>
              <p className="text-muted-foreground text-sm">
                Upewnij się że Twoja kamera jest podłączona i dostępna oraz że
                udzieliłeś/aś pozwolenia na jej użycie.
              </p>
              <details className="mt-3">
                <summary className="cursor-pointer text-muted-foreground text-xs hover:text-foreground">
                  Szczegóły techniczne
                </summary>
                <p className="mt-2 rounded-lg bg-muted/50 p-2 font-mono text-muted-foreground text-xs">
                  {errorMsg}
                </p>
              </details>
            </div>

            {/* Action button */}
            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={() => {
                  setErrorMsg(null)
                  if (videoElement) {
                    start(videoElement)
                  }
                }}
                type="button"
                variant="outline"
              >
                Spróbuj ponownie
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div
            className={cn(
              "absolute top-4 left-1/2 z-10 flex w-[70%] -translate-x-1/2 flex-col gap-2",
              {
                "top-16": isMobile,
              }
            )}
          >
            <p className="h-full w-full text-center">
              Skanujesz w magazynie: {warehouseName}
            </p>
            {modeLabel ? (
              <p className="rounded-full bg-black/50 px-4 py-3 text-center text-sm text-white backdrop-blur-sm">
                Jesteś w trybie:{" "}
                <span className="font-medium">{modeLabel}</span>.
              </p>
            ) : null}
          </div>
          <div className="pointer-events-none absolute inset-0 z-9 flex items-center justify-center">
            <div
              className={cn(
                "relative aspect-square h-1/2 w-auto overflow-hidden rounded-xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]",
                {
                  "h-0 w-0 border-0": isLoading,
                }
              )}
            >
              <div
                className={cn(
                  "absolute top-2 right-3 left-3 h-0.5 animate-qr-scan-line bg-emerald-400/80 shadow-[0_0_12px_rgba(16,185,129,0.9)]",
                  { hidden: isLoading }
                )}
              />
            </div>
          </div>
          {isLoading && (
            <div className="absolute top-1/2 left-1/2 z-10 flex h-full w-full -translate-x-1/2 -translate-y-1/2 items-center justify-center">
              <HugeiconsIcon
                className="size-16 animate-spin"
                icon={Loading03Icon}
              />
            </div>
          )}

          <video
            autoPlay
            className={cn("h-full w-full object-cover")}
            muted
            playsInline
            ref={setVideoRef}
          />

          {!isLoading && (
            <div
              className={cn(
                "absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2",
                { "bottom-12": isMobile }
              )}
            >
              <Button
                className="rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
                onClick={capturePhoto}
                size="sm"
                type="button"
                variant="ghost"
              >
                <HugeiconsIcon className="size-4" icon={Camera01Icon} />
                Rozpoznaj produkt
              </Button>
            </div>
          )}
        </>
      )}
    </>
  )
}
