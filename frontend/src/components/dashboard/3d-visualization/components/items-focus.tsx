import { Instance, Instances, useTexture } from "@react-three/drei"
import { useEffect, useMemo, useState } from "react"
import * as THREE from "three"
import { GLOW_SETTINGS, VISUALIZATION_CONSTANTS } from "../constants"
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
  SCALES: { image: IMAGE_SCALE, glow: GLOW_SCALE },
  OFFSETS: {
    imageZ: IMAGE_Z_OFFSET,
    glowZ: GLOW_Z_OFFSET,
    stripeZ: STRIPE_Z_OFFSET,
  },
} = VISUALIZATION_CONSTANTS

const areSetsEqual = (left: Set<string>, right: Set<string>): boolean => {
  if (left.size !== right.size) {
    return false
  }

  for (const value of left) {
    if (!right.has(value)) {
      return false
    }
  }

  return true
}

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
  const uniqueUrls = useMemo(
    () => Array.from(new Set(items.map((item) => item.imageUrl))),
    [items]
  )
  const textures: THREE.Texture[] = useTexture(uniqueUrls)
  const [texturesReady, setTexturesReady] = useState(false)
  const [loadErrors, setLoadErrors] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (uniqueUrls.length === 0) {
      setTexturesReady(true)
      setLoadErrors(new Set())
      return
    }

    if (textures.length !== uniqueUrls.length) {
      setTexturesReady(false)
      return
    }

    const nextErrors = new Set<string>()
    for (const [index, texture] of textures.entries()) {
      const url = uniqueUrls[index]
      if (!texture?.image) {
        if (url) {
          nextErrors.add(url)
        }
        continue
      }
      texture.colorSpace = THREE.SRGBColorSpace
      texture.needsUpdate = true
    }

    setTexturesReady(true)
    setLoadErrors((prev) =>
      areSetsEqual(prev, nextErrors) ? prev : nextErrors
    )
  }, [textures, uniqueUrls])

  const textureMap = useMemo(() => {
    if (!texturesReady) {
      return new Map<string, THREE.Texture>()
    }

    const map = new Map<string, THREE.Texture>()
    for (const [index, url] of uniqueUrls.entries()) {
      const texture = textures[index]
      if (texture?.image) {
        map.set(url, texture)
      }
    }
    return map
  }, [textures, texturesReady, uniqueUrls])

  if (!texturesReady || (textureMap.size === 0 && loadErrors.size === 0)) {
    return null
  }

  return (
    <>
      {items.map((item, index) => {
        const texture = textureMap.get(item.imageUrl)
        const hasError = loadErrors.has(item.imageUrl)
        if (!(texture || hasError)) {
          return null
        }

        const visuals = getItemVisuals(item.status)
        const glowColor = visuals.glow
        const stripeColor = visuals.stripeColor
        const [x, y, z] = item.position

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
                opacity={item.glowOpacity}
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
                  emissiveIntensity={item.emissiveIntensity}
                  map={texture}
                  side={THREE.DoubleSide}
                  transparent
                />
              ) : (
                <meshStandardMaterial
                  color={visuals.color}
                  emissive={visuals.glow}
                  emissiveIntensity={item.emissiveIntensity}
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

function getItemImageUrl(item: Item3D): string | null {
  if (item.imageUrl && item.imageUrl.trim() !== "") {
    return item.imageUrl
  }

  const metaUrl = item.meta?.imageUrl
  if (typeof metaUrl === "string" && metaUrl.trim() !== "") {
    return metaUrl
  }

  return null
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
  rack: Rack3D
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
      const index = globalRow * rack.grid.cols + globalCol
      const item = rack.items[index]

      if (!item) {
        continue
      }

      const position: [number, number, number] = [x, y, 0]
      const imageUrl = getItemImageUrl(item)
      const glowSettings = GLOW_SETTINGS[item.status] ?? GLOW_SETTINGS.normal

      if (imageUrl) {
        withImages.push({
          position,
          status: item.status,
          imageUrl,
          glowOpacity: glowSettings.glowOpacity,
          emissiveIntensity: glowSettings.emissiveIntensity,
        })
      } else {
        solid[item.status].push({ position, status: item.status })
      }
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
      rack
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
    rack,
    resolvedMetrics.unitX,
    resolvedMetrics.unitY,
  ])

  const groupProps = applyTransform
    ? {
        position: rack.transform.position,
        rotation: [0, rack.transform.rotationY, 0] as [number, number, number],
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
