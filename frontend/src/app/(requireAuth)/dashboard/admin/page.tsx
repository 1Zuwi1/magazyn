import { Header } from "@/components/admin-panel/layout/app-sidebar"
import { Search } from "@/components/admin-panel/layout/search"
import { SearchProvider } from "@/components/admin-panel/layout/search-provider"
import { TopNav } from "@/components/admin-panel/layout/top-nav"
import { ADMIN_NAV_LINKS } from "@/components/admin-panel/lib/navigation"
import ProtectedPage from "../../protected-page"
export default function AdminDashboard() {
  return (
    <ProtectedPage needAdminPrivileges={false}>
      <SearchProvider
        navData={ADMIN_NAV_LINKS.map((link) => ({
          title: link.title,
          items: [{ title: link.title, url: link.url }],
        }))}
      >
        <Header>
          <TopNav />
          <Search placeholder="Szukaj..." />
        </Header>
      </SearchProvider>
    </ProtectedPage>
  )
}
