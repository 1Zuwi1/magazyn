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

const DEFAULT_RETRY_COUNT = 3

function shouldRetryRequest<TError>(
  retryOption: UseQueryOptions<unknown, TError>["retry"],
  nextFailureCount: number,
  error: TError
): boolean {
  if (typeof retryOption === "function") {
    return retryOption(nextFailureCount, error)
  }

  if (retryOption === false) {
    return false
  }

  if (retryOption === true || retryOption == null) {
    return nextFailureCount <= DEFAULT_RETRY_COUNT
  }

  return nextFailureCount <= retryOption
}

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
            const state = context.client.getQueryState(context.queryKey)
            const currentFailureCount = state?.fetchFailureCount ?? 0
            const nextFailureCount = currentFailureCount + 1
            const willRetry = shouldRetryRequest(
              options.retry,
              nextFailureCount,
              error as TError
            )

            if (
              FetchError.isError(error) &&
              error.code === "INSUFFICIENT_PERMISSIONS"
            ) {
              open({
                onVerified: query.refetch,
              })
            } else if (!willRetry) {
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
