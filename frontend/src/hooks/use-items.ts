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
  UploadItemPhotoSchema,
} from "@/lib/schemas"
import { useApiMutation } from "./use-api-mutation"
import { useApiQuery } from "./use-api-query"

const ITEMS_QUERY_KEY = ["items"] as const
const ITEM_DETAILS_QUERY_KEY = [...ITEMS_QUERY_KEY, "details"] as const
const ITEM_DETAILS_STALE_TIME_MS = 5 * 60 * 1000

export type ItemsList = InferApiOutput<typeof ItemsSchema, "GET">
export type Item = ItemsList["content"][number]
export type ItemDetails = InferApiOutput<typeof ItemDetailsSchema, "GET">

type ItemsListParams = InferApiInput<typeof ItemsSchema, "GET">

interface ItemDetailsParams {
  itemId: number
}

interface ItemsByWarehouseParams extends ItemsListParams {
  warehouseId: number
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
  params: ItemsByWarehouseParams
): UseQueryResult<ItemsList, FetchError>

export default function useItems(
  params?: ItemsListParams | ItemDetailsParams | ItemsByWarehouseParams
) {
  return useApiQuery({
    queryKey: [...ITEMS_QUERY_KEY, params],
    queryFn: async () => {
      if (params && "itemId" in params) {
        if (params.itemId === -1) {
          return null
        }
        return await apiFetch(
          `/api/items/${params.itemId}`,
          ItemDetailsSchema,
          {
            method: "GET",
          }
        )
      }

      if (params && "warehouseId" in params) {
        if (params.warehouseId === -1) {
          return null
        }
        return await apiFetch(
          `/api/warehouses/${params.warehouseId}/items`,
          ItemsSchema,
          {
            method: "GET",
            queryParams: params,
          }
        )
      }

      return await apiFetch("/api/items", ItemsSchema, {
        queryParams: params,
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
      ...data
    }: InferApiInput<typeof UpdateItemSchema, "PUT"> & {
      itemId: number
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

export function useUploadItemPhoto() {
  return useApiMutation({
    mutationFn: ({ itemId, photo }: { itemId: number; photo: File }) =>
      apiFetch(`/api/items/${itemId}/photo`, UploadItemPhotoSchema, {
        method: "POST",
        body: { photo },
        formData: (formData, data) => {
          formData.append("file", data.photo)
        },
      }),
    onSuccess: (_, __, ___, context) => {
      context.client.invalidateQueries({
        queryKey: ITEMS_QUERY_KEY,
      })
    },
  })
}
