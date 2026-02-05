"use client"

import {
  AlertCircleIcon,
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
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs"
import { TAB_TRIGGERS } from "./scanner"

const CODE_FORMATS = [BarcodeFormat.QR_CODE, BarcodeFormat.CODE_128] as const

const DECODE_HINTS = new Map<DecodeHintType, unknown>([
  [DecodeHintType.POSSIBLE_FORMATS, CODE_FORMATS],
  [DecodeHintType.ASSUME_GS1, true],
])

interface ScannerCameraProps {
  scanDelayMs: number
  stopOnScan: boolean
  constraints?: MediaStreamConstraints
  warehouseName?: string
  isMobile: boolean
  isOpen: boolean
  mode: (typeof TAB_TRIGGERS)[number]["action"]
  onModeChange: (value: (typeof TAB_TRIGGERS)[number]["action"]) => void
  onScan: (text: string) => void
  onRequestClose: () => void
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
  onModeChange,
  onRequestClose,
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
  const setVideoRef = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node
    setVideoElement(node)
  }, [])

  const lastAtRef = useRef<number>(0)

  const getTranslation = useCallback(
    (mode: (typeof TAB_TRIGGERS)[number]["action"]) => {
      return TAB_TRIGGERS.findIndex((t) => t.action === mode) * 100
    },
    []
  )

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
      setErrorMsg(null)
      try {
        // iOS Safari friendliness
        currentVideo.setAttribute("playsinline", "true")
        currentVideo.setAttribute("webkit-playsinline", "true")
        currentVideo.autoplay = true
        currentVideo.muted = true

        const reader = new BrowserMultiFormatReader(DECODE_HINTS, {
          delayBetweenScanAttempts: 300,
        })
        readerRef.current = reader

        const mediaConstraints: MediaStreamConstraints =
          constraints ??
          ({
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              frameRate: { ideal: 30, max: 60 },
            },
            audio: false,
          } satisfies MediaStreamConstraints)

        const controls = await reader.decodeFromConstraints(
          mediaConstraints,
          currentVideo,
          handleScanResult
        )

        controlsRef.current = controls
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Could not start the camera scanner."
        setErrorMsg(msg)
        stop()
      }
    },
    [constraints, handleScanResult, stop]
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
            <div className="pt-2">
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
            <Tabs
              className="h-full w-full"
              onValueChange={onModeChange}
              value={mode}
            >
              <TabsList
                className={
                  "relative isolate flex w-full gap-2 rounded-full bg-black/50 p-1 py-4 *:rounded-full *:px-4 *:py-3"
                }
              >
                {TAB_TRIGGERS.map(({ text, action }) => (
                  <TabsTrigger
                    className={cn(
                      "z-10 w-0 flex-1 bg-transparent! text-white!",
                      {
                        "text-black!": mode === action,
                      }
                    )}
                    key={action}
                    value={action}
                  >
                    {text}
                  </TabsTrigger>
                ))}
                <div
                  className={cn(
                    "pointer-events-none absolute left-0 h-[80%] bg-white p-4 transition-transform"
                  )}
                  role="presentation"
                  style={{
                    width: `${100 / TAB_TRIGGERS.length}%`,
                    transform: `translateX(${getTranslation(mode)}%)`,
                  }}
                />
              </TabsList>
            </Tabs>
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
        </>
      )}
    </>
  )
}
