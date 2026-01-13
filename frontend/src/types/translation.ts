import type { useTranslations } from "next-intl"
import type { Messages, NamespaceKeys, NestedKeyOf } from "use-intl/core"

export type Namespace = NamespaceKeys<Messages, NestedKeyOf<Messages>>

export type TranslatorAll = ReturnType<typeof useTranslations>
export type TranslatorFor<N extends Namespace> = ReturnType<
  typeof useTranslations<N>
>
