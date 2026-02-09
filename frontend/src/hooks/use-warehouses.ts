import type { UseQueryOptions, UseQueryResult } from "@tanstack/react-query"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import {
  apiFetch,
  type FetchError,
  type InferApiInput,
  type InferApiOutput,
} from "@/lib/fetcher"
import {
  CreateWarehouseSchema,
  DeleteWarehouseSchema,
  UpdateWarehouseSchema,
  WarehouseDetailsSchema,
  WarehouseImportSchema,
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

type WarehousesListParams = InferApiInput<typeof WarehousesSchema, "GET">

interface WarehouseDetailsParams {
  warehouseId: number
}

export default function useWarehouses(
  params?: WarehousesListParams
): UseQueryResult<WarehousesList, FetchError>

export default function useWarehouses(
  params: WarehouseDetailsParams
): UseQueryResult<WarehouseDetails, FetchError>

export default function useWarehouses(
  params?: WarehousesListParams | WarehouseDetailsParams,
  options?: UseQueryOptions
) {
  return useApiQuery({
    queryKey: [...WAREHOUSES_QUERY_KEY, params],
    queryFn: async () => {
      if (params && "warehouseId" in params) {
        return await apiFetch(
          `/api/warehouses/${params.warehouseId}`,
          WarehouseDetailsSchema
        )
      }
      return await apiFetch("/api/warehouses", WarehousesSchema, {
        queryParams: params,
      })
    },
    ...options,
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

export function useImportWarehouses() {
  return useApiMutation({
    mutationFn: async (file: File) => {
      return await apiFetch("/api/warehouses/import", WarehouseImportSchema, {
        method: "POST",
        body: { file },
        formData: (formData, data) => {
          formData.append("file", data.file)
        },
      })
    },
    onSuccess: (_, __, ___, context) => {
      context.client.invalidateQueries({
        queryKey: WAREHOUSES_QUERY_KEY,
      })
    },
  })
}

const INFINITE_WAREHOUSES_DEFAULT_PAGE_SIZE = 20

interface UseInfiniteWarehousesParams {
  nameFilter?: string
  pageSize?: number
}

export function useInfiniteWarehouses({
  nameFilter,
  pageSize = INFINITE_WAREHOUSES_DEFAULT_PAGE_SIZE,
}: UseInfiniteWarehousesParams = {}) {
  const query = useInfiniteQuery({
    queryKey: [...WAREHOUSES_QUERY_KEY, "infinite", nameFilter, pageSize],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      return await apiFetch("/api/warehouses", WarehousesSchema, {
        queryParams: {
          page: pageParam,
          size: pageSize,
          nameFilter: nameFilter?.trim() || undefined,
        },
      })
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.last) {
        return undefined
      }
      return lastPage.page + 1
    },
    staleTime: 60_000,
  })

  const warehouses = useMemo(
    () => query.data?.pages.flatMap((page) => page.content) ?? [],
    [query.data]
  )

  return {
    ...query,
    warehouses,
  }
}
