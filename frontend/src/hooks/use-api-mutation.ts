import type { MutationFunctionContext } from "@tanstack/query-core"
import {
  type MutateOptions,
  type UseMutationOptions,
  type UseMutationResult,
  useMutation,
} from "@tanstack/react-query"
import { useRef } from "react"
import { useTwoFactorVerificationDialogStore } from "@/components/dashboard/settings/two-factor-verification-dialog-store"
import { handleApiError } from "@/components/dashboard/utils/helpers"
import { FetchError } from "@/lib/fetcher"

export function useApiMutation<
  TData = unknown,
  TVariables = void,
  TError = FetchError,
  TContext = unknown,
>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables, TContext> {
  const { mutationFn, ...mutationOptions } = options
  const pendingMutateOptionsRef = useRef<MutateOptions<
    TData,
    TError,
    TVariables,
    TContext
  > | null>(null)
  const mutateRef = useRef<
    UseMutationResult<TData, TError, TVariables, TContext>["mutate"] | null
  >(null)

  const wrappedMutationFn =
    typeof mutationFn === "function"
      ? async (
          variables: TVariables,
          context: MutationFunctionContext
        ): Promise<TData> => {
          try {
            return await mutationFn(variables, context)
          } catch (error) {
            if (FetchError.isError(error)) {
              if (error.code === "INSUFFICIENT_PERMISSIONS") {
                const mutateOptions = pendingMutateOptionsRef.current
                useTwoFactorVerificationDialogStore.getState().open({
                  onVerified: () => {
                    const retryMutate = mutateRef.current
                    if (!retryMutate) {
                      return
                    }
                    if (mutateOptions) {
                      retryMutate(variables, mutateOptions)
                    } else {
                      retryMutate(variables)
                    }
                  },
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
      : mutationFn

  const mutation = useMutation({
    ...mutationOptions,
    mutationFn: wrappedMutationFn,
  })
  mutateRef.current = mutation.mutate

  const originalMutate = mutation.mutate
  const wrappedMutate: typeof originalMutate = (variables, mutateOptions) => {
    pendingMutateOptionsRef.current = mutateOptions ?? null
    return originalMutate(variables, mutateOptions)
  }

  return {
    ...mutation,
    mutate: wrappedMutate,
  }
}
