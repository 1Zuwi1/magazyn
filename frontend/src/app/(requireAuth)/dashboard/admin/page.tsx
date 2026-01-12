import { Header } from "@/components/admin-panel/components/app-sidebar"
import { Search } from "@/components/admin-panel/components/search"
import { SearchProvider } from "@/components/admin-panel/components/search-provider"
import { TopNav } from "@/components/admin-panel/components/top-nav"
import ProtectedPage from "../../protected-page"

const topNav = [
  {
    title: "Preview",
    href: "dashboard/preview",
    isActive: true,
  },
  {
    title: "Users",
    href: "dashboard/users",
    isActive: false,
  },
  {
    title: "Warehouses",
    href: "dashboard/warehouses",
    isActive: false,
  },
]

export default function AdminDashboard() {
  return (
    <ProtectedPage needAdminPrivileges={false}>
      <SearchProvider>
        <Header>
          <TopNav links={topNav} />
          <Search className="" placeholder="Szukaj..." />
        </Header>
      </SearchProvider>
    </ProtectedPage>
  )
}
