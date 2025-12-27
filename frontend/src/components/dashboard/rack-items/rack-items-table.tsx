"use client"

import {
  Delete02Icon,
  InformationCircleIcon,
  MoreVerticalIcon,
  PencilEdit02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"
import type { Item } from "@/components/dashboard/types"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface RackItemsTableProps {
  items: Item[]
  onEdit?: (item: Item) => void
  onDelete?: (itemId: string) => void
  onViewDetails?: (item: Item) => void
}

export function RackItemsTable({
  items,
  onEdit,
  onDelete,
  onViewDetails,
}: RackItemsTableProps) {
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    item: Item | null
  }>({
    open: false,
    item: null,
  })

  const handleDeleteClick = (item: Item) => {
    setDeleteDialog({ open: true, item })
  }

  const handleDeleteConfirm = () => {
    if (deleteDialog.item?.id && onDelete) {
      onDelete(deleteDialog.item.id)
    }
    setDeleteDialog({ open: false, item: null })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  }

  const isExpiringSoon = (expiryDate: string) => {
    const daysUntilExpiry = Math.floor(
      (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0
  }

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date()
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Przedmioty</CardTitle>
          <CardDescription>
            Lista wszystkich przedmiotów w regale
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            Brak przedmiotów w tym regale
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Przedmioty</CardTitle>
          <CardDescription>
            Lista wszystkich przedmiotów w regale ({items.length})
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-border border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-sm">
                    Nazwa
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-sm">
                    Waga
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-sm">
                    Data ważności
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-sm">
                    Status
                  </th>
                  <th className="w-12 px-4 py-3 text-right font-medium text-sm">
                    {" "}
                  </th>
                  {/* TODO: More data to be added later. */}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => {
                  const expired = isExpired(item.expiryDate)
                  const expiringSoon = isExpiringSoon(item.expiryDate)

                  return (
                    <tr
                      className="transition-colors hover:bg-muted/50"
                      key={item.id}
                    >
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-muted-foreground text-xs">
                            ID: {item.id}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm">
                          {item.weight} kg
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span>{formatDate(item.expiryDate)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {item.isDangerous && (
                            <Badge className="text-xs" variant="destructive">
                              Niebezpieczny
                            </Badge>
                          )}
                          {expired && (
                            <Badge className="text-xs" variant="destructive">
                              Przeterminowany
                            </Badge>
                          )}
                          {expiringSoon && !expired && (
                            <Badge className="text-xs" variant="warning">
                              Wkrótce przeterminowany
                            </Badge>
                          )}
                          {!(item.isDangerous || expired || expiringSoon) && (
                            <Badge className="text-xs" variant="success">
                              OK
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger>
                              <Button size="icon" variant="ghost">
                                <HugeiconsIcon icon={MoreVerticalIcon} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {onViewDetails && (
                                <DropdownMenuItem
                                  onClick={() => onViewDetails(item)}
                                >
                                  <HugeiconsIcon
                                    className="mr-2 size-4"
                                    icon={InformationCircleIcon}
                                  />
                                  Wyświetl szczegóły
                                </DropdownMenuItem>
                              )}
                              {onEdit && (
                                <DropdownMenuItem onClick={() => onEdit(item)}>
                                  <HugeiconsIcon
                                    className="mr-2 size-4"
                                    icon={PencilEdit02Icon}
                                  />
                                  Edytuj
                                </DropdownMenuItem>
                              )}
                              {(onViewDetails || onEdit) && onDelete && (
                                <DropdownMenuSeparator />
                              )}
                              {onDelete && (
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => handleDeleteClick(item)}
                                >
                                  <HugeiconsIcon
                                    className="mr-2 size-4"
                                    icon={Delete02Icon}
                                  />
                                  Usuń
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        onOpenChange={(open) =>
          setDeleteDialog({ open, item: deleteDialog.item })
        }
        open={deleteDialog.open}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usunąć?</AlertDialogTitle>
            <AlertDialogDescription>
              Przedmiot "{deleteDialog.item?.name}" zostanie trwale usunięty
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
