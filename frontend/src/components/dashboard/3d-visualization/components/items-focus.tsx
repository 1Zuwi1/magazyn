import { Instance, Instances, useTexture } from "@react-three/drei"
import { useEffect, useMemo, useState } from "react"
import * as THREE from "three"
import { VISUALIZATION_CONSTANTS } from "../constants"
import type { FocusWindow, Item3D, ItemStatus, Rack3D } from "../types"
import { getItemVisuals, ITEM_STATUS_ORDER } from "../types"
import {
  getGridDimensions,
  getRackMetrics,
  type RackMetrics,
} from "./rack-metrics"
import {
  STRIPE_EMISSIVE_INTENSITY,
  STRIPE_MATERIAL_DEFAULTS,
  useStripeTexture,
} from "./stripe-texture"

const {
  LOADING,
  SCALES: { image: IMAGE_SCALE, glow: GLOW_SCALE },
  OFFSETS: {
    imageZ: IMAGE_Z_OFFSET,
    glowZ: GLOW_Z_OFFSET,
    stripeZ: STRIPE_Z_OFFSET,
  },
} = VISUALIZATION_CONSTANTS

interface FocusItemImage {
  position: [number, number, number]
  status: Item3D["status"]
  imageUrl: string
  glowOpacity: number
  emissiveIntensity: number
}

interface FocusItemSolid {
  position: [number, number, number]
  status: Item3D["status"]
}

interface ItemsWithImagesProps {
  items: FocusItemImage[]
  size: { w: number; h: number }
  zOffset: number
  stripeTexture: THREE.Texture | null
}

function ItemsWithImages({
  items,
  size,
  zOffset,
  stripeTexture,
}: ItemsWithImagesProps) {
  const uniqueUrls = useMemo(() => {
    const urls = new Set<string>()
    for (const item of items) {
      urls.add(item.imageUrl)
    }
    return Array.from(urls)
  }, [items])
  const [textureCache, setTextureCache] = useState<Map<string, THREE.Texture>>(
    () => new Map()
  )
  const [loadErrors, setLoadErrors] = useState<Set<string>>(() => new Set())
  const pendingUrls = useMemo(() => {
    const pending: string[] = []
    for (const url of uniqueUrls) {
      if (!(textureCache.has(url) || loadErrors.has(url))) {
        pending.push(url)
      }
    }
    return pending
  }, [uniqueUrls, textureCache, loadErrors])
  const pendingTextures = useTexture(pendingUrls)

  useEffect(() => {
    if (pendingUrls.length === 0) {
      return
    }

    const loadedTextures = new Map<string, THREE.Texture>()
    const erroredUrls = new Set<string>()

    for (const [index, texture] of pendingTextures.entries()) {
      const url = pendingUrls[index]
      if (!url) {
        continue
      }

      if (!texture?.image) {
        erroredUrls.add(url)
        continue
      }

      texture.colorSpace = THREE.SRGBColorSpace
      texture.needsUpdate = true
      loadedTextures.set(url, texture)
    }

    if (loadedTextures.size > 0) {
      setTextureCache((prev) => {
        let changed = false
        const next = new Map(prev)
        for (const [url, texture] of loadedTextures.entries()) {
          if (!next.has(url)) {
            next.set(url, texture)
            changed = true
          }
        }
        return changed ? next : prev
      })
    }

    if (erroredUrls.size > 0) {
      setLoadErrors((prev) => {
        let changed = false
        const next = new Set(prev)
        for (const url of erroredUrls) {
          if (!next.has(url)) {
            next.add(url)
            changed = true
          }
        }
        return changed ? next : prev
      })
    }
  }, [pendingTextures, pendingUrls])

  return (
    <>
      {items.map((item, index) => {
        const texture = textureCache.get(item.imageUrl)
        const hasError = loadErrors.has(item.imageUrl)
        const isLoading = !(texture || hasError)

        const visuals = getItemVisuals(item.status)
        const glowColor = visuals.glow
        const stripeColor = visuals.stripeColor
        const [x, y, z] = item.position
        const glowOpacity = isLoading
          ? item.glowOpacity * LOADING.GLOW_OPACITY_SCALE
          : item.glowOpacity
        const emissiveIntensity = isLoading
          ? item.emissiveIntensity * LOADING.EMISSIVE_SCALE
          : item.emissiveIntensity

        return (
          <group key={`image-${index}`} position={[x, y, z + zOffset]}>
            <mesh position={[0, 0, GLOW_Z_OFFSET]}>
              <planeGeometry
                args={[size.w * GLOW_SCALE, size.h * GLOW_SCALE]}
              />
              <meshBasicMaterial
                blending={THREE.AdditiveBlending}
                color={glowColor}
                depthWrite={false}
                opacity={glowOpacity}
                side={THREE.DoubleSide}
                transparent
              />
            </mesh>
            <mesh position={[0, 0, IMAGE_Z_OFFSET]}>
              <planeGeometry
                args={[size.w * IMAGE_SCALE, size.h * IMAGE_SCALE]}
              />
              {texture ? (
                <meshStandardMaterial
                  emissive={glowColor}
                  emissiveIntensity={emissiveIntensity}
                  map={texture}
                  side={THREE.DoubleSide}
                  transparent
                />
              ) : (
                <meshStandardMaterial
                  color={visuals.color}
                  depthWrite={!isLoading}
                  emissive={visuals.glow}
                  emissiveIntensity={emissiveIntensity}
                  opacity={isLoading ? LOADING.IMAGE_OPACITY : 1}
                  side={THREE.DoubleSide}
                  transparent
                />
              )}
            </mesh>
            {stripeColor && stripeTexture && (
              <mesh position={[0, 0, STRIPE_Z_OFFSET]}>
                <planeGeometry
                  args={[size.w * IMAGE_SCALE, size.h * IMAGE_SCALE]}
                />
                <meshStandardMaterial
                  {...STRIPE_MATERIAL_DEFAULTS}
                  alphaMap={stripeTexture}
                  color={stripeColor}
                  emissive={stripeColor}
                  emissiveIntensity={STRIPE_EMISSIVE_INTENSITY}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}
          </group>
        )
      })}
    </>
  )
}

interface ItemsFocusProps {
  rack: Rack3D
  metrics?: RackMetrics
  applyTransform?: boolean
  window?: FocusWindow | null
}

const processRackItems = (
  rows: number,
  cols: number,
  startRow: number,
  startCol: number,
  resolvedMetrics: Pick<RackMetrics, "unitX" | "unitY">,
  windowGridWidth: number,
  windowGridHeight: number,
  items: Rack3D["items"]
) => {
  const withImages: FocusItemImage[] = []
  const solid: Record<ItemStatus, FocusItemSolid[]> = {
    normal: [],
    dangerous: [],
    expired: [],
    "expired-dangerous": [],
  }

  for (let row = 0; row < rows; row++) {
    const globalRow = startRow + row
    const y = (rows - 1 - row) * resolvedMetrics.unitY - windowGridHeight / 2

    for (let col = 0; col < cols; col++) {
      const globalCol = startCol + col
      const x = col * resolvedMetrics.unitX - windowGridWidth / 2
      const index = globalRow * cols + globalCol
      const item = items[index]

      if (!item) {
        continue
      }

      const position: [number, number, number] = [x, y, 0]

      solid[item.status].push({ position, status: item.status })
    }
  }
  return { withImages, solid }
}

export function ItemsFocus({
  rack,
  metrics,
  applyTransform = true,
  window,
}: ItemsFocusProps) {
  const stripeTexture = useStripeTexture()
  const resolvedMetrics = metrics ?? getRackMetrics(rack)
  const imagePlaneSize = {
    w: resolvedMetrics.slotSize.w,
    h: resolvedMetrics.slotSize.h,
  }
  const activeWindow = window?.rackId === rack.id ? window : null

  const { itemsWithImages, solidByStatus } = useMemo(() => {
    const startRow = activeWindow?.startRow ?? 0
    const startCol = activeWindow?.startCol ?? 0
    const rows = activeWindow?.rows ?? rack.grid.rows
    const cols = activeWindow?.cols ?? rack.grid.cols
    const { width: windowGridWidth, height: windowGridHeight } =
      getGridDimensions(
        cols,
        rows,
        resolvedMetrics.unitX,
        resolvedMetrics.unitY
      )

    const { withImages, solid } = processRackItems(
      rows,
      cols,
      startRow,
      startCol,
      {
        unitX: resolvedMetrics.unitX,
        unitY: resolvedMetrics.unitY,
      },
      windowGridWidth,
      windowGridHeight,
      rack.items
    )

    return { itemsWithImages: withImages, solidByStatus: solid }
  }, [
    activeWindow?.cols,
    activeWindow?.rows,
    activeWindow?.startCol,
    activeWindow?.startRow,
    rack.grid.cols,
    rack.grid.rows,
    rack.items,
    resolvedMetrics.unitX,
    resolvedMetrics.unitY,
  ])

  const groupProps = applyTransform
    ? {
        position: rack.transform.position,
        rotation: [0, rack.transform.rotationY, 0] as const,
      }
    : {}
  const imagePlaneZ = resolvedMetrics.depth / 2 - resolvedMetrics.frameThickness

  return (
    <group {...groupProps}>
      {itemsWithImages.length > 0 && (
        <ItemsWithImages
          items={itemsWithImages}
          size={imagePlaneSize}
          stripeTexture={stripeTexture}
          zOffset={imagePlaneZ}
        />
      )}
      {ITEM_STATUS_ORDER.map((status) => {
        const solidItems = solidByStatus[status]
        if (!solidItems || solidItems.length === 0) {
          return null
        }
        const visuals = getItemVisuals(status)
        const stripeColor = visuals.stripeColor

        return (
          <group key={`solid-${status}`}>
            <Instances frustumCulled={false} limit={solidItems.length}>
              <boxGeometry
                args={[
                  resolvedMetrics.slotSize.w,
                  resolvedMetrics.slotSize.h,
                  resolvedMetrics.slotSize.d,
                ]}
              />
              <meshStandardMaterial
                color={visuals.color}
                emissive={visuals.glow}
                emissiveIntensity={visuals.emissiveIntensity}
                metalness={0.08}
                roughness={0.72}
              />
              {solidItems.map(({ position }, index) => (
                <Instance
                  key={`solid-${status}-${index}`}
                  position={position}
                />
              ))}
            </Instances>
            {stripeColor && stripeTexture && (
              <Instances
                frustumCulled={false}
                limit={solidItems.length}
                renderOrder={1}
              >
                <boxGeometry
                  args={[
                    resolvedMetrics.slotSize.w,
                    resolvedMetrics.slotSize.h,
                    resolvedMetrics.slotSize.d,
                  ]}
                />
                <meshStandardMaterial
                  {...STRIPE_MATERIAL_DEFAULTS}
                  alphaMap={stripeTexture}
                  color={stripeColor}
                  emissive={stripeColor}
                  emissiveIntensity={STRIPE_EMISSIVE_INTENSITY}
                />
                {solidItems.map(({ position }, index) => (
                  <Instance
                    key={`solid-${status}-stripe-${index}`}
                    position={position}
                  />
                ))}
              </Instances>
            )}
          </group>
        )
      })}
    </group>
  )
}
