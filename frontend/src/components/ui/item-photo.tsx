"use client"

import { Image01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { translateMessage } from "@/i18n/translate-message"
import { cn } from "@/lib/utils"

const DEFAULT_IMAGE_SIZE = 100
const PREVIEW_IMAGE_SIZE = 960

interface ItemPhotoProps {
  src?: string | null
  alt: string
  containerClassName?: string
  imageClassName?: string
  iconClassName?: string
  width?: number
  height?: number
  zoomable?: boolean
}

export const parseImageSrc = (src?: string | null): string | null => {
  const normalizedSrc = src?.trim()

  if (normalizedSrc) {
    if (normalizedSrc.startsWith("http")) {
      return normalizedSrc
    }
    return `${process.env.NEXT_PUBLIC_API_URL ?? ""}${normalizedSrc}`
  }

  return null
}

export function ItemPhoto({
  src,
  alt,
  containerClassName,
  imageClassName,
  iconClassName,
  width = DEFAULT_IMAGE_SIZE,
  height = DEFAULT_IMAGE_SIZE,
  zoomable = false,
}: ItemPhotoProps) {
  const [failedImageSource, setFailedImageSource] = useState<string | null>(
    null
  )
  const parsedSrc = parseImageSrc(src)
  const [previewOpen, setPreviewOpen] = useState(false)
  const hasLoadingError = parsedSrc !== null && failedImageSource === parsedSrc

  if (!parsedSrc || hasLoadingError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center overflow-hidden rounded-lg bg-muted",
          containerClassName
        )}
      >
        <HugeiconsIcon
          className={cn("size-4 text-muted-foreground", iconClassName)}
          icon={Image01Icon}
        />
      </div>
    )
  }

  const thumbnail = (
    <div
      className={cn("overflow-hidden rounded-lg bg-muted", containerClassName)}
    >
      {/* biome-ignore lint/performance/noImgElement: img needs authorization */}
      {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: onError is used only to swap to visual fallback for broken image URLs */}
      <img
        alt={alt}
        className={cn("h-full w-full", imageClassName)}
        height={height}
        onError={() => setFailedImageSource(parsedSrc)}
        src={parsedSrc}
        width={width}
      />
    </div>
  )

  if (!zoomable) {
    return thumbnail
  }

  return (
    <>
      <button
        aria-label={translateMessage("generated.ui.enlargePhoto", {
          value0: alt,
        })}
        className="cursor-zoom-in rounded-lg transition-opacity hover:opacity-90"
        onClick={() => setPreviewOpen(true)}
        type="button"
      >
        {thumbnail}
      </button>
      <Dialog onOpenChange={setPreviewOpen} open={previewOpen}>
        <DialogContent className="max-w-[calc(100%-1rem)] p-3 sm:max-w-4xl sm:p-4">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {translateMessage("generated.ui.enlargedProductPhoto")}
            </DialogTitle>
            <DialogDescription>{alt}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[80vh] overflow-hidden rounded-lg bg-muted">
            {/* biome-ignore lint/performance/noImgElement: img needs authorization */}
            {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: onError is used only to swap to visual fallback for broken image URLs */}
            <img
              alt={alt}
              className="h-auto max-h-[80vh] w-full object-contain"
              height={PREVIEW_IMAGE_SIZE}
              onError={() => setFailedImageSource(parsedSrc)}
              src={parsedSrc}
              width={PREVIEW_IMAGE_SIZE}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
