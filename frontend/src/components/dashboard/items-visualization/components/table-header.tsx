import { useTranslations } from "next-intl"
import { TableHead, TableHeader, TableRow } from "@/components/ui/table"
export function RackItemsTableHeader() {
  const t = useTranslations()

  return (
    <TableHeader>
      <TableRow>
        <TableHead className="min-w-25">{t("generated.shared.code")}</TableHead>
        <TableHead className="w-20">
          {t("generated.dashboard.itemsVisualization.itemId")}
        </TableHead>
        <TableHead className="w-25">{t("generated.shared.position")}</TableHead>
        <TableHead className="w-25">
          {t("generated.dashboard.shared.user")}
        </TableHead>
        <TableHead className="w-30">{t("generated.shared.created")}</TableHead>
        <TableHead className="w-30">
          {t("generated.dashboard.shared.expires")}
        </TableHead>
        <TableHead className="w-16"> </TableHead>
      </TableRow>
    </TableHeader>
  )
}
