import type { RefObject } from "react"
import { useEffect, useState } from "react"

interface ElementSize {
  elementWidth: number
  elementHeight: number
}

export function useElementSize<T extends HTMLElement>(
  elementRef: RefObject<T | null>
): ElementSize {
  const [size, setSize] = useState<ElementSize>({
    elementWidth: 0,
    elementHeight: 0,
  })

  useEffect(() => {
    const element = elementRef.current
    if (!element) {
      return
    }

    const updateSize = () => {
      const nextWidth = element.clientWidth
      const nextHeight = element.clientHeight

      setSize((currentSize) => {
        if (
          currentSize.elementWidth === nextWidth &&
          currentSize.elementHeight === nextHeight
        ) {
          return currentSize
        }

        return {
          elementWidth: nextWidth,
          elementHeight: nextHeight,
        }
      })
    }

    updateSize()

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateSize)
      return () => window.removeEventListener("resize", updateSize)
    }

    const resizeObserver = new ResizeObserver(() => {
      updateSize()
    })

    resizeObserver.observe(element)
    return () => resizeObserver.disconnect()
  }, [elementRef])

  return size
}
