import ProtectedPage from "../../protected-page"

export default function AdminDashboard() {
  // const modules = [
  //   {
  //     title: "",
  //     description: "",
  //     href: "/dashboard/admin/assortment",
  //     icon: ArchiveIcon,
  //   },
  //   {
  //     title: "",
  //     description: "",
  //     href: "/dashboard/admin/assortment",
  //     icon: PackageIcon,
  //   },
  //   {
  //     title: "",
  //     description: "",
  //     href: "/dashboard/admin/assortment",
  //     icon: Upload01Icon,
  //   },
  // ]

  return (
    <ProtectedPage needAdminPrivileges>
      <div>asd</div>
    </ProtectedPage>
  )
}
