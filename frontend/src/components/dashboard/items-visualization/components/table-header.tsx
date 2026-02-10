import { TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { translateMessage } from "@/i18n/translate-message"

export function RackItemsTableHeader() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="min-w-25">
          {translateMessage("generated.m0906")}
        </TableHead>
        <TableHead className="w-20">
          {translateMessage("generated.m0480")}
        </TableHead>
        <TableHead className="w-25">
          {translateMessage("generated.m0908")}
        </TableHead>
        <TableHead className="w-25">
          {translateMessage("generated.m0481")}
        </TableHead>
        <TableHead className="w-30">
          {translateMessage("generated.m0898")}
        </TableHead>
        <TableHead className="w-30">
          {translateMessage("generated.m0986")}
        </TableHead>
        <TableHead className="w-16"> </TableHead>
      </TableRow>
    </TableHeader>
  )
}
