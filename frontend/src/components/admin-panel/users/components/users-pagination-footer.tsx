import PaginationFull from "@/components/ui/pagination-component"

interface UsersPaginationFooterProps {
  currentPage: number
  totalPages: number
  firstVisible: number
  lastVisible: number
  totalElements: number
  paginationSummaryText: string | null
  onSetPage: (nextPage: number) => void
}

export function UsersPaginationFooter({
  currentPage,
  totalPages,
  firstVisible,
  lastVisible,
  totalElements,
  paginationSummaryText,
  onSetPage,
}: UsersPaginationFooterProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/20 px-4 py-3">
      <p className="text-muted-foreground text-sm">
        {paginationSummaryText ? (
          paginationSummaryText
        ) : (
          <>
            Wyświetlanie{" "}
            <span className="font-medium text-foreground">{firstVisible}</span>–
            <span className="font-medium text-foreground">{lastVisible}</span> z{" "}
            <span className="font-medium text-foreground">{totalElements}</span>{" "}
            użytkowników
          </>
        )}
      </p>
      <PaginationFull
        currentPage={currentPage}
        setPage={onSetPage}
        totalPages={totalPages}
      />
    </div>
  )
}
