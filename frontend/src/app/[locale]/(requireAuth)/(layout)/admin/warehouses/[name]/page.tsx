import AdminRacksPage from "@/components/admin-panel/warehouses/racks-view/racks-page"
import ProtectedPage from "@/components/security/protected-page"

interface WarehouseDetailPageProps {
  params: Promise<{ name: string }>
}

export default async function WarehouseDetailPage({
  params,
}: WarehouseDetailPageProps) {
  const { name } = await params
  const decodedName = decodeURIComponent(name)

  return (
    <ProtectedPage needAdminPrivileges>
      <AdminRacksPage warehouse={{ name: decodedName }} />
    </ProtectedPage>
  )
}
