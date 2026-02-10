import { getTranslations } from "next-intl/server"
import type { AppTranslate } from "./use-translations"

export const getAppTranslations = async (): Promise<AppTranslate> =>
  (await getTranslations()) as unknown as AppTranslate
