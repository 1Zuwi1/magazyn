"use client"

import { useTranslations } from "next-intl"
import { TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function RackItemsTableHeader() {
  const t = useTranslations("rackItemsTable")
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-16 text-center">{t("headers.image")}</TableHead>
        <TableHead className="min-w-37.5">{t("headers.name")}</TableHead>
        <TableHead className="w-25">{t("headers.qr")}</TableHead>
        <TableHead className="w-20">{t("headers.weight")}</TableHead>
        <TableHead className="w-25">{t("headers.dimensions")}</TableHead>
        <TableHead className="w-20">{t("headers.temperature")}</TableHead>
        <TableHead className="w-25">{t("headers.expiry")}</TableHead>
        <TableHead className="w-25 text-center">
          {t("headers.status")}
        </TableHead>
        <TableHead className="w-16"> </TableHead>
      </TableRow>
    </TableHeader>
  )
}
