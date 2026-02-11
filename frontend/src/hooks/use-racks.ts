import {
  type UseQueryResult,
  useInfiniteQuery,
  useQueries,
} from "@tanstack/react-query"

import { useMemo } from "react"
import { useAppTranslations } from "@/i18n/use-translations"
import {
  apiFetch,
  type FetchError,
  type InferApiInput,
  type InferApiOutput,
} from "@/lib/fetcher"
import {
  DeleteRackSchema,
  RackDetailsSchema,
  RackImportSchema,
  RackLookupSchema,
  RacksSchema,
} from "@/lib/schemas"
import type { SafeInfiniteQueryOptions, SafeQueryOptions } from "./helper"
import { useApiMutation } from "./use-api-mutation"
import { useApiQuery } from "./use-api-query"

const Racks_QUERY_KEY = ["Racks"] as const
const RACK_DETAILS_QUERY_KEY = [...Racks_QUERY_KEY, "details"] as const
const RACK_DETAILS_STALE_TIME_MS = 5 * 60 * 1000
const INFINITE_RACKS_DEFAULT_PAGE_SIZE = 50
const CSV_IMPORT_TIMEOUT_MS = 60_000

export type RacksList = InferApiOutput<typeof RacksSchema, "GET">
export type RackDetails = InferApiOutput<typeof RackDetailsSchema, "GET">
export type RackLookupDetails = InferApiOutput<typeof RackLookupSchema, "GET">

type RacksListParams = InferApiInput<typeof RacksSchema, "GET">

interface RacksDetailsParams {
  rackId: number
}

interface RacksByWarehouseParams extends RacksListParams {
  warehouseId: number
}

interface MultipleRacksParams {
  rackIds: readonly number[]
  staleTime?: number
}

type RackParams = RacksListParams | RacksDetailsParams | RacksByWarehouseParams

type RackResult<TParams extends RackParams | undefined> =
  TParams extends RacksDetailsParams ? RackDetails : RacksList

export function useMultipleRacks({
  rackIds,
  staleTime = RACK_DETAILS_STALE_TIME_MS,
}: MultipleRacksParams): UseQueryResult<RackLookupDetails, FetchError>[] {
  const uniqueRackIds = useMemo(
    () => [...new Set(rackIds.filter((rackId) => rackId >= 0))],
    [rackIds]
  )

  return useQueries({
    queries: uniqueRackIds.map((rackId) => ({
      queryKey: [...RACK_DETAILS_QUERY_KEY, rackId],
      queryFn: async () =>
        await apiFetch(`/api/racks/${rackId}`, RackLookupSchema),
      staleTime,
    })),
  })
}

export default function useRacks<TParams extends RackParams | undefined>(
  params?: TParams,
  options?: SafeQueryOptions<RackResult<TParams>>
): UseQueryResult<RackResult<TParams>, FetchError> {
  const query = useApiQuery({
    queryKey: [...Racks_QUERY_KEY, params],
    queryFn: async (): Promise<RackResult<TParams>> => {
      if (params && "rackId" in params) {
        return (await apiFetch(
          `/api/racks/${params.rackId}`,
          RackDetailsSchema
        )) as RackResult<TParams>
      }

      if (params && "warehouseId" in params) {
        const { warehouseId, ...queryParams } = params
        return (await apiFetch(
          `/api/warehouses/${warehouseId}/racks`,
          RacksSchema,
          {
            queryParams,
          }
        )) as RackResult<TParams>
      }

      return (await apiFetch("/api/racks", RacksSchema, {
        queryParams: params,
      })) as RackResult<TParams>
    },
    ...(options as SafeQueryOptions<RackResult<TParams>> | undefined),
  })

  return query as UseQueryResult<RackResult<TParams>, FetchError>
}

export function useCreateRack() {
  return useApiMutation({
    mutationFn: (data: InferApiInput<typeof RackDetailsSchema, "POST">) =>
      apiFetch("/api/racks", RackDetailsSchema, {
        method: "POST",
        body: data,
      }),
    onSuccess: (_, __, ___, context) => {
      // Invalidate racks list queries to refetch updated data after creating a rack
      context.client.invalidateQueries({ queryKey: Racks_QUERY_KEY })
    },
  })
}

export function useDeleteRack() {
  return useApiMutation({
    mutationFn: (rackId: number) =>
      apiFetch(`/api/racks/${rackId}`, DeleteRackSchema, {
        method: "DELETE",
      }),
    onSuccess: (_, __, ___, context) => {
      // Invalidate racks list queries to refetch updated data after deleting a rack
      context.client.invalidateQueries({ queryKey: Racks_QUERY_KEY })
    },
  })
}

export function useUpdateRack() {
  return useApiMutation({
    mutationFn: ({
      rackId,
      data,
    }: {
      rackId: number
      data: InferApiInput<typeof RackDetailsSchema, "PUT">
    }) =>
      apiFetch(`/api/racks/${rackId}`, RackDetailsSchema, {
        method: "PUT",
        body: data,
      }),
    onSuccess: (_, __, ___, context) => {
      // Invalidate racks list queries to refetch updated data after updating a rack
      context.client.invalidateQueries({ queryKey: Racks_QUERY_KEY })
    },
  })
}

export function useImportRacks() {
  return useApiMutation({
    mutationFn: async ({
      file,
      warehouseId,
    }: {
      file: File
      warehouseId: number
    }) => {
      return await apiFetch(
        `/api/racks/import?warehouseId=${warehouseId}`,
        RackImportSchema,
        {
          method: "POST",
          timeoutMs: CSV_IMPORT_TIMEOUT_MS,
          body: { file },
          formData: (formData, data) => {
            formData.append("file", data.file)
          },
        }
      )
    },
    onSuccess: (_, __, ___, context) => {
      context.client.invalidateQueries({ queryKey: Racks_QUERY_KEY })
    },
  })
}

interface InfiniteRacksParams {
  warehouseId: number | null
  pageSize?: number
  staleTime?: number
}

export function useInfiniteRacks(
  {
    warehouseId,
    pageSize = INFINITE_RACKS_DEFAULT_PAGE_SIZE,
    staleTime = 60_000,
  }: InfiniteRacksParams,
  options?: SafeInfiniteQueryOptions<RacksList, number>
) {
  const t = useAppTranslations()

  const infiniteQuery = useInfiniteQuery({
    queryKey: ["infinite-racks", warehouseId, pageSize],
    enabled: warehouseId !== null,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      if (warehouseId === null) {
        throw new Error(t("generated.hooks.activeStorage"))
      }

      return await apiFetch(
        `/api/warehouses/${warehouseId}/racks`,
        RacksSchema,
        {
          queryParams: {
            page: pageParam,
            size: pageSize,
          },
        }
      )
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.last) {
        return undefined
      }

      return lastPage.page + 1
    },
    staleTime,
    ...options,
  })

  const rackOptions = useMemo(() => {
    if (!infiniteQuery.data) {
      return []
    }

    return infiniteQuery.data.pages.flatMap((page) =>
      page.content.map((rack) => ({
        id: rack.id,
        name: rack.marker,
        sizeX: rack.sizeX,
        sizeY: rack.sizeY,
      }))
    )
  }, [infiniteQuery.data])

  return {
    ...infiniteQuery,
    rackOptions,
  }
}
