import { useTranslations } from "next-intl"

type MessageValues = Record<
  string,
  boolean | Date | null | number | string | undefined
>

export type AppTranslate = ((key: string, values?: MessageValues) => string) & {
  has: (key: string) => boolean
}

export const useAppTranslations = (): AppTranslate =>
  useTranslations() as unknown as AppTranslate
