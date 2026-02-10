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
    const expiredCount = EXPIRY_REPORT.filter((row) => row.daysLeft <= 0).length
    const urgent = EXPIRY_REPORT.filter(
      (row) => row.daysLeft > 0 && row.daysLeft <= 3
    ).length
    const soon = EXPIRY_REPORT.filter((row) => row.daysLeft <= 10).length
    const criticalTempAlerts = TEMPERATURE_REPORT.filter(
      (row) => row.severity === "CRITICAL"
    ).length
    return {
      totalExpiry: EXPIRY_REPORT.length,
      urgentExpiry: urgent,
      soonExpiry: soon,
      expiredCount,
      tempAlerts: TEMPERATURE_REPORT.length,
      criticalTempAlerts,
      inventoryRows: INVENTORY_REPORT.length,
    }
  }, [])

  const hasExpiryAlerts = summary.expiredCount > 0 || summary.urgentExpiry > 0
  const hasTempAlerts = summary.criticalTempAlerts > 0

  return (
    <div className="space-y-6">
      <AdminPageHeader
        description="Generuj raporty dla kontroli dat ważności, odstępstw temperatur i stanów magazynowych."
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
          <TabsTrigger value="inventory">
            Pełna inwentaryzacja ({INVENTORY_REPORT.length})
          </TabsTrigger>
          <TabsTrigger value="expiry">
            <span className="flex items-center gap-2">
              Zbliżające się daty ważności ({summary.soonExpiry})
              {hasExpiryAlerts && (
                <span className="size-2 rounded-full bg-destructive" />
              )}
            </span>
          </TabsTrigger>
          <TabsTrigger value="temperature">
            <span className="flex items-center gap-2">
              Zakresy temperatur ({TEMPERATURE_REPORT.length})
              {hasTempAlerts && (
                <span className="size-2 rounded-full bg-destructive" />
              )}
            </span>
          </TabsTrigger>
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
