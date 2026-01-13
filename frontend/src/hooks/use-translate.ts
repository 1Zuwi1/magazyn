import { useTranslations } from "next-intl"
import type { Messages, NamespaceKeys, NestedKeyOf } from "use-intl/core"

export type Namespace = NamespaceKeys<Messages, NestedKeyOf<Messages>>

export type TranslatorAll = ReturnType<typeof useTranslations>
export type TranslatorFor<N extends Namespace> = ReturnType<
  typeof useTranslations<N>
>

export function useTranslate(): TranslatorAll
export function useTranslate<N extends Namespace>(
  namespace: N
): TranslatorFor<N>
export function useTranslate(namespace?: Namespace) {
  const t = useTranslations(namespace)

  const translate = (...args: Parameters<typeof t>) => {
    const [key] = args

    if (t.has(key)) {
      return t(...args)
    }

    return key
  }

  return Object.assign(translate, t)
}
