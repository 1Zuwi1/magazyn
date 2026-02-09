import {
  type UseQueryResult,
  useInfiniteQuery,
  useQueries,
} from "@tanstack/react-query"
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
import type { SafeInfiniteQueryOptions, SafeQueryOptions } from "./helper"
import { useApiMutation } from "./use-api-mutation"
import { useApiQuery } from "./use-api-query"

const WAREHOUSES_QUERY_KEY = ["warehouses"] as const
const WAREHOUSE_DETAILS_QUERY_KEY = [
  ...WAREHOUSES_QUERY_KEY,
  "details",
] as const
const WAREHOUSE_DETAILS_STALE_TIME_MS = 5 * 60 * 1000

export type WarehousesList = InferApiOutput<typeof WarehousesSchema, "GET">
export type WarehouseDetails = InferApiOutput<
  typeof WarehouseDetailsSchema,
  "GET"
>

type WarehousesListParams = InferApiInput<typeof WarehousesSchema, "GET">

interface WarehouseDetailsParams {
  warehouseId: number
}

interface MultipleWarehousesParams {
  warehouseIds: readonly number[]
  staleTime?: number
}

type WarehouseParams = WarehousesListParams | WarehouseDetailsParams | undefined

type WarehouseResult<TParams extends WarehouseParams> =
  TParams extends WarehouseDetailsParams ? WarehouseDetails : WarehousesList

export function useMultipleWarehouses({
  warehouseIds,
  staleTime = WAREHOUSE_DETAILS_STALE_TIME_MS,
}: MultipleWarehousesParams): UseQueryResult<WarehouseDetails, FetchError>[] {
  const uniqueWarehouseIds = useMemo(
    () => [...new Set(warehouseIds.filter((warehouseId) => warehouseId >= 0))],
    [warehouseIds]
  )

  return useQueries({
    queries: uniqueWarehouseIds.map((warehouseId) => ({
      queryKey: [...WAREHOUSE_DETAILS_QUERY_KEY, warehouseId],
      queryFn: async () =>
        await apiFetch(
          `/api/warehouses/${warehouseId}`,
          WarehouseDetailsSchema,
          {
            method: "GET",
          }
        ),
      staleTime,
    })),
  })
}

export default function useWarehouses<TParams extends WarehouseParams>(
  params?: TParams,
  options?: SafeQueryOptions<WarehouseResult<TParams>>
): UseQueryResult<WarehouseResult<TParams>, FetchError> {
  return useApiQuery({
    queryKey: [...WAREHOUSES_QUERY_KEY, params],
    queryFn: async (): Promise<WarehouseResult<TParams>> => {
      if (params && "warehouseId" in params) {
        return (await apiFetch(
          `/api/warehouses/${params.warehouseId}`,
          WarehouseDetailsSchema
        )) as WarehouseResult<TParams>
      }
      return (await apiFetch("/api/warehouses", WarehousesSchema, {
        queryParams: params,
      })) as WarehouseResult<TParams>
    },
    ...(options as SafeQueryOptions<WarehouseResult<TParams>> | undefined),
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

export function useInfiniteWarehouses(
  {
    nameFilter,
    pageSize = INFINITE_WAREHOUSES_DEFAULT_PAGE_SIZE,
  }: UseInfiniteWarehousesParams = {},
  options?: SafeInfiniteQueryOptions<WarehousesList, number>
) {
  const query = useInfiniteQuery({
    queryKey: [...WAREHOUSES_QUERY_KEY, "infinite", nameFilter, pageSize],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      apiFetch("/api/warehouses", WarehousesSchema, {
        queryParams: {
          page: pageParam,
          size: pageSize,
          nameFilter: nameFilter?.trim() || undefined,
        },
      }),
    getNextPageParam: (lastPage) => {
      if (lastPage.last) {
        return undefined
      }
      return lastPage.page + 1
    },
    staleTime: 60_000,
    ...options,
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
