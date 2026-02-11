import type { SortingState } from "@tanstack/react-table"
import type { BackupListParams } from "@/hooks/use-backups"

export const BACKUPS_PAGE_SIZE = 20

export const DEFAULT_BACKUPS_SORTING: SortingState = [
  {
    id: "createdAt",
    desc: true,
  },
]

const BACKUPS_SORT_FIELDS: Record<string, string> = {
  name: "id",
  status: "status",
  createdAt: "createdAt",
}

export const getBackupsSortParams = (
  sorting: SortingState
): Pick<BackupListParams, "sortBy" | "sortDir"> => {
  const [activeSort] = sorting

  if (!activeSort) {
    return {}
  }

  const sortBy = BACKUPS_SORT_FIELDS[activeSort.id] ?? activeSort.id

  return {
    sortBy,
    sortDir: activeSort.desc ? "desc" : "asc",
  }
}
