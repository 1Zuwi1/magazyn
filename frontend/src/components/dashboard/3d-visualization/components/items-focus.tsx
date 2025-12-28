import { Instance, Instances, useTexture } from "@react-three/drei"
import { useEffect, useMemo } from "react"
import * as THREE from "three"
import type { Item3D, Rack3D } from "../types"
import { getItemColor } from "../types"
import { getRackMetrics, type RackMetrics } from "./rack-structure"

const IMAGE_SCALE = 0.9
const GLOW_SCALE = 1.12
const GLOW_OPACITY = 0.35
const IMAGE_Z_OFFSET = 0.01
const GLOW_Z_OFFSET = 0.008

interface FocusItemImage {
  position: [number, number, number]
  status: Item3D["status"]
  imageUrl: string
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

        const glowColor = getItemColor(item.status)
        const [x, y, z] = item.position

        return (
          <group key={`image-${index}`} position={[x, y, z + zOffset]}>
            <mesh position={[0, 0, GLOW_Z_OFFSET]}>
              <planeGeometry args={[size.w * GLOW_SCALE, size.h * GLOW_SCALE]} />
              <meshBasicMaterial
                blending={THREE.AdditiveBlending}
                color={glowColor}
                depthWrite={false}
                opacity={GLOW_OPACITY}
                side={THREE.DoubleSide}
                transparent
              />
            </mesh>
            <mesh position={[0, 0, IMAGE_Z_OFFSET]}>
              <planeGeometry args={[size.w * IMAGE_SCALE, size.h * IMAGE_SCALE]} />
              <meshStandardMaterial
                emissive={glowColor}
                emissiveIntensity={0.35}
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
}

export function ItemsFocus({
  rack,
  metrics,
  applyTransform = true,
}: ItemsFocusProps) {
  const resolvedMetrics = metrics ?? getRackMetrics(rack)
  const imagePlaneSize = {
    w: resolvedMetrics.slotSize.w,
    h: resolvedMetrics.slotSize.h,
  }

  const { itemsWithImages, itemsSolid } = useMemo(() => {
    const withImages: FocusItemImage[] = []
    const solid: FocusItemSolid[] = []

    for (let row = 0; row < rack.grid.rows; row++) {
      const y =
        (rack.grid.rows - 1 - row) * resolvedMetrics.unitY -
        resolvedMetrics.gridHeight / 2

      for (let col = 0; col < rack.grid.cols; col++) {
        const x = col * resolvedMetrics.unitX - resolvedMetrics.gridWidth / 2
        const index = row * rack.grid.cols + col
        const item = rack.items[index]

        if (!item) {
          continue
        }

        const position: [number, number, number] = [x, y, 0]
        const imageUrl = getItemImageUrl(item)

        if (imageUrl) {
          withImages.push({ position, status: item.status, imageUrl })
        } else {
          solid.push({ position, status: item.status })
        }
      }
    }

    return { itemsWithImages: withImages, itemsSolid: solid }
  }, [
    rack.grid.cols,
    rack.grid.rows,
    rack.items,
    resolvedMetrics.gridHeight,
    resolvedMetrics.gridWidth,
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
      {itemsSolid.length > 0 && (
        <Instances limit={itemsSolid.length}>
          <boxGeometry
            args={[
              resolvedMetrics.slotSize.w,
              resolvedMetrics.slotSize.h,
              resolvedMetrics.slotSize.d,
            ]}
          />
          <meshStandardMaterial metalness={0.15} roughness={0.6} />
          {itemsSolid.map(({ position, status }, index) => (
            <Instance
              color={getItemColor(status)}
              key={`solid-${index}`}
              position={position}
            />
          ))}
        </Instances>
      )}
    </group>
  )
}
