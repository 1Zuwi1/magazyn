"use client"

import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser"
import { NotFoundException } from "@zxing/library"
import { useCallback, useEffect, useRef, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface QrScannerProps {
  onScan: (text: string) => void
  onError?: (err: unknown) => void
  /** Prevents spamming the same result continuously */
  scanDelayMs?: number
  /** Stop camera as soon as a QR is read */
  stopOnScan?: boolean
  /** Override camera constraints if you want */
  constraints?: MediaStreamConstraints
  className?: string
}

export function QrScanner({
  onScan,
  onError,
  scanDelayMs = 1200,
  stopOnScan = false,
  constraints,
  className,
}: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)

  const lastTextRef = useRef<string>("")
  const lastAtRef = useRef<number>(0)

  const [running, setRunning] = useState(false)
  const [starting, setStarting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const stop = useCallback(() => {
    controlsRef.current?.stop()
    controlsRef.current = null

    // Helps release camera in some browsers
    if (videoRef.current) {
      const v = videoRef.current
      v.pause()
      v.srcObject = null
    }

    setRunning(false)
    setStarting(false)
  }, [])

  const start = useCallback(async () => {
    setErrorMsg(null)
    setStarting(true)

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
        (result, err) => {
          if (result) {
            const text = result.getText()
            const now = Date.now()

            // Dedupe/throttle: same QR tends to fire repeatedly
            const tooSoon = now - lastAtRef.current < scanDelayMs
            const sameText = text === lastTextRef.current
            if (sameText && tooSoon) {
              return
            }

            lastTextRef.current = text
            lastAtRef.current = now

            onScan(text)

            if (stopOnScan) {
              // stop immediately after first successful scan
              controlsRef.current?.stop()
              controlsRef.current = null
              setRunning(false)
            }
            return
          }

          // ZXing throws NotFoundException constantly when no QR is visible.
          // That’s not an "error", it’s just "keep looking".
          if (err && !(err instanceof NotFoundException)) {
            onError?.(err)
          }
        }
      )

      controlsRef.current = controls
      setRunning(true)
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Could not start the camera scanner."
      setErrorMsg(msg)
      onError?.(e)
      stop()
    } finally {
      setStarting(false)
    }
  }, [constraints, onError, onScan, scanDelayMs, stopOnScan, stop])

  useEffect(() => {
    return () => stop() // cleanup on unmount
  }, [stop])

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>QR Scanner</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {errorMsg ? (
          <Alert variant="destructive">
            <AlertTitle>Camera / Scanner error</AlertTitle>
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        ) : null}

        <div className="relative overflow-hidden rounded-lg border">
          <video className="h-auto w-full" muted ref={videoRef} />
        </div>

        <div className="flex gap-2">
          {running ? (
            <Button onClick={stop} variant="secondary">
              Stop
            </Button>
          ) : (
            <Button disabled={starting} onClick={start}>
              {starting ? "Starting…" : "Start scanning"}
            </Button>
          )}
        </div>

        <p className="text-muted-foreground text-sm">
          Works on HTTPS (or localhost). If your site is plain HTTP, browsers
          will treat your camera request like a prank and deny it.
        </p>
      </CardContent>
    </Card>
  )
}
