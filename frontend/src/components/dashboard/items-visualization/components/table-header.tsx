import { TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { translateMessage } from "@/i18n/translate-message"

export function RackItemsTableHeader() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="min-w-25">
          {translateMessage("generated.shared.code")}
        </TableHead>
        <TableHead className="w-20">
          {translateMessage("generated.dashboard.itemsVisualization.itemId")}
        </TableHead>
        <TableHead className="w-25">
          {translateMessage("generated.shared.position")}
        </TableHead>
        <TableHead className="w-25">
          {translateMessage("generated.dashboard.shared.user")}
        </TableHead>
        <TableHead className="w-30">
          {translateMessage("generated.shared.created")}
        </TableHead>
        <TableHead className="w-30">
          {translateMessage("generated.dashboard.shared.expires")}
        </TableHead>
        <TableHead className="w-16"> </TableHead>
      </TableRow>
    </TableHeader>
  )
}
