import { apiFetch, type InferApiOutput } from "@/lib/fetcher"
import { ItemsSchema, type PaginatedRequest } from "@/lib/schemas"
import { useApiQuery } from "./use-api-query"

const ITEMS_QUERY_KEY = ["items"] as const

export type ItemList = InferApiOutput<typeof ItemsSchema, "GET">
export type ItemListItem = ItemList["content"][number]
export default function useItems(
  { page, size }: PaginatedRequest = {
    page: 0,
    size: 100,
  }
) {
  return useApiQuery({
    queryKey: [...ITEMS_QUERY_KEY, { page, size }],
    queryFn: () =>
      apiFetch("/api/items", ItemsSchema, {
        queryParams: {
          page,
          size,
        },
      }),
  })
}
