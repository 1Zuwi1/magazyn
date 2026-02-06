import type { UseQueryResult } from "@tanstack/react-query"
import { apiFetch, type FetchError, type InferApiOutput } from "@/lib/fetcher"
import { RackDetailsSchema, RacksSchema } from "@/lib/schemas"
import { useApiQuery } from "./use-api-query"

const Racks_QUERY_KEY = ["Racks"] as const

export type RacksList = InferApiOutput<typeof RacksSchema, "GET">
export type RackDetails = InferApiOutput<typeof RackDetailsSchema, "GET">

interface RacksListParams {
  page?: number
  size?: number
}

type RacksDetailsParams = RacksListParams & {
  rackId: number
}

type RacksByWarehouseParams = RacksListParams & {
  warehouseId?: number
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
        return await apiFetch(
          `/api/racks/warehouse/${warehouseId}`,
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
