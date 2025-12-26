import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { getUrl } from "@/lib/get-url"

interface PageProps {
  params: Promise<{ id: string; name: string }>
}

const COOKIE_MAX_AGE = 60 * 60 // 1 hour
const RACK_ID_REGEX = /^[a-zA-Z0-9-]+$/

export async function GET(req: NextRequest, props: PageProps) {
  const params = await props.params
  const { id, name } = params

  const isValidRackId = id && RACK_ID_REGEX.test(id)
  if (!isValidRackId) {
    return NextResponse.redirect(new URL("/dashboard/", req.url))
  }

  if (!name) {
    return NextResponse.redirect(new URL("/dashboard/", req.url))
  }

  const cookieStore = await cookies()
  const url = await getUrl(req)
  const safeName = encodeURIComponent(name)
  cookieStore.set({
    name: "rackId",
    value: id,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: `/dashboard/racks/${safeName}`,
    maxAge: COOKIE_MAX_AGE,
  })

  return NextResponse.redirect(new URL(`/dashboard/racks/${safeName}`, url))
}
