"use client"

import { Cancel01Icon, Loading03Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser"
import {
  BarcodeFormat,
  DecodeHintType,
  NotFoundException,
  type Result,
} from "@zxing/library"
import { useTranslations } from "next-intl"
import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "../ui/button"
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs"
import type { ScannerMode, ScannerTab } from "./scanner-types"

const CODE_FORMATS = [
  BarcodeFormat.QR_CODE,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.DATA_MATRIX,
  BarcodeFormat.PDF_417,
  BarcodeFormat.AZTEC,
  BarcodeFormat.ITF,
] as const

const DECODE_HINTS = new Map<DecodeHintType, unknown>([
  [DecodeHintType.POSSIBLE_FORMATS, CODE_FORMATS],
])

interface ScannerCameraProps {
  scanDelayMs: number
  stopOnScan: boolean
  constraints?: MediaStreamConstraints
  warehouseName?: string
  isMobile: boolean
  isOpen: boolean
  mode: ScannerMode
  onModeChange: (value: ScannerMode) => void
  onScan: (text: string) => void
  onRequestClose: () => void
  isLoading?: boolean
  tabTriggers: ScannerTab[]
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
  tabTriggers,
}: ScannerCameraProps) {
  const t = useTranslations("scanner")
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
    (nextMode: ScannerMode) => {
      return tabTriggers.findIndex((t) => t.action === nextMode) * 100
    },
    [tabTriggers]
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
        const msg = err instanceof Error ? err.message : t("errors.unexpected")
        setErrorMsg(msg)
      }
    },
    [handleDecodedText, t]
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

        const reader = new BrowserMultiFormatReader(DECODE_HINTS)
        readerRef.current = reader

        const mediaConstraints: MediaStreamConstraints =
          constraints ??
          ({
            video: {
              facingMode: { ideal: "environment" },
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
        const msg = e instanceof Error ? e.message : t("errors.startFailed")
        setErrorMsg(msg)
        stop()
      }
    },
    [constraints, handleScanResult, stop, t]
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
        className={cn("absolute top-12 right-2 z-10", {
          "top-4 right-4": !isMobile,
        })}
        onClick={onRequestClose}
        size="icon-sm"
        variant="ghost"
      >
        <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
        <span className="sr-only">{t("actions.close")}</span>
      </Button>

      {errorMsg ? (
        <div className="absolute top-1/2 left-1/2 w-full -translate-x-1/2 -translate-y-1/2">
          <p className="m-4 text-center text-red-600">
            {t("errors.cameraIntro")}
            <br />
            <br />
            {t("errors.details", { error: errorMsg })}
          </p>

          <Button
            className="mx-auto mt-4 block"
            onClick={() => {
              setErrorMsg(null)
              if (videoElement) {
                start(videoElement)
              }
            }}
            type="button"
          >
            {t("actions.retry")}
          </Button>
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
              {t("camera.scanning", {
                warehouse: warehouseName ?? t("camera.unknownWarehouse"),
              })}
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
                {tabTriggers.map(({ action }) => (
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
                    {t(`tabs.${action}`)}
                  </TabsTrigger>
                ))}
                <div
                  className={cn(
                    "pointer-events-none absolute left-0 h-[80%] bg-white p-4 transition-transform"
                  )}
                  role="presentation"
                  style={{
                    width: `${100 / tabTriggers.length}%`,
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
            className={cn("h-full w-full object-cover")}
            muted
            ref={setVideoRef}
          />
        </>
      )}
    </>
  )
}
