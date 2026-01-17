import { Header } from "@/components/admin-panel/components/main/app-sidebar"
import { Search } from "@/components/admin-panel/components/main/search"
import { SearchProvider } from "@/components/admin-panel/components/main/search-provider"
import { TopNav } from "@/components/admin-panel/components/main/top-nav"
import { ADMIN_NAV_DATA } from "@/components/admin-panel/utils/navigation"
import ProtectedPage from "../../protected-page"
export default function AdminDashboard() {
  return (
    <ProtectedPage needAdminPrivileges={false}>
      <SearchProvider navData={ADMIN_NAV_DATA}>
        <Header>
          <TopNav />
          <Search placeholder="Szukaj..." />
        </Header>
      </SearchProvider>
    </ProtectedPage>
  )
}
