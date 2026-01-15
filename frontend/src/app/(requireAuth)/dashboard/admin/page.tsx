import { Header } from "@/components/admin-panel/components/main/app-sidebar"
import { Search } from "@/components/admin-panel/components/main/search"
import { SearchProvider } from "@/components/admin-panel/components/main/search-provider"
import { TopNav } from "@/components/admin-panel/components/main/top-nav"
import ProtectedPage from "../../protected-page"

const topNav = [
  {
    title: "Przegląd",
    href: "dashboard/preview",
    isActive: true,
  },
  {
    title: "Użytkownicy",
    href: "dashboard/users",
    isActive: false,
  },
  {
    title: "Magazyny",
    href: "dashboard/warehouses",
    isActive: false,
  },
]

const navData = [
  {
    title: "",
    items: [
      { title: "Przegląd", url: "/dashboard/preview" },
      { title: "Użytkownicy", url: "/dashboard/users" },
      { title: "Magazyny", url: "/dashboard/warehouses" },
    ],
  },
]

export default function AdminDashboard() {
  return (
    <ProtectedPage needAdminPrivileges={false}>
      <SearchProvider navData={navData} subData={[]}>
        <Header>
          <TopNav links={topNav} />
          <Search placeholder="Szukaj..." />
        </Header>
      </SearchProvider>
    </ProtectedPage>
  )
}
