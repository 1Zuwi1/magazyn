import type { ColumnDef } from "@tanstack/react-table"
import type { User } from "@/components/dashboard/types"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

export const usersColumns: ColumnDef<User>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        className="translate-y-0.5"
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    meta: {
      className: cn("start-0 z-10 rounded-tl-[inherit] max-md:sticky"),
    },
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        className="translate-y-0.5"
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "username",
    header: "Username",
    cell: ({ row }) => (
      <div className="max-w-36 ps-3">{row.original.username}</div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => <div className="max-w-48">{row.original.email}</div>,
    enableHiding: false,
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const { role } = row.original

      if (!role) {
        return null
      }

      return <div>{role}</div>
    },
    meta: {
      className: cn("start-8 max-md:sticky"),
    },
    enableHiding: false,
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <div>{row.original.status}</div>,
    meta: {
      className: cn("start-9 max-md:sticky"),
    },
    enableHiding: false,
  },
  {
    id: "actions",
    cell: () => null,
  },
]
