import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { getUrl } from "@/lib/get-url"

interface PageProps {
  params: Promise<{ id: string; name: string }>
}

const COOKIE_MAX_AGE = 60 * 60 // 1 hour
const WAREHOUSE_ID_REGEX = /^(?=.*[a-zA-Z0-9])[a-zA-Z0-9-]+$/

export async function GET(req: NextRequest, props: PageProps) {
  const params = await props.params
  const { id, name } = params

  const isValidWarehouseId = id && WAREHOUSE_ID_REGEX.test(id)
  const url = await getUrl(req)
  if (!isValidWarehouseId) {
    return NextResponse.redirect(new URL("/dashboard/", url))
  }

  if (!name) {
    return NextResponse.redirect(new URL("/dashboard/", url))
  }

  const cookieStore = await cookies()
  const safeName = encodeURIComponent(name)
  cookieStore.set({
    name: "warehouseId",
    value: id,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: `/dashboard/warehouse/${safeName}`,
    maxAge: COOKIE_MAX_AGE,
  })

  return NextResponse.redirect(new URL(`/dashboard/warehouse/${safeName}`, url))
}
