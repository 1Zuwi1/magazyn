import type { UseQueryOptions } from "@tanstack/react-query"
import { apiFetch, type InferApiInput } from "@/lib/fetcher"
import {
  AuditInboudOperationsSchema,
  AuditOutboundOperationsSchema,
} from "@/lib/schemas"
import { useApiQuery } from "./use-api-query"

export function useAuditInboundOperations(
  params: InferApiInput<typeof AuditInboudOperationsSchema, "GET">,
  options?: UseQueryOptions
) {
  return useApiQuery({
    queryKey: ["audit", "inbound-operations", params],
    queryFn: () => {
      return apiFetch(
        "/api/audit/inbound-operations",
        AuditInboudOperationsSchema,
        {
          method: "GET",
          queryParams: params,
        }
      )
    },
    ...options,
  })
}

export function useAuditOutboundOperations(
  params: InferApiInput<typeof AuditOutboundOperationsSchema, "GET">,
  options?: UseQueryOptions
) {
  return useApiQuery({
    queryKey: ["audit", "outbound-operations", params],
    queryFn: () => {
      return apiFetch(
        "/api/audit/outbound-operations",
        AuditOutboundOperationsSchema,
        {
          method: "GET",
          queryParams: params,
        }
      )
    },
    ...options,
  })
}
