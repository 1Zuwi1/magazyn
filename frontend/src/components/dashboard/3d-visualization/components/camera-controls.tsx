import { CameraControls } from "@react-three/drei"
import { useEffect, useRef } from "react"
import * as THREE from "three"
import {
  CAMERA_KEYBOARD_STEP,
  FOCUS_CAMERA_DISTANCE,
  FOCUS_CAMERA_HEIGHT,
  OVERVIEW_CAMERA_DISTANCE,
  OVERVIEW_CAMERA_HEIGHT,
} from "../constants"
import { useWarehouseStore } from "../store"
import type { ViewMode } from "../types"

interface CameraControllerProps {
  mode: ViewMode
  warehouseCenter: { x: number; y: number; z: number }
}

const handleControl = (controls: CameraControls, key: string) => {
  switch (key) {
    case "arrowup":
    case "w":
      controls.forward(CAMERA_KEYBOARD_STEP, false)
      break
    case "arrowdown":
    case "s":
      controls.forward(-CAMERA_KEYBOARD_STEP, false)
      break
    case "arrowleft":
    case "a":
      controls.truck(-CAMERA_KEYBOARD_STEP, 0, false)
      break
    case "arrowright":
    case "d":
      controls.truck(CAMERA_KEYBOARD_STEP, 0, false)
      break
    default:
      return false
  }
  return true
}

const isValidTarget = (target: EventTarget | null): boolean => {
  if (target instanceof HTMLElement) {
    const tagName = target.tagName.toLowerCase()
    const isEditable =
      target.isContentEditable ||
      tagName === "input" ||
      tagName === "textarea" ||
      tagName === "select"
    if (isEditable) {
      return false
    }
  }
  return true
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
      const distance = OVERVIEW_CAMERA_DISTANCE
      const height = OVERVIEW_CAMERA_HEIGHT
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
      controlsRef.current.setLookAt(
        0,
        FOCUS_CAMERA_HEIGHT,
        FOCUS_CAMERA_DISTANCE,
        0,
        0,
        0,
        true
      )
    }
  }, [selectedRackId, mode])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      ) {
        return
      }

      if (!isValidTarget(event.target)) {
        return
      }

      const controls = controlsRef.current
      if (!controls) {
        return
      }

      const key = event.key.toLowerCase()

      const handled = handleControl(controls, key)

      if (handled) {
        event.preventDefault()
      }
    }

    const abortController = new AbortController()
    window.addEventListener("keydown", handleKeyDown, {
      passive: false,
      signal: abortController.signal,
    })
    return () => {
      abortController.abort()
    }
  }, [])

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
