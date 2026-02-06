import type { UseQueryResult } from "@tanstack/react-query"
import { apiFetch, type FetchError, type InferApiOutput } from "@/lib/fetcher"
import {
  CreateWarehouseSchema,
  DeleteWarehouseSchema,
  UpdateWarehouseSchema,
  WarehouseDetailsSchema,
  WarehousesSchema,
} from "@/lib/schemas"
import { useApiMutation } from "./use-api-mutation"
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
        if (warehouseId === -1) {
          // This is a workaround to prevent the query from running when warehouseId is not yet available.
          return undefined
        }
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

export function useCreateWarehouse() {
  return useApiMutation({
    mutationFn: async (name: string) => {
      return await apiFetch("/api/warehouses", CreateWarehouseSchema, {
        method: "POST",
        body: { name },
      })
    },
    onSuccess: (_, __, ___, context) => {
      // Invalidate warehouses list query to refetch updated data
      context.client.invalidateQueries({
        queryKey: WAREHOUSES_QUERY_KEY,
      })
    },
  })
}

export function useDeleteWarehouse() {
  return useApiMutation({
    mutationFn: async (warehouseId: number) => {
      return await apiFetch(
        `/api/warehouses/${warehouseId}`,
        DeleteWarehouseSchema,
        {
          method: "DELETE",
        }
      )
    },
    onSuccess: (_, __, ___, context) => {
      // Invalidate warehouses list query to refetch updated data
      context.client.invalidateQueries({
        queryKey: WAREHOUSES_QUERY_KEY,
      })
    },
  })
}

export function useUpdateWarehouse() {
  return useApiMutation({
    mutationFn: async ({
      warehouseId,
      name,
    }: {
      warehouseId: number
      name: string
    }) => {
      return await apiFetch(
        `/api/warehouses/${warehouseId}`,
        UpdateWarehouseSchema,
        {
          method: "PUT",
          body: { name },
        }
      )
    },
    onSuccess: (_, __, ___, context) => {
      // Invalidate warehouses list query to refetch updated data
      context.client.invalidateQueries({
        queryKey: WAREHOUSES_QUERY_KEY,
      })
    },
  })
}
