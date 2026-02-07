import { TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function RackItemsTableHeader() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="min-w-25">Kod</TableHead>
        <TableHead className="w-20">ID przedmiotu</TableHead>
        <TableHead className="w-25">Pozycja</TableHead>
        <TableHead className="w-25">Użytkownik</TableHead>
        <TableHead className="w-30">Utworzono</TableHead>
        <TableHead className="w-30">Wygasa</TableHead>
        <TableHead className="w-16"> </TableHead>
      </TableRow>
    </TableHeader>
  )
}
