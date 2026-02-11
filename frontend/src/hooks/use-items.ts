import {
  type UseQueryResult,
  useInfiniteQuery,
  useQueries,
} from "@tanstack/react-query"
import { useMemo } from "react"
import {
  apiFetch,
  type FetchError,
  type InferApiInput,
  type InferApiOutput,
} from "@/lib/fetcher"
import {
  BatchUploadPhotoSchema,
  CreateItemSchema,
  DeleteItemSchema,
  ItemDetailsSchema,
  ItemImportSchema,
  ItemsSchema,
  UpdateItemSchema,
  UploadItemPhotoSchema,
} from "@/lib/schemas"
import type { SafeInfiniteQueryOptions, SafeQueryOptions } from "./helper"
import { useApiMutation } from "./use-api-mutation"
import { useApiQuery } from "./use-api-query"

const ITEMS_QUERY_KEY = ["items"] as const
const ITEM_DETAILS_QUERY_KEY = [...ITEMS_QUERY_KEY, "details"] as const
const ITEM_DETAILS_STALE_TIME_MS = 5 * 60 * 1000
const INFINITE_ITEMS_STALE_TIME_MS = 60_000
const CSV_IMPORT_TIMEOUT_MS = 60_000

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

interface InfiniteItemsParams {
  search?: string
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

export function useInfiniteItems(
  {
    search = "",
    staleTime = INFINITE_ITEMS_STALE_TIME_MS,
  }: InfiniteItemsParams = {},
  options?: SafeInfiniteQueryOptions<ItemsList, number>
) {
  const normalizedSearch = search.trim()

  const infiniteQuery = useInfiniteQuery({
    queryKey: [...ITEMS_QUERY_KEY, "infinite", normalizedSearch],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) =>
      await apiFetch("/api/items", ItemsSchema, {
        queryParams: {
          page: pageParam,
          search: normalizedSearch || undefined,
        },
      }),
    getNextPageParam: (lastPage) => {
      if (lastPage.last) {
        return undefined
      }

      return lastPage.page + 1
    },
    staleTime,
    ...options,
  })

  const items = useMemo(() => {
    if (!infiniteQuery.data) {
      return []
    }

    return infiniteQuery.data.pages.flatMap((page) => page.content)
  }, [infiniteQuery.data])

  return {
    ...infiniteQuery,
    items,
  }
}

interface UseItemsHook {
  (
    params: ItemDetailsParams,
    options?: SafeQueryOptions<ItemDetails>
  ): UseQueryResult<ItemDetails, FetchError>
  (
    params: ItemsByWarehouseParams,
    options?: SafeQueryOptions<ItemsList>
  ): UseQueryResult<ItemsList, FetchError>
  (
    params?: ItemsListParams,
    options?: SafeQueryOptions<ItemsList>
  ): UseQueryResult<ItemsList, FetchError>
}

const useItems = (
  params?: ItemsListParams | ItemDetailsParams | ItemsByWarehouseParams,
  options?: SafeQueryOptions<ItemsList | ItemDetails>
): UseQueryResult<ItemsList | ItemDetails, FetchError> => {
  return useApiQuery({
    queryKey: [...ITEMS_QUERY_KEY, params],
    queryFn: async () => {
      if (params && "itemId" in params) {
        return await apiFetch(
          `/api/items/${params.itemId}`,
          ItemDetailsSchema,
          {
            method: "GET",
          }
        )
      }
      if (params && "warehouseId" in params) {
        const { warehouseId, ...queryParams } = params
        return await apiFetch(
          `/api/warehouses/${warehouseId}/items`,
          ItemsSchema,
          {
            method: "GET",
            queryParams,
          }
        )
      }

      return await apiFetch("/api/items", ItemsSchema, {
        queryParams: params,
      })
    },
    ...(options as SafeQueryOptions<ItemsList | ItemDetails> | undefined),
  })
}

export default useItems as UseItemsHook

export function useImportItems() {
  return useApiMutation({
    mutationFn: async (file: File) => {
      return await apiFetch("/api/items/import", ItemImportSchema, {
        method: "POST",
        timeoutMs: CSV_IMPORT_TIMEOUT_MS,
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

export function useBatchUploadItemPhotos() {
  return useApiMutation({
    mutationFn: ({ files }: { files: File[] }) =>
      apiFetch("/api/items/photo/import", BatchUploadPhotoSchema, {
        method: "POST",
        body: { files },
        formData: (formData, data) => {
          for (const file of data.files) {
            formData.append("files", file)
          }
        },
      }),
    onSuccess: (_, __, ___, context) => {
      context.client.invalidateQueries({
        queryKey: ITEMS_QUERY_KEY,
      })
    },
  })
}
