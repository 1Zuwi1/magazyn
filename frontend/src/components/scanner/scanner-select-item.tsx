"use client"

import { Search01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { apiFetch } from "@/lib/fetcher"
import { ItemsSchema } from "@/lib/schemas"
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
  const [search, setSearch] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    isError,
  } = useInfiniteQuery({
    queryKey: ["scanner-items", search],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      return await apiFetch("/api/items", ItemsSchema, {
        queryParams: {
          page: pageParam,
        },
      })
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.last) {
        return undefined
      }
      return lastPage.page + 1
    },
    staleTime: 60_000,
  })

  const items = useMemo(
    () => data?.pages.flatMap((page) => page.content) ?? [],
    [data]
  )

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

  const filteredItems = useMemo(() => {
    if (!search.trim()) {
      return items
    }
    const lower = search.toLowerCase()
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(lower) ||
        item.code.toLowerCase().includes(lower)
    )
  }, [items, search])

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
            placeholder="Szukaj po nazwie lub kodzie..."
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
                Nie udało się pobrać listy produktów.
              </p>
            ) : null}

            {!(isPending || isError) && filteredItems.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground text-sm">
                Nie znaleziono produktów.
              </p>
            ) : null}

            {isPending || isError
              ? null
              : filteredItems.map((item) => (
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
            Wróć
          </Button>
        </div>
      </div>
    </ScannerBody>
  )
}
