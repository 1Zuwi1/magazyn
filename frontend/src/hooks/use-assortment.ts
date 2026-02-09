import type { UseQueryResult } from "@tanstack/react-query"
import {
  apiFetch,
  type FetchError,
  type InferApiInput,
  type InferApiOutput,
} from "@/lib/fetcher"
import {
  AssortmentDetailsSchema,
  AssortmentsSchema,
  RackAssortmentsSchema,
  WarehouseAssortmentsSchema,
} from "@/lib/schemas"
import { useApiQuery } from "./use-api-query"

const ASSORTMENT_QUERY_KEY = ["assortments"] as const

export type AssortmentsList = InferApiOutput<typeof AssortmentsSchema, "GET">
type RackAssortmentsList = InferApiOutput<typeof RackAssortmentsSchema, "GET">
export type AssortmentDetails = InferApiOutput<
  typeof AssortmentDetailsSchema,
  "GET"
>

interface AssortmentsListParams
  extends InferApiInput<typeof AssortmentsSchema, "GET"> {}

interface AssortmentDetailsParams {
  assortmentId: number
}

interface RackAssortmentsParams
  extends InferApiInput<typeof RackAssortmentsSchema, "GET"> {
  rackId: number
}

interface WarehouseAssortmentsParams
  extends InferApiInput<typeof WarehouseAssortmentsSchema, "GET"> {
  warehouseId: number
}

export default function useAssortments(
  params?: AssortmentsListParams
): UseQueryResult<AssortmentsList, FetchError>

export default function useAssortments(
  params: AssortmentDetailsParams
): UseQueryResult<AssortmentDetails, FetchError>
export default function useAssortments(
  params: RackAssortmentsParams | WarehouseAssortmentsParams
): UseQueryResult<RackAssortmentsList, FetchError>

export default function useAssortments(
  params?:
    | AssortmentsListParams
    | AssortmentDetailsParams
    | WarehouseAssortmentsParams
    | RackAssortmentsParams
) {
  return useApiQuery({
    queryKey: [...ASSORTMENT_QUERY_KEY, params],
    queryFn: async () => {
      if (params && "assortmentId" in params) {
        if (params.assortmentId === -1) {
          // This is a workaround to prevent the query from running when assortmentId is not yet available.
          return null
        }
        return await apiFetch(
          `/api/assortments/${params.assortmentId}`,
          AssortmentDetailsSchema,
          {
            method: "GET",
          }
        )
      }

      if (params && "rackId" in params) {
        if (params.rackId === -1) {
          // This is a workaround to prevent the query from running when rackId is not yet available.
          return null
        }
        return await apiFetch(
          `/api/racks/${params.rackId}/assortments`,
          RackAssortmentsSchema,
          {
            method: "GET",
            queryParams: {
              ...params,
            },
          }
        )
      }

      if (params && "warehouseId" in params) {
        if (params.warehouseId === -1) {
          // This is a workaround to prevent the query from running when warehouseId is not yet available.
          return null
        }
        return await apiFetch(
          `/api/warehouses/${params.warehouseId}/assortments`,
          WarehouseAssortmentsSchema,
          {
            method: "GET",
            queryParams: {
              ...params,
            },
          }
        )
      }

      return await apiFetch("/api/assortments", AssortmentsSchema, {
        queryParams: {
          ...params,
        },
      })
    },
  })
}
