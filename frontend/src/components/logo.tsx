"use client"

import { Package } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

export default function Logo({
  href,
  className,
}: {
  href?: string
  className?: string
}) {
  const t = useTranslations("app")
  const Wrapper = href ? "a" : "div"
  return (
    <Wrapper className={cn("flex items-center gap-2", className)} href={href}>
      <HugeiconsIcon className="size-6 text-primary" icon={Package} />
      <span className="font-bold text-xl">{t("name")}</span>
    </Wrapper>
  )
}
