import type { UseQueryResult } from "@tanstack/react-query"
import { apiFetch, type FetchError, type InferApiOutput } from "@/lib/fetcher"
import { type AssortmentDetailsSchema, AssortmentsSchema } from "@/lib/schemas"
import { useApiQuery } from "./use-api-query"

const ITEMS_QUERY_KEY = ["items"] as const

export type ItemsList = InferApiOutput<typeof AssortmentsSchema, "GET">
export type ItemsDetails = InferApiOutput<typeof AssortmentDetailsSchema, "GET">

interface ItemsListParams {
  page?: number
  size?: number
  warehouseId?: number
}

// interface ItemsDetailsParams {
//   warehouseId: number
// }

export default function useItems(
  params?: ItemsListParams
): UseQueryResult<ItemsList, FetchError>

export default function useItems(
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
    queryKey: [...ITEMS_QUERY_KEY, { page, size, warehouseId }],
    queryFn: async () => {
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

      return await apiFetch("/api/items", AssortmentsSchema, {
        queryParams: {
          page,
          size,
        },
      })
    },
  })
}
