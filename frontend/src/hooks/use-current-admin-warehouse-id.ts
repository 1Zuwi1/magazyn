"use client"

import {
  type CurrentWarehouseId,
  useCurrentWarehouseId,
} from "@/hooks/use-current-warehouse-id"

export const useCurrentAdminWarehouseId = (): CurrentWarehouseId => {
  return useCurrentWarehouseId({
    redirectIfMissingTo: "/admin/warehouses",
  })
}
