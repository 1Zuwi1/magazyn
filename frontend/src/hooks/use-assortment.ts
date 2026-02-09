import type { UseQueryResult } from "@tanstack/react-query"
import {
  apiFetch,
  type FetchError,
  type InferApiInput,
  type InferApiOutput,
} from "@/lib/fetcher"
import {
  AssortmentDetailsSchema,
  AssortmentsSchema,
  RackAssortmentsSchema,
  WarehouseAssortmentsSchema,
} from "@/lib/schemas"
import type { SafeQueryOptions } from "./helper"
import { useApiQuery } from "./use-api-query"

const ASSORTMENT_QUERY_KEY = ["assortments"] as const

export type AssortmentsList = InferApiOutput<typeof AssortmentsSchema, "GET">
type RackAssortmentsList = InferApiOutput<typeof RackAssortmentsSchema, "GET">
type WarehouseAssortmentsList = InferApiOutput<
  typeof WarehouseAssortmentsSchema,
  "GET"
>
export type AssortmentDetails = InferApiOutput<
  typeof AssortmentDetailsSchema,
  "GET"
>

interface AssortmentsListParams
  extends InferApiInput<typeof AssortmentsSchema, "GET"> {}

interface AssortmentDetailsParams {
  assortmentId: number
}

interface RackAssortmentsParams
  extends InferApiInput<typeof RackAssortmentsSchema, "GET"> {
  rackId: number
}

interface WarehouseAssortmentsParams
  extends InferApiInput<typeof WarehouseAssortmentsSchema, "GET"> {
  warehouseId: number
}

type AssortmentParams =
  | AssortmentsListParams
  | AssortmentDetailsParams
  | WarehouseAssortmentsParams
  | RackAssortmentsParams
  | undefined

type AssortmentResult<TParams extends AssortmentParams> =
  TParams extends RackAssortmentsParams
    ? RackAssortmentsList
    : TParams extends WarehouseAssortmentsParams
      ? WarehouseAssortmentsList
      : TParams extends AssortmentDetailsParams
        ? AssortmentDetails
        : AssortmentsList

export default function useAssortments<TParams extends AssortmentParams>(
  params?: TParams,
  options?: SafeQueryOptions<AssortmentResult<TParams>>
): UseQueryResult<AssortmentResult<TParams>, FetchError> {
  const query = useApiQuery({
    queryKey: [...ASSORTMENT_QUERY_KEY, params],
    queryFn: async (): Promise<AssortmentResult<TParams>> => {
      if (params && "rackId" in params) {
        return (await apiFetch(
          `/api/racks/${params.rackId}/assortments`,
          RackAssortmentsSchema,
          {
            method: "GET",
            queryParams: params,
          }
        )) as AssortmentResult<TParams>
      }

      if (params && "warehouseId" in params) {
        return (await apiFetch(
          `/api/warehouses/${params.warehouseId}/assortments`,
          WarehouseAssortmentsSchema,
          {
            method: "GET",
            queryParams: params,
          }
        )) as AssortmentResult<TParams>
      }

      if (params && "assortmentId" in params) {
        return (await apiFetch(
          `/api/assortments/${params.assortmentId}`,
          AssortmentDetailsSchema,
          {
            method: "GET",
          }
        )) as AssortmentResult<TParams>
      }

      return (await apiFetch("/api/assortments", AssortmentsSchema, {
        queryParams: params,
      })) as AssortmentResult<TParams>
    },
    ...(options as SafeQueryOptions<AssortmentResult<TParams>> | undefined),
  })
  return query as UseQueryResult<AssortmentResult<TParams>, FetchError>
}
