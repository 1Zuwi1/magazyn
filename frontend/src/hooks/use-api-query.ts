import {
  type QueryFunction,
  type QueryKey,
  type UseQueryOptions,
  type UseQueryResult,
  useQuery,
} from "@tanstack/react-query"
import { useTwoFactorVerificationDialog } from "@/components/dashboard/settings/two-factor-verification-dialog-store"
import { handleApiError } from "@/components/dashboard/utils/helpers"
import { FetchError } from "@/lib/fetcher"

export function useApiQuery<
  TQueryFnData,
  TData = TQueryFnData,
  TError = FetchError,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>
): UseQueryResult<TData, TError> {
  const { queryFn, ...queryOptions } = options
  const { open } = useTwoFactorVerificationDialog()

  const wrappedQueryFn =
    typeof queryFn === "function"
      ? async (
          context: Parameters<QueryFunction<TQueryFnData, TQueryKey>>[0]
        ): Promise<TQueryFnData> => {
          try {
            return await queryFn(context)
          } catch (error) {
            if (FetchError.isError(error)) {
              if (error.code === "INSUFFICIENT_PERMISSIONS") {
                open({
                  onVerified: query.refetch,
                })
              } else {
                handleApiError(error)
              }
            } else {
              handleApiError(error)
            }
            throw error
          }
        }
      : queryFn

  const query = useQuery({
    ...queryOptions,
    queryFn: wrappedQueryFn,
  })

  return query
}
