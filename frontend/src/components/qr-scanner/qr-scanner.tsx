"use client"

import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser"
import { NotFoundException, type Result } from "@zxing/library"
import { usePathname } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs"

interface QrScannerProps {
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

export function QrScanner({
  scanDelayMs = 1200,
  stopOnScan = false,
  constraints,
  warehouseName,
  className,
}: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)

  const lastTextRef = useRef<string>("")
  const lastAtRef = useRef<number>(0)
  const [mode, setMode] = useState<number>(0)
  const modeRef = useRef<number>(mode)

  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const onScan = useCallback((text: string) => {
    console.log(
      "Scanned QR code:",
      text,
      "Action:",
      TAB_TRIGGERS[modeRef.current].action
    )
  }, [])

  const onError = useCallback((err: unknown) => {
    console.error("QR Scanner error:", err)
  }, [])

  const stopAfterScan = useCallback(() => {
    controlsRef.current?.stop()
    controlsRef.current = null
  }, [])

  const shouldIgnoreScan = useCallback(
    (text: string, now: number) => {
      const tooSoon = now - lastAtRef.current < scanDelayMs
      const sameText = text === lastTextRef.current
      return sameText && tooSoon
    },
    [scanDelayMs]
  )

  const recordScan = useCallback((text: string, now: number) => {
    lastTextRef.current = text
    lastAtRef.current = now
  }, [])

  const handleDecodedText = useCallback(
    (text: string) => {
      const now = Date.now()
      if (shouldIgnoreScan(text, now)) {
        return
      }

      recordScan(text, now)
      onScan(text)

      if (stopOnScan) {
        // stop immediately after first successful scan
        stopAfterScan()
      }
    },
    [onScan, recordScan, shouldIgnoreScan, stopAfterScan, stopOnScan]
  )

  const handleScanResult = useCallback(
    (result: Result | undefined, err: unknown) => {
      if (result) {
        handleDecodedText(result.getText())
        return
      }

      // ZXing throws NotFoundException constantly when no QR is visible.
      // That’s not an "error", it’s just "keep looking".
      if (err && !(err instanceof NotFoundException)) {
        onError?.(err)
      }
    },
    [handleDecodedText, onError]
  )

  const stop = useCallback(() => {
    controlsRef.current?.stop()
    controlsRef.current = null

    // Helps release camera in some browsers
    if (videoRef.current) {
      const v = videoRef.current
      v.pause()
      v.srcObject = null
      v.remove()
    }
  }, [])

  const start = useCallback(async () => {
    setErrorMsg(null)

    try {
      if (!videoRef.current) {
        throw new Error("Video element not ready.")
      }

      // iOS Safari friendliness
      videoRef.current.setAttribute("playsinline", "true")

      const reader = new BrowserMultiFormatReader()
      readerRef.current = reader

      const mediaConstraints: MediaStreamConstraints =
        constraints ??
        ({
          video: {
            facingMode: { ideal: "environment" }, // try to prefer back camera
          },
          audio: false,
        } satisfies MediaStreamConstraints)

      const controls = await reader.decodeFromConstraints(
        mediaConstraints,
        videoRef.current,
        handleScanResult
      )

      controlsRef.current = controls
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Could not start the camera scanner."
      setErrorMsg(msg)
      onError?.(e)
      stop()
    }
  }, [constraints, handleScanResult, onError, stop])

  const pathname = usePathname()

  useEffect(() => {
    if (!pathname.includes("/dashboard/warehouse/")) {
      setErrorMsg("Skaner QR jest dostępny tylko w widoku magazynu.")
      return
    }
    start()

    return () => stop() // cleanup on unmount
  }, [stop, start, pathname])

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  return (
    <div
      className={cn(
        "relative h-auto max-h-120 min-h-84 w-auto max-w-lg overflow-hidden rounded-lg border",
        className
      )}
    >
      {errorMsg ? (
        <div className="absolute top-1/2 left-1/2 w-full -translate-x-1/2 -translate-y-1/2">
          <p className="m-4 text-center text-red-600">
            Wystąpił błąd. Upewnij się że Twoja kamera jest podłączona i
            dostępna oraz że udzieliłeś/aś pozwolenia na jej użycie.
            <br />
            <br />
            Szczegóły: {errorMsg}
          </p>
        </div>
      ) : (
        <>
          <div className="absolute top-4 left-1/2 z-10 w-[70%] -translate-x-1/2">
            <p className="h-full w-full text-center">
              Skanujesz w magazynie: {decodeURIComponent(warehouseName ?? "")}
            </p>
            <Tabs
              className="h-full w-full"
              onValueChange={setMode}
              value={mode}
            >
              <TabsList
                className={
                  "relative isolate flex w-full gap-2 rounded-full bg-black/50 p-1 py-4 *:rounded-full *:px-4 *:py-3"
                }
              >
                {TAB_TRIGGERS.map(({ text, action }, index) => (
                  <TabsTrigger
                    className={cn(
                      "z-10 w-0 flex-1 bg-transparent! text-white!",
                      {
                        "text-black!": mode === index,
                      }
                    )}
                    key={action}
                    value={index}
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
                    transform: `translateX(${mode * 100}%)`,
                  }}
                />
              </TabsList>
            </Tabs>
          </div>
          <div className="pointer-events-none absolute inset-0 z-9 flex items-center justify-center">
            <div className="relative aspect-square h-1/2 w-auto overflow-hidden rounded-xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]">
              <div className="absolute top-2 right-3 left-3 h-0.5 animate-qr-scan-line bg-emerald-400/80 shadow-[0_0_12px_rgba(16,185,129,0.9)]" />
            </div>
          </div>
          <video className="h-auto w-full" muted ref={videoRef} />
        </>
      )}
    </div>
  )
}
