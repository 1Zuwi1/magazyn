"use client"

import { DatabaseIcon } from "@hugeicons/core-free-icons"
import { useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminPageHeader } from "../components/admin-page-header"
import { ADMIN_NAV_LINKS } from "../lib/constants"
import { ExpiryReportCard } from "./components/expiry-report-card"
import { InventoryReportCard } from "./components/inventory-report-card"
import { ReportSummaryBadges } from "./components/report-summary-badges"
import { TemperatureReportCard } from "./components/temperature-report-card"
import { EXPIRY_REPORT, INVENTORY_REPORT, TEMPERATURE_REPORT } from "./lib/data"

export default function ReportsMain() {
  const summary = useMemo(() => {
    const urgent = EXPIRY_REPORT.filter((row) => row.daysLeft <= 3).length
    const soon = EXPIRY_REPORT.filter((row) => row.daysLeft <= 10).length
    return {
      totalExpiry: EXPIRY_REPORT.length,
      urgentExpiry: urgent,
      soonExpiry: soon,
      tempAlerts: TEMPERATURE_REPORT.length,
      inventoryRows: INVENTORY_REPORT.length,
    }
  }, [])

  return (
    <div className="space-y-6">
      <AdminPageHeader
        description="Generuj raporty dla kontroli dat ważności i odstępstw temperatur."
        icon={DatabaseIcon}
        navLinks={ADMIN_NAV_LINKS.map((link) => ({
          title: link.title,
          url: link.url,
        }))}
        title="Raporty"
      >
        <ReportSummaryBadges summary={summary} />
      </AdminPageHeader>

      <Tabs className="space-y-4" defaultValue="inventory">
        <TabsList variant="line">
          <TabsTrigger value="inventory">Pełna inwentaryzacja</TabsTrigger>
          <TabsTrigger value="expiry">Zbliżające się daty ważności</TabsTrigger>
          <TabsTrigger value="temperature">Zakresy temperatur</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <InventoryReportCard />
        </TabsContent>

        <TabsContent value="expiry">
          <ExpiryReportCard soonExpiry={summary.soonExpiry} />
        </TabsContent>

        <TabsContent value="temperature">
          <TemperatureReportCard />
        </TabsContent>
      </Tabs>
    </div>
  )
}
