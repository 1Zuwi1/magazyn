import {
  ArchiveIcon,
  PackageIcon,
  Upload01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import ProtectedPage from "../../protected-page"

export default function AdminDashboard() {
  const modules = [
    {
      title: "",
      description: "",
      href: "/dashboard/admin/assortment",
      icon: ArchiveIcon,
    },
    {
      title: "",
      description: "",
      href: "/dashboard/admin/assortment",
      icon: PackageIcon,
    },
    {
      title: "",
      description: "",
      href: "/dashboard/admin/assortment",
      icon: Upload01Icon,
    },
  ]

  return (
    <ProtectedPage needAdminPrivileges>
      <div className="flex-1 space-y-6 p-4 pt-6">
        <div className="flex flex-col gap-2">
          <h1 className="font-bold text-3xl tracking-tight">Admin Panel</h1>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module, index) => (
            <Link href={module.href} key={index}>
              <Card className="h-full transition-shadow">
                <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-muted bg-muted/50 text-muted-foreground">
                    <HugeiconsIcon
                      className={cn(
                        buttonVariants({ variant: "secondary", size: "icon" })
                      )}
                      icon={module.icon}
                      size={24}
                    />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-xl">
                      {module.title || "title"}
                    </CardTitle>
                    <CardDescription>
                      {module.description || "description"}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </ProtectedPage>
  )
}
