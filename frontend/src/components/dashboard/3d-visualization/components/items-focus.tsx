import { Instance, Instances, useTexture } from "@react-three/drei"
import { useEffect, useMemo } from "react"
import * as THREE from "three"
import type { FocusWindow, Item3D, ItemStatus, Rack3D } from "../types"
import { getItemGlowColor, getItemVisuals, ITEM_STATUS_ORDER } from "../types"
import { getRackMetrics, type RackMetrics } from "./rack-structure"

const IMAGE_SCALE = 0.9
const GLOW_SCALE = 1.12
const IMAGE_Z_OFFSET = 0.01
const GLOW_Z_OFFSET = 0.008

const GLOW_SETTINGS: Record<
  ItemStatus,
  { glowOpacity: number; emissiveIntensity: number }
> = {
  normal: { glowOpacity: 0.05, emissiveIntensity: 0.12 },
  dangerous: { glowOpacity: 0.22, emissiveIntensity: 0.3 },
  expired: { glowOpacity: 0.14, emissiveIntensity: 0.2 },
  "expired-dangerous": { glowOpacity: 0.3, emissiveIntensity: 0.38 },
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
}

function ItemsWithImages({ items, size, zOffset }: ItemsWithImagesProps) {
  const uniqueUrls = useMemo(
    () => Array.from(new Set(items.map((item) => item.imageUrl))),
    [items]
  )
  const textures = useTexture(uniqueUrls) as THREE.Texture[]

  useEffect(() => {
    for (const texture of textures) {
      texture.colorSpace = THREE.SRGBColorSpace
      texture.needsUpdate = true
    }
  }, [textures])

  const textureMap = useMemo(() => {
    const map = new Map<string, THREE.Texture>()
    for (const [index, url] of uniqueUrls.entries()) {
      const texture = textures[index]
      if (texture) {
        map.set(url, texture)
      }
    }
    return map
  }, [textures, uniqueUrls])

  return (
    <>
      {items.map((item, index) => {
        const texture = textureMap.get(item.imageUrl)
        if (!texture) {
          return null
        }

        const glowColor = getItemGlowColor(item.status)
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
              <meshStandardMaterial
                emissive={glowColor}
                emissiveIntensity={item.emissiveIntensity}
                map={texture}
                side={THREE.DoubleSide}
                transparent
              />
            </mesh>
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

export function ItemsFocus({
  rack,
  metrics,
  applyTransform = true,
  window,
}: ItemsFocusProps) {
  const resolvedMetrics = metrics ?? getRackMetrics(rack)
  const imagePlaneSize = {
    w: resolvedMetrics.slotSize.w,
    h: resolvedMetrics.slotSize.h,
  }
  const activeWindow = window?.rackId === rack.id ? window : null

  const { itemsWithImages, solidByStatus } = useMemo(() => {
    const withImages: FocusItemImage[] = []
    const solid: Record<ItemStatus, FocusItemSolid[]> = {
      normal: [],
      dangerous: [],
      expired: [],
      "expired-dangerous": [],
    }
    const startRow = activeWindow?.startRow ?? 0
    const startCol = activeWindow?.startCol ?? 0
    const rows = activeWindow?.rows ?? rack.grid.rows
    const cols = activeWindow?.cols ?? rack.grid.cols
    const windowGridWidth = cols * resolvedMetrics.unitX
    const windowGridHeight = Math.max(0, rows - 1) * resolvedMetrics.unitY

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
          zOffset={imagePlaneZ}
        />
      )}
      {ITEM_STATUS_ORDER.map((status) => {
        const solidItems = solidByStatus[status]
        if (!solidItems || solidItems.length === 0) {
          return null
        }
        const visuals = getItemVisuals(status)

        return (
          <Instances
            frustumCulled={false}
            key={`solid-${status}`}
            limit={solidItems.length}
          >
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
              <Instance key={`solid-${status}-${index}`} position={position} />
            ))}
          </Instances>
        )
      })}
    </group>
  )
}
