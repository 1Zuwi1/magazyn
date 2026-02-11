import type { VariantProps } from "class-variance-authority"
import { useTranslations } from "next-intl"
import type { Dispatch, SetStateAction } from "react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "./button"
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
  variant = "default",
}: {
  currentPage: number
  totalPages: number
  setPage: Dispatch<SetStateAction<number>> | ((page: number) => void)
  className?: string
  variant?: "default" | "compact"
}) {
  const t = useTranslations()

  const isCompact = variant === "compact"
  const buttonVariantsProps = {
    variant: isCompact ? "outline" : "ghost",
    size: isCompact ? "xs" : "default",
  } satisfies VariantProps<typeof buttonVariants>
  if (totalPages <= 1) {
    return null
  }
  return (
    <Pagination
      className={cn(
        {
          "flex items-center justify-between border-t bg-muted/20 px-3 py-2":
            isCompact,
        },
        className
      )}
    >
      {isCompact && (
        <p className="text-muted-foreground text-xs">
          {t("generated.ui.page", {
            value0: currentPage.toString(),
            value1: Math.max(totalPages, 1).toString(),
          })}
        </p>
      )}
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            className={cn(buttonVariants(buttonVariantsProps), {
              "rounded-md border px-2.5 py-1 text-xs transition-colors":
                isCompact,
            })}
            disabled={currentPage <= 1}
            onClick={() => setPage(currentPage - 1)}
            showIcon={!isCompact}
          />
        </PaginationItem>
        {!isCompact && (
          <>
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
          </>
        )}
        <PaginationItem>
          <PaginationNext
            className={cn(buttonVariants(buttonVariantsProps), {
              "rounded-md border px-2.5 py-1 text-xs transition-colors":
                isCompact,
            })}
            disabled={currentPage >= totalPages}
            onClick={() => setPage(currentPage + 1)}
            showIcon={!isCompact}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
