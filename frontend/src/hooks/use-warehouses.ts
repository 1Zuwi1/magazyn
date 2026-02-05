import { apiFetch } from "@/lib/fetcher"
import { WarehousesSchema } from "@/lib/schemas"
import { useApiQuery } from "./use-api-query"

const WAREHOUSES_QUERY_KEY = ["warehouses"] as const

export default function useWarehouses(
  { page, size }: { page?: number; size?: number } = {
    page: 0,
    size: 20,
  }
) {
  return useApiQuery({
    queryKey: WAREHOUSES_QUERY_KEY,
    queryFn: () =>
      apiFetch("/api/warehouses", WarehousesSchema, {
        queryParams: {
          page,
          size,
        },
      }),
  })
}
