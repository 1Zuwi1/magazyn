import { AdminHeader } from "@/components/admin-panel/components/admin-header"
import { Search } from "@/components/admin-panel/components/search-bar/search"
import { SearchProvider } from "@/components/admin-panel/components/search-bar/search-provider"
import { TopNav } from "@/components/admin-panel/components/top-nav"
import { ADMIN_NAV_LINKS } from "@/components/admin-panel/lib/constants"
import { AdminOverview } from "@/components/admin-panel/overview/admin-overview"
import ProtectedPage from "@/components/security/protected-page"

export default function AdminDashboard() {
  return (
    <ProtectedPage needAdminPrivileges>
      <SearchProvider
        navData={ADMIN_NAV_LINKS.map((link) => ({
          title: link.title,
          items: [{ title: link.title, url: link.url }],
        }))}
      >
        <AdminHeader className="mb-4">
          <TopNav />
          <Search placeholder="Szukaj..." />
        </AdminHeader>
        <AdminOverview />
      </SearchProvider>
    </ProtectedPage>
  )
}
