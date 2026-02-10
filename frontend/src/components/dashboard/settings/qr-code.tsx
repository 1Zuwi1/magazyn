"use client"

import Image from "next/image"
import QRCode from "qrcode"
import { useEffect, useState } from "react"
import { translateMessage } from "@/i18n/translate-message"
import { cn } from "@/lib/utils"
import { QR_CODE_DEFAULT_SIZE } from "./constants"

interface QRCodeDisplayProps {
  /** The text/URL to encode in the QR code */
  value: string
  /** Size of the QR code in pixels */
  size?: number
  /** Additional CSS classes */
  className?: string
  /** Error correction level */
  errorCorrectionLevel?: "L" | "M" | "Q" | "H"
}

export function QRCodeDisplay({
  value,
  size = QR_CODE_DEFAULT_SIZE,
  className,
  errorCorrectionLevel = "M",
}: QRCodeDisplayProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isCancelled = false
    const normalizedValue = value.trim()

    if (!normalizedValue) {
      setDataUrl(null)
      setError(null)
      return
    }

    setDataUrl(null)
    setError(null)

    const generateQrCode = async () => {
      try {
        const url = await QRCode.toDataURL(normalizedValue, {
          width: size,
          margin: 4,
          errorCorrectionLevel,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        })
        if (isCancelled) {
          return
        }
        setDataUrl(url)
        setError(null)
      } catch {
        if (isCancelled) {
          return
        }
        setError(translateMessage("generated.m0578"))
        setDataUrl(null)
      }
    }

    generateQrCode()

    return () => {
      isCancelled = true
    }
  }, [value, size, errorCorrectionLevel])

  if (error) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg border border-destructive/50 border-dashed bg-destructive/5 text-center text-destructive text-xs",
          className
        )}
        style={{ width: size, height: size }}
      >
        {error}
      </div>
    )
  }

  if (!dataUrl) {
    return (
      <div
        className={cn("animate-pulse rounded-lg bg-muted", className)}
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <div className={cn("overflow-hidden rounded-lg border", className)}>
      <Image
        alt={translateMessage("generated.m0579")}
        className="block"
        height={size}
        priority
        src={dataUrl}
        unoptimized
        width={size}
      />
    </div>
  )
}

/**
 * Generates a TOTP URI for authenticator apps
 * Format: otpauth://totp/LABEL?secret=SECRET&issuer=ISSUER
 */
export function generateTotpUri(
  secret: string,
  accountName: string,
  issuer = "MagazynPro"
): string {
  const encodedIssuer = encodeURIComponent(issuer)
  const encodedAccount = encodeURIComponent(accountName)
  const cleanSecret = secret.replace(/\s/g, "").toUpperCase()

  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${cleanSecret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`
}
