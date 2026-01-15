import { DEFAULT_RACK_TONE } from "./rack-tone"

interface ShelfGridConfig {
  rows: number
  unitY: number
  gridHeight: number
  cellHeight: number
  shelfThickness: number
}

export function getShelfPositionsForGrid({
  rows,
  unitY,
  gridHeight,
  cellHeight,
  shelfThickness,
}: ShelfGridConfig): number[] {
  const positions: number[] = []

  for (let row = 0; row < rows; row++) {
    const y = (rows - 1 - row) * unitY - gridHeight / 2
    const shelfY = y - cellHeight / 2 + shelfThickness / 2
    positions.push(shelfY)
  }

  return positions
}

interface RackShelvesProps {
  shelfPositions: number[]
  width: number
  depth: number
  thickness: number
  color?: string
}

export function RackShelves({
  shelfPositions,
  width,
  depth,
  thickness,
  color = DEFAULT_RACK_TONE.shelf,
}: RackShelvesProps) {
  if (shelfPositions.length === 0) {
    return null
  }

  return (
    <group>
      {shelfPositions.map((y, index) => (
        <mesh key={`shelf-${index}`} position={[0, y, 0]} raycast={() => null}>
          <boxGeometry args={[width, thickness, depth]} />
          <meshStandardMaterial
            color={color}
            metalness={0.05}
            roughness={0.85}
          />
        </mesh>
      ))}
    </group>
  )
}
