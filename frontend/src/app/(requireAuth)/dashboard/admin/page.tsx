import { Header } from "@/components/admin-panel/components/main/app-sidebar"
import { Search } from "@/components/admin-panel/components/main/search"
import { SearchProvider } from "@/components/admin-panel/components/main/search-provider"
import { TopNav } from "@/components/admin-panel/components/main/top-nav"
import ProtectedPage from "../../protected-page"

const topNav = [
  {
    title: "Przegląd",
    href: "/dashboard/admin/preview",
    isActive: true,
  },
  {
    title: "Użytkownicy",
    href: "/dashboard/admin/users",
    isActive: false,
  },
  {
    title: "Magazyny",
    href: "/dashboard/admin/warehouses",
    isActive: false,
  },
]

const navData = [
  {
    title: "",
    items: [
      { title: "Przegląd", url: "/dashboard/admin/preview" },
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
          <TopNav links={topNav} />
          <Search placeholder="Szukaj..." />
        </Header>
      </SearchProvider>
    </ProtectedPage>
  )
}
