import { CameraControls } from "@react-three/drei"
import { useEffect, useRef } from "react"
import * as THREE from "three"
import { useWarehouseStore } from "../store"
import type { ViewMode } from "../types"

interface CameraControllerProps {
  mode: ViewMode
  warehouseCenter: { x: number; y: number; z: number }
}

export function CameraController({
  mode,
  warehouseCenter,
}: CameraControllerProps) {
  const controlsRef = useRef<CameraControls>(null)
  const targetRef = useRef(new THREE.Vector3())
  const { selectedRackId } = useWarehouseStore()

  useEffect(() => {
    if (controlsRef.current && mode === "overview") {
      const distance = 15
      const height = 4
      controlsRef.current.setLookAt(
        warehouseCenter.x,
        warehouseCenter.y + height,
        warehouseCenter.z + distance,
        warehouseCenter.x,
        warehouseCenter.y,
        warehouseCenter.z,
        true
      )
    }
  }, [mode, warehouseCenter])

  useEffect(() => {
    if (mode === "focus" && selectedRackId && controlsRef.current) {
      targetRef.current.set(0, 0, 0)
      controlsRef.current.setLookAt(0, 3, 6, 0, 0, 0, true)
    }
  }, [selectedRackId, mode])

  return (
    <CameraControls
      azimuthRotateSpeed={0.5}
      dollySpeed={0.5}
      makeDefault
      maxPolarAngle={Math.PI / 2}
      maxZoom={20}
      minPolarAngle={0}
      minZoom={1}
      polarRotateSpeed={0.5}
      ref={controlsRef}
    />
  )
}
