"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo } from "react"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

const MISSING_WAREHOUSE_ID = -1

interface WarehouseIdStore {
  warehouseId: number | null
  isHydrated: boolean
  setWarehouseId: (warehouseId: number | null) => void
  setIsHydrated: (isHydrated: boolean) => void
}

const parseWarehouseId = (warehouseId: string | null): number | null => {
  if (!warehouseId) {
    return null
  }

  const parsedWarehouseId = Number.parseInt(warehouseId, 10)

  if (!Number.isInteger(parsedWarehouseId) || parsedWarehouseId < 0) {
    return null
  }

  return parsedWarehouseId
}

const useWarehouseIdStore = create<WarehouseIdStore>()(
  persist(
    (set) => ({
      warehouseId: null,
      isHydrated: false,
      setWarehouseId: (warehouseId) => set({ warehouseId }),
      setIsHydrated: (isHydrated) => set({ isHydrated }),
    }),
    {
      name: "warehouse-id-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ warehouseId: state.warehouseId }),
      onRehydrateStorage: () => (state) => {
        state?.setIsHydrated(true)
      },
    }
  )
)

export interface CurrentWarehouseId {
  warehouseId: number | null
  warehouseIdForQuery: number
  isHydrated: boolean
  isMissingWarehouseId: boolean
}

interface UseCurrentWarehouseIdOptions {
  redirectIfMissingTo?: string
}

export const useCurrentWarehouseId = (
  options?: UseCurrentWarehouseIdOptions
): CurrentWarehouseId => {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const warehouseIdFromStore = useWarehouseIdStore((state) => state.warehouseId)
  const isHydrated = useWarehouseIdStore((state) => state.isHydrated)
  const setWarehouseId = useWarehouseIdStore((state) => state.setWarehouseId)
  const hasWarehouseIdParam = searchParams.has("warehouseId")

  const warehouseIdFromSearchParams = useMemo(
    () => parseWarehouseId(searchParams.get("warehouseId")),
    [searchParams]
  )

  useEffect(() => {
    if (warehouseIdFromSearchParams === null) {
      return
    }

    if (warehouseIdFromSearchParams === warehouseIdFromStore) {
      return
    }

    setWarehouseId(warehouseIdFromSearchParams)
  }, [warehouseIdFromSearchParams, warehouseIdFromStore, setWarehouseId])

  useEffect(() => {
    if (!hasWarehouseIdParam || warehouseIdFromSearchParams === null) {
      return
    }

    const nextSearchParams = new URLSearchParams(searchParams.toString())
    nextSearchParams.delete("warehouseId")

    const nextQuery = nextSearchParams.toString()
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname

    router.replace(nextUrl, { scroll: false })
  }, [
    hasWarehouseIdParam,
    pathname,
    router,
    searchParams,
    warehouseIdFromSearchParams,
  ])

  const warehouseId = warehouseIdFromSearchParams ?? warehouseIdFromStore
  const isMissingWarehouseId = isHydrated && warehouseId === null

  useEffect(() => {
    if (!(options?.redirectIfMissingTo && isMissingWarehouseId)) {
      return
    }

    router.replace(options.redirectIfMissingTo)
  }, [isMissingWarehouseId, options?.redirectIfMissingTo, router])

  return {
    warehouseId,
    warehouseIdForQuery: warehouseId ?? MISSING_WAREHOUSE_ID,
    isHydrated,
    isMissingWarehouseId,
  }
}
