"use client"

import { Image01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"
import { cn } from "@/lib/utils"

const DEFAULT_IMAGE_SIZE = 100

interface ItemPhotoProps {
  src?: string | null
  alt: string
  containerClassName?: string
  imageClassName?: string
  iconClassName?: string
  width?: number
  height?: number
}

export function ItemPhoto({
  src,
  alt,
  containerClassName,
  imageClassName,
  iconClassName,
  width = DEFAULT_IMAGE_SIZE,
  height = DEFAULT_IMAGE_SIZE,
}: ItemPhotoProps) {
  const parsedSrc = `${process.env.NEXT_PUBLIC_API_URL ?? ""}${src ?? ""}`
  const [failedImageSource, setFailedImageSource] = useState<string | null>(
    null
  )
  const hasLoadingError =
    parsedSrc !== undefined &&
    parsedSrc !== null &&
    failedImageSource === parsedSrc

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

  return (
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
}
