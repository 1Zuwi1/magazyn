import { apiFetch } from "@/lib/fetcher"
import { AssortmentSchema, type PaginatedRequest } from "@/lib/schemas"
import { useApiQuery } from "./use-api-query"

const ASSORTMENT_QUERY_KEY = ["assortments"] as const

export default function useAssortment(
  { page, size }: PaginatedRequest = {
    page: 0,
    size: 100,
  }
) {
  return useApiQuery({
    queryKey: [...ASSORTMENT_QUERY_KEY, { page, size }],
    queryFn: () =>
      apiFetch("/api/assortments", AssortmentSchema, {
        queryParams: {
          page,
          size,
        },
      }),
  })
}
