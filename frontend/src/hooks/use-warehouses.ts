import type { UseQueryResult } from "@tanstack/react-query"
import { apiFetch, type FetchError, type InferApiOutput } from "@/lib/fetcher"
import { WarehouseDetailsSchema, WarehousesSchema } from "@/lib/schemas"
import { useApiQuery } from "./use-api-query"

const WAREHOUSES_QUERY_KEY = ["warehouses"] as const

export type WarehousesList = InferApiOutput<typeof WarehousesSchema, "GET">
export type WarehouseDetails = InferApiOutput<
  typeof WarehouseDetailsSchema,
  "GET"
>

interface WarehousesListParams {
  page?: number
  size?: number
}

type WarehousesDetailsParams = WarehousesListParams & {
  warehouseId: number
}

export default function useWarehouses(
  params?: WarehousesListParams
): UseQueryResult<WarehousesList, FetchError>

export default function useWarehouses(
  params: WarehousesDetailsParams
): UseQueryResult<WarehouseDetails, FetchError>

export default function useWarehouses(
  {
    page,
    size,
    warehouseId,
  }: {
    page?: number
    size?: number
    warehouseId?: number
  } = {
    page: 0,
    size: 20,
  }
) {
  return useApiQuery({
    queryKey: [...WAREHOUSES_QUERY_KEY, { page, size, warehouseId }],
    queryFn: async () => {
      if (warehouseId !== undefined) {
        return await apiFetch(
          `/api/warehouses/${warehouseId}`,
          WarehouseDetailsSchema
        )
      }
      return await apiFetch("/api/warehouses", WarehousesSchema, {
        queryParams: {
          page,
          size,
        },
      })
    },
  })
}
