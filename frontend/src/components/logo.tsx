import Image from "next/image"
import LogoImage from "@/../public/Logo.png"
import { cn } from "@/lib/utils"

export default function Logo({
  href,
  className,
}: {
  href?: string
  className?: string
}) {
  const Wrapper = href ? "a" : "div"
  return (
    <Wrapper className={cn("flex items-center gap-2", className)} href={href}>
      <Image
        alt="GdzieToLeży Logo"
        className="size-6"
        height={24}
        src={LogoImage}
        width={24}
      />
      <span className="font-bold text-xl">GdzieToLeży</span>
    </Wrapper>
  )
}
