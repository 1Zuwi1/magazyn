import { apiFetch } from "@/lib/fetcher"
import { TFASchema } from "@/lib/schemas"
import { useApiQuery } from "./use-api-query"

export default function useLinkedMethods() {
  return useApiQuery({
    queryKey: ["linked-2fa-methods"],
    queryFn: () => apiFetch("/api/2fa", TFASchema),
  })
}
