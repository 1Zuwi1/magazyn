import { type UseQueryResult, useQueries } from "@tanstack/react-query"
import { useMemo } from "react"
import {
  apiFetch,
  type FetchError,
  type InferApiInput,
  type InferApiOutput,
} from "@/lib/fetcher"
import {
  CreateItemSchema,
  DeleteItemSchema,
  ItemDetailsSchema,
  ItemImportSchema,
  ItemsSchema,
  UpdateItemSchema,
} from "@/lib/schemas"
import { useApiMutation } from "./use-api-mutation"
import { useApiQuery } from "./use-api-query"

const ITEMS_QUERY_KEY = ["items"] as const
const ITEM_DETAILS_QUERY_KEY = [...ITEMS_QUERY_KEY, "details"] as const
const ITEM_DETAILS_STALE_TIME_MS = 5 * 60 * 1000

export type ItemsList = InferApiOutput<typeof ItemsSchema, "GET">
export type Item = ItemsList["content"][number]
export type ItemDetails = InferApiOutput<typeof ItemDetailsSchema, "GET">

interface ItemsListParams {
  page?: number
  size?: number
  warehouseId?: number
}

interface ItemDetailsParams {
  itemId: number
}

interface MultipleItemsParams {
  itemIds: readonly number[]
  staleTime?: number
}

export function useMultipleItems({
  itemIds,
  staleTime = ITEM_DETAILS_STALE_TIME_MS,
}: MultipleItemsParams): UseQueryResult<ItemDetails, FetchError>[] {
  const uniqueItemIds = useMemo(
    () => [...new Set(itemIds.filter((itemId) => itemId >= 0))],
    [itemIds]
  )

  return useQueries({
    queries: uniqueItemIds.map((itemId) => ({
      queryKey: [...ITEM_DETAILS_QUERY_KEY, itemId],
      queryFn: async () =>
        await apiFetch(`/api/items/${itemId}`, ItemDetailsSchema, {
          method: "GET",
        }),
      staleTime,
    })),
  })
}

export default function useItems(
  params?: ItemsListParams
): UseQueryResult<ItemsList, FetchError>

export default function useItems(
  params: ItemDetailsParams
): UseQueryResult<ItemDetails, FetchError>

export default function useItems(
  {
    page,
    size,
    warehouseId,
    itemId,
  }: {
    page?: number
    size?: number
    warehouseId?: number
    itemId?: number
  } = {
    page: 0,
    size: 20,
  }
) {
  return useApiQuery({
    queryKey: [...ITEMS_QUERY_KEY, { page, size, warehouseId, itemId }],
    queryFn: async () => {
      if (itemId !== undefined) {
        if (itemId === -1) {
          // This is a workaround to prevent the query from running when itemId is not yet available.
          return null
        }
        return await apiFetch(`/api/items/${itemId}`, ItemDetailsSchema, {
          method: "GET",
        })
      }

      if (warehouseId !== undefined) {
        if (warehouseId === -1) {
          // This is a workaround to prevent the query from running when warehouseId is not yet available.
          return null
        }
        return await apiFetch(
          `/api/warehouses/${warehouseId}/items`,
          ItemsSchema,
          {
            method: "GET",
            queryParams: {
              page,
              size,
            },
          }
        )
      }

      return await apiFetch("/api/items", ItemsSchema, {
        queryParams: {
          page,
          size,
        },
      })
    },
  })
}

export function useImportItems() {
  return useApiMutation({
    mutationFn: async (file: File) => {
      return await apiFetch("/api/items/import", ItemImportSchema, {
        method: "POST",
        body: { file },
        formData: (formData, data) => {
          formData.append("file", data.file)
        },
      })
    },
    onSuccess: (_, __, ___, context) => {
      context.client.invalidateQueries({
        queryKey: ITEMS_QUERY_KEY,
      })
    },
  })
}

export function useCreateItem() {
  return useApiMutation({
    mutationFn: (data: InferApiInput<typeof CreateItemSchema, "POST">) =>
      apiFetch("/api/items", CreateItemSchema, {
        method: "POST",
        body: data,
      }),
    onSuccess: (_, __, ___, context) => {
      context.client.invalidateQueries({
        queryKey: ITEMS_QUERY_KEY,
      })
    },
  })
}

export function useUpdateItem() {
  return useApiMutation({
    mutationFn: ({
      itemId,
      data,
    }: {
      itemId: number
      data: InferApiInput<typeof UpdateItemSchema, "PUT">
    }) =>
      apiFetch(`/api/items/${itemId}`, UpdateItemSchema, {
        method: "PUT",
        body: data,
      }),
    onSuccess: (_, __, ___, context) => {
      context.client.invalidateQueries({
        queryKey: ITEMS_QUERY_KEY,
      })
    },
  })
}

export function useDeleteItem() {
  return useApiMutation({
    mutationFn: (itemId: number) =>
      apiFetch(`/api/items/${itemId}`, DeleteItemSchema, {
        method: "DELETE",
      }),
    onSuccess: (_, __, ___, context) => {
      context.client.invalidateQueries({
        queryKey: ITEMS_QUERY_KEY,
      })
    },
  })
}
