import type { ThreeEvent } from "@react-three/fiber"
import { useRef } from "react"

const DRAG_THRESHOLD = 5

/**
 * Distinguishes genuine clicks from camera-drag releases.
 *
 * Usage:
 *   const { onPointerDown, shouldIgnoreClick } = useClickGuard()
 *   <mesh onPointerDown={onPointerDown} onClick={(e) => { if (!shouldIgnoreClick(e)) handle() }} />
 */
export function useClickGuard(threshold = DRAG_THRESHOLD) {
  const downPos = useRef<{ x: number; y: number } | null>(null)

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    downPos.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY }
  }

  const shouldIgnoreClick = (e: ThreeEvent<MouseEvent>) => {
    if (!downPos.current) {
      return false
    }
    const dx = e.nativeEvent.clientX - downPos.current.x
    const dy = e.nativeEvent.clientY - downPos.current.y
    return dx * dx + dy * dy > threshold * threshold
  }

  return { onPointerDown, shouldIgnoreClick }
}
