import { Header } from "@/components/admin-panel/components/app-sidebar"
import { TopNav } from "@/components/admin-panel/components/top-nav"
import ProtectedPage from "../../protected-page"

const topNav = [
  {
    title: "Preview",
    href: "dashboard/preview",
    isActive: true,
    disabled: false,
  },
  {
    title: "Users",
    href: "dashboard/users",
    isActive: false,
    disabled: true,
  },
  {
    title: "Warehouses",
    href: "dashboard/warehouses",
    isActive: false,
    disabled: true,
  },
]

export default function AdminDashboard() {
  return (
    <ProtectedPage needAdminPrivileges={false}>
      <Header>
        <TopNav links={topNav} />
      </Header>
    </ProtectedPage>
  )
}
