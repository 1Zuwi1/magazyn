import {
  type UseQueryResult,
  useInfiniteQuery,
  useQueries,
} from "@tanstack/react-query"
import { useMemo } from "react"
import z from "zod"
import { createApiSchema } from "@/lib/create-api-schema"
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
  RacksSchema,
} from "@/lib/schemas"
import { useApiMutation } from "./use-api-mutation"
import { useApiQuery } from "./use-api-query"

const Racks_QUERY_KEY = ["Racks"] as const
const RACK_DETAILS_QUERY_KEY = [...Racks_QUERY_KEY, "details"] as const
const RACK_DETAILS_STALE_TIME_MS = 5 * 60 * 1000
const INFINITE_RACKS_DEFAULT_PAGE_SIZE = 50

const RackLookupSchema = createApiSchema({
  GET: {
    output: z.object({
      id: z.number().int().nonnegative(),
      name: z.string().nullish(),
      marker: z.string(),
    }),
  },
})

export type RacksList = InferApiOutput<typeof RacksSchema, "GET">
export type RackDetails = InferApiOutput<typeof RackDetailsSchema, "GET">
export type RackLookupDetails = InferApiOutput<typeof RackLookupSchema, "GET">

interface RacksListParams {
  page?: number
  size?: number
}

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

export default function useRacks(
  params?: RacksListParams
): UseQueryResult<RacksList, FetchError>

export default function useRacks(
  params: RacksDetailsParams
): UseQueryResult<RackDetails, FetchError>

export default function useRacks(
  params: RacksByWarehouseParams
): UseQueryResult<RacksList, FetchError>

export default function useRacks(
  {
    page,
    size,
    rackId,
    warehouseId,
  }: {
    page?: number
    size?: number
    rackId?: number
    warehouseId?: number
  } = {
    page: 0,
    size: 20,
  }
) {
  return useApiQuery({
    queryKey: [...Racks_QUERY_KEY, { page, size, rackId, warehouseId }],
    queryFn: async () => {
      if (warehouseId !== undefined) {
        if (warehouseId === -1) {
          // placeholder when useWarehouses is in pending state and warehouseId is not yet available
          return null
        }
        return await apiFetch(
          `/api/warehouses/${warehouseId}/racks`,
          RacksSchema,
          {
            queryParams: {
              page,
              size,
            },
          }
        )
      }
      if (rackId !== undefined) {
        return await apiFetch(`/api/racks/${rackId}`, RackDetailsSchema)
      }
      return await apiFetch("/api/racks", RacksSchema, {
        queryParams: {
          page,
          size,
        },
      })
    },
  })
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
    mutationFn: async (file: File) => {
      return await apiFetch("/api/racks/import", RackImportSchema, {
        method: "POST",
        body: { file },
        formData: (formData, data) => {
          formData.append("file", data.file)
        },
      })
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

export function useInfiniteRacks({
  warehouseId,
  pageSize = INFINITE_RACKS_DEFAULT_PAGE_SIZE,
  staleTime = 60_000,
}: InfiniteRacksParams) {
  const infiniteQuery = useInfiniteQuery({
    queryKey: ["infinite-racks", warehouseId, pageSize],
    enabled: warehouseId !== null,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      if (warehouseId === null) {
        throw new Error("Brak aktywnego magazynu.")
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
