"use client"

import { Search01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useTranslations } from "next-intl"
import { useCallback, useEffect, useRef, useState } from "react"
import { useInfiniteItems } from "@/hooks/use-items"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Spinner } from "../ui/spinner"
import { CancelButton } from "./cancel-button"
import { ScannerBody } from "./scanner-body"
import type { ScanItem } from "./scanner-types"

const SCROLL_THRESHOLD_PX = 200

interface ScannerSelectItemProps {
  title: string
  description: string
  onSelect: (item: ScanItem) => void
  onCancel: () => void
}

export function ScannerSelectItem({
  title,
  description,
  onSelect,
  onCancel,
}: ScannerSelectItemProps) {
  const t = useTranslations()

  const [search, setSearch] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  const {
    items,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    isError,
  } = useInfiniteItems({
    search,
  })

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!(el && hasNextPage) || isFetchingNextPage) {
      return
    }

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    if (distanceFromBottom < SCROLL_THRESHOLD_PX) {
      fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) {
      return
    }

    el.addEventListener("scroll", handleScroll)
    return () => el.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  return (
    <ScannerBody>
      <div className="relative flex h-full flex-col">
        <CancelButton onClick={onCancel} />

        <div className="mb-4">
          <h2 className="font-semibold text-xl tracking-tight">{title}</h2>
          <p className="mt-1 text-muted-foreground text-sm">{description}</p>
        </div>

        <div className="relative mb-4">
          <HugeiconsIcon
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            icon={Search01Icon}
          />
          <Input
            autoComplete="off"
            className="h-11 rounded-xl pl-9"
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("generated.scanner.searchNameCode")}
            type="text"
            value={search}
          />
        </div>

        <div
          className="relative -mx-2 mb-4 flex-1 overflow-hidden"
          ref={scrollRef}
        >
          <div className="h-full space-y-2 overflow-y-auto px-2 py-1">
            {isPending ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="size-6" />
              </div>
            ) : null}

            {isError ? (
              <p className="py-8 text-center text-destructive text-sm">
                {t("generated.scanner.failedFetchProductList")}
              </p>
            ) : null}

            {!(isPending || isError) && items.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground text-sm">
                {t("generated.scanner.productsFound")}
              </p>
            ) : null}

            {isPending || isError
              ? null
              : items.map((item) => (
                  <button
                    className="flex w-full items-center gap-3 rounded-xl border bg-card/50 p-3 text-left transition-all hover:border-primary/30 hover:shadow-sm"
                    key={item.id}
                    onClick={() => onSelect(item)}
                    type="button"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-sm">
                        {item.name}
                      </p>
                      <p className="mt-0.5 font-mono text-muted-foreground text-xs">
                        {item.code}
                      </p>
                    </div>
                  </button>
                ))}

            {isFetchingNextPage ? (
              <div className="flex items-center justify-center py-4">
                <Spinner className="size-4" />
              </div>
            ) : null}
          </div>
        </div>

        <div className="pt-2">
          <Button
            className="h-12 w-full rounded-xl"
            onClick={onCancel}
            type="button"
            variant="outline"
          >
            {t("generated.scanner.back")}
          </Button>
        </div>
      </div>
    </ScannerBody>
  )
}
