import { TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function RackItemsTableHeader() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-16 text-center">Zdjęcie</TableHead>
        <TableHead className="min-w-37.5">Nazwa</TableHead>
        <TableHead className="w-25">Kod QR</TableHead>
        <TableHead className="w-20">Waga</TableHead>
        <TableHead className="w-25">Wymiary</TableHead>
        <TableHead className="w-20">Temp.</TableHead>
        <TableHead className="w-25">Data ważności</TableHead>
        <TableHead className="w-25 text-center">Status</TableHead>
        <TableHead className="w-16"> </TableHead>
      </TableRow>
    </TableHeader>
  )
}
