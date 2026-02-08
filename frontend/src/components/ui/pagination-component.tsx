import type { Dispatch, SetStateAction } from "react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./pagination"

export default function PaginationFull({
  currentPage,
  totalPages,
  setPage,
  className,
}: {
  currentPage: number
  totalPages: number
  setPage: Dispatch<SetStateAction<number>> | ((page: number) => void)
  className?: string
}) {
  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
          />
        </PaginationItem>
        {currentPage > 1 && (
          <PaginationItem>
            <PaginationLink onClick={() => setPage(currentPage - 1)}>
              {currentPage - 1}
            </PaginationLink>
          </PaginationItem>
        )}
        <PaginationItem>
          <PaginationLink isActive>{currentPage}</PaginationLink>
        </PaginationItem>
        {currentPage !== totalPages && (
          <PaginationItem>
            <PaginationLink onClick={() => setPage(currentPage + 1)}>
              {currentPage + 1}
            </PaginationLink>
          </PaginationItem>
        )}
        <PaginationItem>
          <PaginationNext
            disabled={currentPage === totalPages}
            onClick={() => setPage(currentPage + 1)}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
