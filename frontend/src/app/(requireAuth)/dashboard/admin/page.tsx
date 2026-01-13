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

const navData = [
  {
    title: "Main",
    items: [
      { title: "Przegląd", url: "/dashboard/preview" },
      { title: "Użytkownicy", url: "/dashboard/users" },
      { title: "Magazyny", url: "/dashboard/warehouses" },
    ],
  },
]

const subData = [
  { title: "Ustawienia", url: "/dashboard/settings" },
  { title: "Pomoc", url: "/dashboard/help" },
]

export default function AdminDashboard() {
  return (
    <ProtectedPage needAdminPrivileges={false}>
      <SearchProvider navData={navData} subData={subData}>
        <Header>
          <TopNav links={topNav} />
          <Search placeholder="Szukaj..." />
        </Header>
      </SearchProvider>
    </ProtectedPage>
  )
}
