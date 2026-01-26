import { AdminHeader } from "@/components/admin-panel/components/app-sidebar"
import { Search } from "@/components/admin-panel/components/search-bar/search"
import { SearchProvider } from "@/components/admin-panel/components/search-bar/search-provider"
import { TopNav } from "@/components/admin-panel/components/top-nav"
import { ADMIN_NAV_LINKS } from "@/components/admin-panel/lib/utils"

export default function AdminDashboard() {
  return (
    <div>
      <SearchProvider
        navData={ADMIN_NAV_LINKS.map((link) => ({
          title: link.title,
          items: [{ title: link.title, url: link.url }],
        }))}
      >
        <AdminHeader>
          <TopNav />
          <Search placeholder="Szukaj..." />
        </AdminHeader>
      </SearchProvider>
    </div>
  )
}
