import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/fetcher"
import { TFASchema } from "@/lib/schemas"

export default function useLinkedMethods() {
  return useQuery({
    queryKey: ["linked-2fa-methods"],
    queryFn: () => apiFetch("/api/2fa", TFASchema),
  })
}
