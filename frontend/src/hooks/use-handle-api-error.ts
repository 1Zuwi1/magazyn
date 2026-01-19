import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { FetchError } from "@/lib/fetcher"
import type { TranslatorFor } from "@/types/translation"

const getTranslated = (
  t: TranslatorFor<"common.apiErrors">,
  key: Parameters<typeof t>[0]
) => {
  if (t.has(key)) {
    return t(key)
  }

  return key
}

export const useHandleApiError = () => {
  const translator = useTranslations("common.apiErrors")

  return (err: unknown, fallback?: string) => {
    const message =
      err instanceof FetchError
        ? getTranslated(translator, err.message as never)
        : (fallback ?? translator("generic"))

    toast.error(message)
  }
}
