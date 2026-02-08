import { apiFetch } from "@/lib/fetcher"
import { useApiQuery } from "./use-api-query"

export function useAuditInboundOperations() {
  return useApiQuery({
    queryKey: ["audit", "inbound-operations"],
    queryFn: () => {
      return apiFetch("/api/audit/inbound-operations/", null, {
        method: "GET",
      })
    },
  })
}
