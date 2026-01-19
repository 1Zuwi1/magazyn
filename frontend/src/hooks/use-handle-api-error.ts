import { useMessages, useTranslations } from "next-intl"
import { toast } from "sonner"
import { FetchError } from "@/lib/fetcher"

export const useHandleApiError = () => {
  const translator = useTranslations("common.apiErrors")
  const messages = useMessages()
  const apiErrorMessages = messages.common.apiErrors

  const isApiErrorKey = (key: string): key is keyof typeof apiErrorMessages =>
    Object.hasOwn(apiErrorMessages, key)

  return (err: unknown, fallback?: string) => {
    if (err instanceof FetchError) {
      const errorMessage = err.message
      const message = isApiErrorKey(errorMessage)
        ? translator(errorMessage)
        : errorMessage
      toast.error(message)
      return
    }

    toast.error(fallback ?? translator("generic"))
  }
}
