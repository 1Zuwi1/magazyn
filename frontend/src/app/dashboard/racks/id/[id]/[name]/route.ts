import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import getUrl from "@/lib/get-url"

interface PageProps {
  params: Promise<{ id: string; name: string }>
}

export async function GET(req: NextRequest, props: PageProps) {
  const params = await props.params
  const { id, name } = params

  const base = req.nextUrl.pathname.split("/").slice(0, -3).join("/")
  const safePath = encodeURI(`${base}/${name}`)
  const cookie = await cookies()
  cookie.set({
    name: "rackId",
    value: id,
    httpOnly: true,
    path: safePath,
  })

  const url = await getUrl(req)

  return NextResponse.redirect(new URL(`/dashboard/racks/${name}`, url))
}
