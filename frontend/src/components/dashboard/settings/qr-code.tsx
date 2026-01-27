"use client"

import QRCode from "qrcode"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

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
  size = 160,
  className,
  errorCorrectionLevel = "M",
}: QRCodeDisplayProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!value) {
      setDataUrl(null)
      return
    }

    QRCode.toDataURL(value, {
      width: size,
      margin: 2,
      errorCorrectionLevel,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    })
      .then((url) => {
        setDataUrl(url)
        setError(null)
      })
      .catch(() => {
        setError("Nie udało się wygenerować kodu QR")
        setDataUrl(null)
      })
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
    <div
      className={cn(
        "overflow-hidden rounded-lg border bg-white p-2",
        className
      )}
    >
      {/* biome-ignore lint: QR code is generated dynamically as data URL */}
      <img
        alt="Kod QR do zeskanowania"
        className="block"
        height={size}
        src={dataUrl}
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
  const cleanSecret = secret.replace(/\s/g, "")

  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${cleanSecret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`
}
