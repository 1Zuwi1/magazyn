import type { UseQueryResult } from "@tanstack/react-query"
import {
  apiFetch,
  type FetchError,
  type InferApiInput,
  type InferApiOutput,
} from "@/lib/fetcher"
import {
  AuditInboudOperationsSchema,
  AuditOutboundOperationsSchema,
} from "@/lib/schemas"
import type { SafeQueryOptions } from "./helper"
import { useApiQuery } from "./use-api-query"

export type AuditInboundOperationsList = InferApiOutput<
  typeof AuditInboudOperationsSchema,
  "GET"
>
export type AuditOutboundOperationsList = InferApiOutput<
  typeof AuditOutboundOperationsSchema,
  "GET"
>

export function useAuditInboundOperations(
  params: InferApiInput<typeof AuditInboudOperationsSchema, "GET">,
  options?: SafeQueryOptions<AuditInboundOperationsList>
): UseQueryResult<AuditInboundOperationsList, FetchError> {
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
  options?: SafeQueryOptions<AuditOutboundOperationsList>
): UseQueryResult<AuditOutboundOperationsList, FetchError> {
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
