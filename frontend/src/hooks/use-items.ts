import type { UseQueryResult } from "@tanstack/react-query"
import { apiFetch, type FetchError, type InferApiOutput } from "@/lib/fetcher"
import { ItemDetailsSchema, ItemsSchema } from "@/lib/schemas"
import { useApiQuery } from "./use-api-query"

const ITEMS_QUERY_KEY = ["items"] as const

export type ItemsList = InferApiOutput<typeof ItemsSchema, "GET">
export type Item = ItemsList["content"][number]
export type ItemDetails = InferApiOutput<typeof ItemDetailsSchema, "GET">

interface ItemsListParams {
  page?: number
  size?: number
  warehouseId?: number
}

interface ItemDetailsParams {
  itemId: number
}

export default function useItems(
  params?: ItemsListParams
): UseQueryResult<ItemsList, FetchError>

export default function useItems(
  params: ItemDetailsParams
): UseQueryResult<ItemDetails, FetchError>

export default function useItems(
  {
    page,
    size,
    warehouseId,
    itemId,
  }: {
    page?: number
    size?: number
    warehouseId?: number
    itemId?: number
  } = {
    page: 0,
    size: 20,
  }
) {
  return useApiQuery({
    queryKey: [...ITEMS_QUERY_KEY, { page, size, warehouseId, itemId }],
    queryFn: async () => {
      if (itemId !== undefined) {
        if (itemId === -1) {
          // This is a workaround to prevent the query from running when itemId is not yet available.
          return null
        }
        return await apiFetch(`/api/items/${itemId}`, ItemDetailsSchema, {
          method: "GET",
        })
      }

      if (warehouseId !== undefined) {
        if (warehouseId === -1) {
          // This is a workaround to prevent the query from running when warehouseId is not yet available.
          return null
        }
        return await apiFetch(
          `/api/warehouses/${warehouseId}/items`,
          ItemsSchema,
          {
            method: "GET",
            queryParams: {
              page,
              size,
            },
          }
        )
      }

      return await apiFetch("/api/items", ItemsSchema, {
        queryParams: {
          page,
          size,
        },
      })
    },
  })
}
