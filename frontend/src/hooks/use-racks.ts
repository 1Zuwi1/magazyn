import type { UseQueryResult } from "@tanstack/react-query"
import {
  apiFetch,
  type FetchError,
  type InferApiInput,
  type InferApiOutput,
} from "@/lib/fetcher"
import { DeleteRackSchema, RackDetailsSchema, RacksSchema } from "@/lib/schemas"
import { useApiMutation } from "./use-api-mutation"
import { useApiQuery } from "./use-api-query"

const Racks_QUERY_KEY = ["Racks"] as const

export type RacksList = InferApiOutput<typeof RacksSchema, "GET">
export type RackDetails = InferApiOutput<typeof RackDetailsSchema, "GET">

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
