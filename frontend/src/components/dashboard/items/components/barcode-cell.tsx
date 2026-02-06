"use client"

import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Image from "next/image"
import QRCode from "qrcode"
import { useCallback, useEffect, useRef, useState } from "react"
import Barcode from "react-barcode"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const GS1_BARCODE_PATTERN = /^11(\d{6})01(\d{14})21(\d+)$/
const COPY_FEEDBACK_TIMEOUT_MS = 2000
const QR_PREFIX = "QR-"
const QR_CODE_SIZE_SMALL = 64
const QR_CODE_SIZE_LARGE = 256

const isQrCode = (value: string): boolean => value.startsWith(QR_PREFIX)

const formatGs1Barcode = (barcode: string): string => {
  const match = GS1_BARCODE_PATTERN.exec(barcode)
  if (!match) {
    return barcode
  }

  const [, productionDate, gtin, serial] = match
  return `(11)${productionDate}(01)${gtin}(21)${serial}`
}

function QrCodeImage({ value, size }: { value: string; size: number }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)

  useEffect(() => {
    let isCancelled = false
    const generate = async () => {
      try {
        const url = await QRCode.toDataURL(value, {
          width: size,
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
  }, [value, size])

  if (!dataUrl) {
    return (
      <div
        className="animate-pulse rounded bg-muted"
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <Image
      alt={`Kod QR: ${value}`}
      className="block rounded"
      height={size}
      src={dataUrl}
      unoptimized
      width={size}
    />
  )
}

function useCopyToClipboard(value: string) {
  const [copied, setCopied] = useState(false)
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current)
      }
    }
  }, [])

  const handleCopy = useCallback(async () => {
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
  }, [value])

  return { copied, handleCopy }
}

interface BarcodeDialogProps {
  formatted: string
  isQr: boolean
  onOpenChange: (open: boolean) => void
  open: boolean
  value: string
}

function BarcodeDialog({
  formatted,
  isQr,
  onOpenChange,
  open,
  value,
}: BarcodeDialogProps) {
  const { copied, handleCopy } = useCopyToClipboard(value)

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isQr ? "Kod QR" : "Kod kreskowy"}</DialogTitle>
          <DialogDescription className="sr-only">
            Powiększony widok kodu: {formatted}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="rounded-lg border border-border/50 bg-white p-4 dark:bg-white/95">
            {isQr ? (
              <QrCodeImage size={QR_CODE_SIZE_LARGE} value={value} />
            ) : (
              <Barcode
                background="transparent"
                displayValue={false}
                format="CODE128"
                height={80}
                lineColor="#18181b"
                margin={0}
                value={value}
                width={2.5}
              />
            )}
          </div>
          <span className="select-all break-all text-center font-mono text-sm text-zinc-600">
            {formatted}
          </span>
          <Button className="w-full" onClick={handleCopy} variant="outline">
            <HugeiconsIcon
              className="mr-2 size-4"
              icon={copied ? Tick02Icon : Copy01Icon}
            />
            {copied ? "Skopiowano!" : "Kopiuj kod"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface BarcodeCellProps {
  value: string
}

export function BarcodeCell({ value }: BarcodeCellProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const isQr = isQrCode(value)
  const formatted = isQr ? value : formatGs1Barcode(value)

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          className="group/barcode flex w-fit cursor-pointer flex-col gap-1.5 rounded-lg border border-border/50 bg-white p-2.5 shadow-sm transition-all hover:border-border hover:shadow-md dark:bg-white/95"
          onClick={() => setDialogOpen(true)}
        >
          {isQr ? (
            <QrCodeImage size={QR_CODE_SIZE_SMALL} value={value} />
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
          <span className="select-all break-all font-mono text-[9px] text-zinc-600 leading-tight">
            {formatted}
          </span>
        </TooltipTrigger>
        <TooltipContent>Kliknij, aby powiększyć</TooltipContent>
      </Tooltip>
      <BarcodeDialog
        formatted={formatted}
        isQr={isQr}
        onOpenChange={setDialogOpen}
        open={dialogOpen}
        value={value}
      />
    </>
  )
}
