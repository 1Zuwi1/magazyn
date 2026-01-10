import { useMemo } from "react"
import { CanvasTexture, RepeatWrapping } from "three"

const STRIPE_TEXTURE_SIZE = 64
const STRIPE_LINE_WIDTH = 8
const STRIPE_GAP = 8
const STRIPE_ANGLE = -Math.PI / 4

export const STRIPE_EMISSIVE_INTENSITY = 0.12
export const STRIPE_MATERIAL_DEFAULTS = {
  depthWrite: false,
  metalness: 0.05,
  opacity: 0.7,
  polygonOffset: true,
  polygonOffsetFactor: -1,
  polygonOffsetUnits: -1,
  roughness: 0.7,
  transparent: true,
} as const

function createStripeCanvas(): HTMLCanvasElement | null {
  if (typeof document === "undefined") {
    return null
  }

  const canvas = document.createElement("canvas")
  canvas.width = STRIPE_TEXTURE_SIZE
  canvas.height = STRIPE_TEXTURE_SIZE
  const context = canvas.getContext("2d")

  if (!context) {
    return null
  }

  context.fillStyle = "black"
  context.fillRect(0, 0, STRIPE_TEXTURE_SIZE, STRIPE_TEXTURE_SIZE)
  context.strokeStyle = "white"
  context.lineWidth = STRIPE_LINE_WIDTH
  context.lineCap = "square"

  context.save()
  context.translate(STRIPE_TEXTURE_SIZE / 2, STRIPE_TEXTURE_SIZE / 2)
  context.rotate(STRIPE_ANGLE)
  context.translate(-STRIPE_TEXTURE_SIZE / 2, -STRIPE_TEXTURE_SIZE / 2)

  const step = STRIPE_LINE_WIDTH + STRIPE_GAP
  for (let x = -STRIPE_TEXTURE_SIZE; x <= STRIPE_TEXTURE_SIZE * 2; x += step) {
    context.beginPath()
    context.moveTo(x, -STRIPE_TEXTURE_SIZE)
    context.lineTo(x, STRIPE_TEXTURE_SIZE * 2)
    context.stroke()
  }
  context.restore()

  return canvas
}

export function useStripeTexture(): CanvasTexture | null {
  return useMemo(() => {
    const canvas = createStripeCanvas()
    if (!canvas) {
      return null
    }

    const texture = new CanvasTexture(canvas)
    texture.wrapS = RepeatWrapping
    texture.wrapT = RepeatWrapping
    texture.needsUpdate = true
    return texture
  }, [])
}
