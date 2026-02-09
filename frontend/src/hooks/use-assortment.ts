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

interface UseAssortmentsHook {
  (
    params: RackAssortmentsParams,
    options?: SafeQueryOptions<RackAssortmentsList>
  ): UseQueryResult<RackAssortmentsList, FetchError>
  (
    params: WarehouseAssortmentsParams,
    options?: SafeQueryOptions<WarehouseAssortmentsList>
  ): UseQueryResult<WarehouseAssortmentsList, FetchError>
  (
    params: AssortmentDetailsParams,
    options?: SafeQueryOptions<AssortmentDetails>
  ): UseQueryResult<AssortmentDetails, FetchError>
  (
    params?: AssortmentsListParams,
    options?: SafeQueryOptions<AssortmentsList>
  ): UseQueryResult<AssortmentsList, FetchError>
}

const useAssortments = (
  params?:
    | AssortmentsListParams
    | AssortmentDetailsParams
    | WarehouseAssortmentsParams
    | RackAssortmentsParams,
  options?: SafeQueryOptions<
    | AssortmentsList
    | AssortmentDetails
    | WarehouseAssortmentsList
    | RackAssortmentsList
  >
): UseQueryResult<
  | AssortmentsList
  | AssortmentDetails
  | WarehouseAssortmentsList
  | RackAssortmentsList,
  FetchError
> => {
  const query = useApiQuery({
    queryKey: [...ASSORTMENT_QUERY_KEY, params],
    queryFn: async () => {
      if (params && "rackId" in params) {
        return await apiFetch(
          `/api/racks/${params.rackId}/assortments`,
          RackAssortmentsSchema,
          {
            method: "GET",
            queryParams: params,
          }
        )
      }

      if (params && "warehouseId" in params) {
        return await apiFetch(
          `/api/warehouses/${params.warehouseId}/assortments`,
          WarehouseAssortmentsSchema,
          {
            method: "GET",
            queryParams: params,
          }
        )
      }

      if (params && "assortmentId" in params) {
        return await apiFetch(
          `/api/assortments/${params.assortmentId}`,
          AssortmentDetailsSchema,
          {
            method: "GET",
          }
        )
      }

      return await apiFetch("/api/assortments", AssortmentsSchema, {
        queryParams: params,
      })
    },
    ...(options as
      | SafeQueryOptions<
          | AssortmentsList
          | AssortmentDetails
          | WarehouseAssortmentsList
          | RackAssortmentsList
        >
      | undefined),
  })
  return query as UseQueryResult<
    | AssortmentsList
    | AssortmentDetails
    | WarehouseAssortmentsList
    | RackAssortmentsList,
    FetchError
  >
}

export default useAssortments as UseAssortmentsHook
