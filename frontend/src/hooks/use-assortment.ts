import type { UseQueryResult } from "@tanstack/react-query"
import { apiFetch, type FetchError, type InferApiOutput } from "@/lib/fetcher"
import { AssortmentDetailsSchema, AssortmentsSchema } from "@/lib/schemas"
import { useApiQuery } from "./use-api-query"

const ASSORTMENT_QUERY_KEY = ["assortments"] as const

export type AssortmentsList = InferApiOutput<typeof AssortmentsSchema, "GET">
export type AssortmentDetails = InferApiOutput<
  typeof AssortmentDetailsSchema,
  "GET"
>

interface AssortmentsListParams {
  page?: number
  size?: number
  warehouseId?: number
  rackId?: number
}

interface AssortmentsDetailsParams {
  assortmentId: number
}

export default function useAssortments(
  params?: AssortmentsListParams
): UseQueryResult<AssortmentsList, FetchError>

export default function useAssortments(
  params: AssortmentsDetailsParams
): UseQueryResult<AssortmentDetails, FetchError>

export default function useAssortments(
  {
    page,
    size,
    assortmentId,
    warehouseId,
    rackId,
  }: {
    page?: number
    size?: number
    assortmentId?: number
    warehouseId?: number
    rackId?: number
  } = {
    page: 0,
    size: 20,
  }
) {
  return useApiQuery({
    queryKey: [
      ...ASSORTMENT_QUERY_KEY,
      { page, size, assortmentId, warehouseId, rackId },
    ],
    queryFn: async () => {
      if (assortmentId !== undefined) {
        if (assortmentId === -1) {
          // This is a workaround to prevent the query from running when assortmentId is not yet available.
          return null
        }
        return await apiFetch(
          `/api/assortments/${assortmentId}`,
          AssortmentDetailsSchema,
          {
            method: "GET",
          }
        )
      }

      if (rackId !== undefined) {
        if (rackId === -1) {
          // This is a workaround to prevent the query from running when rackId is not yet available.
          return null
        }
        return await apiFetch(
          `/api/racks/${rackId}/assortments`,
          AssortmentsSchema,
          {
            method: "GET",
            queryParams: {
              page,
              size,
            },
          }
        )
      }

      if (warehouseId !== undefined) {
        if (warehouseId === -1) {
          // This is a workaround to prevent the query from running when warehouseId is not yet available.
          return null
        }
        return await apiFetch(
          `/api/warehouses/${warehouseId}/assortments`,
          AssortmentsSchema,
          {
            method: "GET",
            queryParams: {
              page,
              size,
            },
          }
        )
      }

      return await apiFetch("/api/assortments", AssortmentsSchema, {
        queryParams: {
          page,
          size,
        },
      })
    },
  })
}
