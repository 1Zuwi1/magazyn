"use client"

import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Image from "next/image"
import QRCode from "qrcode"
import { useEffect, useRef, useState } from "react"
import Barcode from "react-barcode"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const GS1_BARCODE_PATTERN = /^11(\d{6})01(\d{14})21(\d+)$/
const COPY_FEEDBACK_TIMEOUT_MS = 2000
const QR_PREFIX = "QR-"
const QR_CODE_SIZE = 64

const isQrCode = (value: string): boolean => value.startsWith(QR_PREFIX)

const formatGs1Barcode = (barcode: string): string => {
  const match = GS1_BARCODE_PATTERN.exec(barcode)
  if (!match) {
    return barcode
  }

  const [, productionDate, gtin, serial] = match
  return `(11)${productionDate}(01)${gtin}(21)${serial}`
}

function QrCodeImage({ value }: { value: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    let isCancelled = false
    const generate = async () => {
      try {
        const url = await QRCode.toDataURL(value, {
          width: QR_CODE_SIZE,
          margin: 1,
          errorCorrectionLevel: "M",
          color: { dark: "#18181b", light: "#ffffff" },
        })
        if (!isCancelled) {
          setDataUrl(url)
        }
      } catch {
        // Silently fail
      }
    }
    generate()
    return () => {
      isCancelled = true
    }
  }, [value])

  if (!dataUrl) {
    return (
      <div
        className="animate-pulse rounded bg-muted"
        style={{ width: QR_CODE_SIZE, height: QR_CODE_SIZE }}
      />
    )
  }

  return (
    <Image
      alt={`Kod QR: ${value}`}
      className="block rounded"
      height={QR_CODE_SIZE}
      src={dataUrl}
      unoptimized
      width={QR_CODE_SIZE}
    />
  )
}

interface BarcodeCellProps {
  value: string
}

export function BarcodeCell({ value }: BarcodeCellProps) {
  const [copied, setCopied] = useState(false)
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isQr = isQrCode(value)

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current)
      }
    }
  }, [])

  const handleCopy = async () => {
    if (!navigator.clipboard) {
      return
    }

    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current)
      }
      copyTimeoutRef.current = setTimeout(
        setCopied,
        COPY_FEEDBACK_TIMEOUT_MS,
        false
      )
    } catch {
      // Silently fail - clipboard may not be available
    }
  }

  const formatted = isQr ? value : formatGs1Barcode(value)

  return (
    <Tooltip>
      <TooltipTrigger
        className="group/barcode flex w-fit cursor-pointer flex-col gap-1.5 rounded-lg border border-border/50 bg-white p-2.5 shadow-sm transition-all hover:border-border hover:shadow-md dark:bg-white/95"
        onClick={handleCopy}
      >
        {isQr ? (
          <QrCodeImage value={value} />
        ) : (
          <Barcode
            background="transparent"
            displayValue={false}
            format="CODE128"
            height={32}
            lineColor="#18181b"
            margin={0}
            value={value}
            width={1}
          />
        )}
        <div className="flex items-center gap-1.5">
          <span className="select-all break-all font-mono text-[9px] text-zinc-600 leading-tight">
            {formatted}
          </span>
          <span className="shrink-0 opacity-0 transition-opacity group-hover/barcode:opacity-100">
            <HugeiconsIcon
              className="size-3 text-zinc-400"
              icon={copied ? Tick02Icon : Copy01Icon}
            />
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {copied ? "Skopiowano!" : "Kliknij, aby skopiować"}
      </TooltipContent>
    </Tooltip>
  )
}
