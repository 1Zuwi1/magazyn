import type { MutationFunctionContext } from "@tanstack/query-core"
import {
  type MutateOptions,
  type UseMutationOptions,
  type UseMutationResult,
  useMutation,
} from "@tanstack/react-query"
import { useRef } from "react"
import { useTwoFactorVerificationDialog } from "@/components/dashboard/settings/two-factor-verification-dialog-store"
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
  const { open } = useTwoFactorVerificationDialog()
  const pendingMutateOptionsRef = useRef<MutateOptions<
    TData,
    TError,
    TVariables,
    TContext
  > | null>(null)

  const wrappedMutationFn =
    typeof mutationFn === "function"
      ? async (
          variables: TVariables,
          context: MutationFunctionContext
        ): Promise<TData> => {
          try {
            return await mutationFn(variables, context)
          } catch (error) {
            if (error instanceof FetchError) {
              if (error.code === "INSUFFICIENT_PERMISSIONS") {
                const mutateOptions = pendingMutateOptionsRef.current
                open({
                  onVerified: () => {
                    if (mutateOptions) {
                      mutation.mutate(variables, mutateOptions)
                    } else {
                      mutation.mutate(variables)
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
