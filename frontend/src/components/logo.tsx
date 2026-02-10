import Image from "next/image"

import LogoImage from "@/../public/Logo.png"
import { useAppTranslations } from "@/i18n/use-translations"
import { cn } from "@/lib/utils"
export default function Logo<
  T extends string | undefined,
  W = T extends "a"
    ? React.AnchorHTMLAttributes<HTMLAnchorElement>
    : React.HTMLAttributes<HTMLDivElement>,
>({
  href,
  className,
  ...props
}: {
  href?: T
  className?: string
} & W) {
  const t = useAppTranslations()

  const Wrapper = href ? "a" : "div"
  return (
    <Wrapper
      className={cn("flex items-center gap-2", className)}
      href={href}
      {...props}
    >
      <Image
        alt={t("generated.global.brand.gdzietolezyLogo")}
        className="size-6"
        height={24}
        src={LogoImage}
        width={24}
      />
      <span className="font-bold text-xl">
        {t("generated.shared.gdzietolezy")}
      </span>
    </Wrapper>
  )
}
