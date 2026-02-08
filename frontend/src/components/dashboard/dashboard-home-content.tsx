"use client"

import { DashboardHomeHeader } from "./home/dashboard-home-header"
import { DashboardHomeInsights } from "./home/dashboard-home-insights"
import { DashboardHomeQuickActions } from "./home/dashboard-home-quick-actions"
import { DashboardHomeStats } from "./home/dashboard-home-stats"

export default function DashboardHomeContent() {
  return (
    <div className="space-y-8">
      <DashboardHomeHeader />
      <DashboardHomeStats />
      <DashboardHomeQuickActions />
      <DashboardHomeInsights />
    </div>
  )
}
