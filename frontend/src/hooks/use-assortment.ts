import { apiFetch, type InferApiOutput } from "@/lib/fetcher"
import { AssortmentSchema } from "@/lib/schemas"
import { useApiQuery } from "./use-api-query"

const ASSORTMENT_QUERY_KEY = ["assortments"] as const

export type AssortmentList = InferApiOutput<typeof AssortmentSchema, "GET">
export type AssortmentListItem = AssortmentList["content"][number]

interface AssortmentListParams {
  page?: number
  size?: number
}

export default function useAssortment(
  { page, size }: AssortmentListParams = {
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
