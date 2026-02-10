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
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { translateMessage } from "@/i18n/translate-message"
import { cn } from "@/lib/utils"

const GS1_BARCODE_PATTERN = /^11(\d{6})01(\d{14})21(\d+)$/
const EAN14_WITH_AI01_PATTERN = /^01(\d{14})$/
const COPY_FEEDBACK_TIMEOUT_MS = 2000
const QR_PREFIX = "QR-"
const QR_CODE_SIZE_SMALL = 64
const QR_CODE_SIZE_MEDIUM = 120

const isQrCode = (value: string): boolean => value.startsWith(QR_PREFIX)

const formatGs1Code = (code: string): string => {
  const ean14Match = EAN14_WITH_AI01_PATTERN.exec(code)
  if (ean14Match) {
    const [, payload] = ean14Match
    return `(01)${payload}`
  }

  const match = GS1_BARCODE_PATTERN.exec(code)
  if (!match) {
    return code
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
      <Skeleton className="rounded" style={{ width: size, height: size }} />
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

export interface PrintableCodeLabel {
  id: string
  subtitle?: string
  title?: string
  value: string
}

interface CodeLabelCardProps {
  label: PrintableCodeLabel
}

function CodeLabelCard({ label }: CodeLabelCardProps) {
  const isQr = isQrCode(label.value)

  return (
    <article
      className={cn("print-label-card space-y-2 rounded-xl border shadow-sm")}
    >
      {(label.title || label.subtitle) && (
        <header className="space-y-0.5">
          {label.title && (
            <p className="font-semibold text-sm text-zinc-900 leading-tight">
              {label.title}
            </p>
          )}
          {label.subtitle && (
            <p className="text-xs text-zinc-500 leading-tight">
              {label.subtitle}
            </p>
          )}
        </header>
      )}

      <div
        className={cn(
          "flex w-full items-center justify-center overflow-hidden rounded-lg bg-white"
        )}
      >
        {isQr ? (
          <QrCodeImage size={QR_CODE_SIZE_MEDIUM} value={label.value} />
        ) : (
          <Barcode
            background="white"
            className="w-full"
            displayValue={false}
            ean128
            format="CODE128"
            height={120}
            lineColor="#000000"
            margin={20}
            value={label.value}
            width={2.5}
          />
        )}
      </div>
    </article>
  )
}

function LabelGrid({ labels }: { labels: readonly PrintableCodeLabel[] }) {
  return (
    <div className={cn("print-label-grid grid gap-3")}>
      {labels.map((label) => (
        <CodeLabelCard key={label.id} label={label} />
      ))}
    </div>
  )
}

interface CodeDialogProps {
  formatted: string
  isQr: boolean
  onOpenChange: (open: boolean) => void
  open: boolean
  value: string
}

function CodeDialog({
  formatted,
  isQr,
  onOpenChange,
  open,
  value,
}: CodeDialogProps) {
  const { copied, handleCopy } = useCopyToClipboard(value)

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isQr
              ? translateMessage("generated.dashboard.items.qrCode")
              : translateMessage("generated.dashboard.items.barcode")}
          </DialogTitle>
          <DialogDescription>
            {translateMessage(
              "generated.dashboard.items.enlargedCodeViewQuickLabel"
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <LabelGrid labels={[{ id: value, value }]} />

          <p className="select-all break-all text-center font-mono text-sm text-zinc-600">
            {formatted}
          </p>

          <Button className="w-full" onClick={handleCopy} variant="outline">
            <HugeiconsIcon
              className="mr-2 size-4"
              icon={copied ? Tick02Icon : Copy01Icon}
            />
            {copied
              ? translateMessage("generated.dashboard.items.copied")
              : translateMessage("generated.dashboard.items.copyCode")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface CodeCellProps {
  value: string
}

export function CodeCell({ value }: CodeCellProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const isQr = isQrCode(value)
  const formatted = isQr ? value : formatGs1Code(value)

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          className="group/code flex w-fit cursor-pointer flex-col gap-1.5 rounded-lg border border-border/50 bg-white p-2.5 shadow-sm transition-all hover:border-border hover:shadow-md dark:bg-white/95"
          onClick={() => setDialogOpen(true)}
        >
          {isQr ? (
            <QrCodeImage size={QR_CODE_SIZE_SMALL} value={value} />
          ) : (
            <Barcode
              background="transparent"
              displayValue={false}
              format="CODE128"
              height={40}
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
        <TooltipContent>
          {translateMessage("generated.dashboard.items.clickEnlarge")}
        </TooltipContent>
      </Tooltip>
      <CodeDialog
        formatted={formatted}
        isQr={isQr}
        onOpenChange={setDialogOpen}
        open={dialogOpen}
        value={value}
      />
    </>
  )
}
