import { Header } from "@/components/admin-panel/components/main/app-sidebar"
import { Search } from "@/components/admin-panel/components/main/search"
import { SearchProvider } from "@/components/admin-panel/components/main/search-provider"
import { TopNav } from "@/components/admin-panel/components/main/top-nav"
import ProtectedPage from "../../protected-page"

const navData = [
  {
    title: "",
    items: [
      { title: "Przegląd", url: "/dashboard/preview" },
      { title: "Użytkownicy", url: "/dashboard/admin/users" },
      { title: "Magazyny", url: "/dashboard/admin/warehouses" },
    ],
  },
]

export default function AdminDashboard() {
  return (
    <ProtectedPage needAdminPrivileges={false}>
      <SearchProvider navData={navData}>
        <Header>
          <TopNav />
          <Search placeholder="Szukaj..." />
        </Header>
      </SearchProvider>
    </ProtectedPage>
  )
}
