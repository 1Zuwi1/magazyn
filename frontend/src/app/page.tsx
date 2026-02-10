import {
  Chart01Icon,
  Clock01Icon,
  Location01Icon,
  PackageIcon,
  QrCodeIcon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { LanguageSwitcher } from "@/components/language-switcher"
import Logo from "@/components/logo"
import { Button } from "@/components/ui/button"
import { translateMessage } from "@/i18n/translate-message"
import { getAnimationStyle } from "@/lib/utils"

// Static decorative components - hoisted outside to avoid re-creation
const GridPattern = () => (
  <svg
    aria-hidden="true"
    className="absolute inset-0 h-full w-full opacity-[0.02]"
  >
    <defs>
      <pattern
        height="32"
        id="grid-pattern"
        patternUnits="userSpaceOnUse"
        width="32"
      >
        <path d="M0 32V0h32" fill="none" stroke="currentColor" />
      </pattern>
    </defs>
    <rect fill="url(#grid-pattern)" height="100%" width="100%" />
  </svg>
)

const GradientOrbs = () => (
  <>
    <div className="absolute top-[-20%] right-[-10%] h-125 w-125 rounded-full bg-primary/7 blur-[100px]" />
    <div className="absolute bottom-[-10%] left-[-5%] h-100 w-100 rounded-full bg-primary/5 blur-[80px]" />
    <div className="absolute top-[40%] left-[20%] h-75 w-75 rounded-full bg-primary/3 blur-[60px]" />
  </>
)

const FloatingElements = () => (
  <>
    <div className="absolute top-[12%] left-[8%] h-2 w-2 rotate-45 animate-pulse bg-primary/20" />
    <div
      className="absolute top-[18%] right-[12%] h-3 w-3 animate-pulse rounded-full border border-primary/20"
      style={{ animationDelay: "0.5s" }}
    />
    <div
      className="absolute top-[65%] left-[15%] h-1.5 w-1.5 animate-pulse rounded-full bg-primary/30"
      style={{ animationDelay: "1s" }}
    />
    <div className="absolute top-[55%] right-[18%] h-4 w-4 rotate-12 border border-primary/15" />
    <div
      className="absolute bottom-[25%] left-[25%] h-2 w-2 animate-pulse rounded-full bg-primary/15"
      style={{ animationDelay: "1.5s" }}
    />
    <div className="absolute right-[22%] bottom-[35%] h-3 w-3 rotate-45 border border-primary/10" />
  </>
)

export default function LandingPage() {
  const features = [
    {
      title: translateMessage("generated.m0107"),
      description: translateMessage("generated.m0108"),
      icon: PackageIcon,
    },
    {
      title: translateMessage("generated.m0109"),
      description: translateMessage("generated.m0110"),
      icon: QrCodeIcon,
    },
    {
      title: translateMessage("generated.m0111"),
      description: translateMessage("generated.m0112"),
      icon: Chart01Icon,
    },
    {
      title: translateMessage("generated.m0113"),
      description: translateMessage("generated.m0114"),
      icon: Location01Icon,
    },
    {
      title: translateMessage("generated.m0115"),
      description: translateMessage("generated.m0116"),
      icon: Clock01Icon,
    },
    {
      title: translateMessage("generated.m0117"),
      description: translateMessage("generated.m0118"),
      icon: UserMultipleIcon,
    },
  ] as const

  const benefits = [
    { value: "99.9%", label: translateMessage("generated.m0119") },
    { value: "< 1s", label: translateMessage("generated.m0120") },
    { value: "24/7", label: translateMessage("generated.m0887") },
    { value: "SSL", label: translateMessage("generated.m0121") },
  ] as const

  return (
    <div className="relative min-h-screen bg-background">
      {/* Background decorations */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <GradientOrbs />
        <GridPattern />
        <FloatingElements />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-border/40 border-b bg-background/70 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Logo href="/" />
          <nav className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/login">
              <Button size="sm" variant="ghost">
                {translateMessage("generated.m0014")}
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">{translateMessage("generated.m0122")}</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-24 md:py-32 lg:py-40">
          <div className="flex flex-col items-center text-center">
            {/* Status badge */}
            <div className="fade-in slide-in-from-bottom-3 mb-8 inline-flex animate-in items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-primary text-sm backdrop-blur-sm duration-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              {translateMessage("generated.m0123")}
            </div>

            {/* Headline */}
            <h1
              className="fade-in slide-in-from-bottom-4 max-w-4xl animate-in font-bold text-4xl tracking-tight duration-700 sm:text-5xl md:text-6xl lg:text-7xl"
              style={getAnimationStyle("100ms")}
            >
              {translateMessage("generated.m0124")}{" "}
              <br className="hidden sm:block" />
              <span className="relative inline-block">
                <span className="bg-linear-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  {translateMessage("generated.m0125")}
                </span>
                <svg
                  aria-hidden="true"
                  className="absolute -bottom-2 left-0 h-3 w-full text-primary/30"
                  preserveAspectRatio="none"
                  viewBox="0 0 200 12"
                >
                  <path
                    d="M1 9c30-6 70-6 100 0s70 -3 98 0"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="3"
                  />
                </svg>
              </span>
            </h1>

            {/* Subheadline */}
            <p
              className="fade-in slide-in-from-bottom-5 mt-8 max-w-2xl animate-in text-lg text-muted-foreground duration-700 sm:text-xl"
              style={getAnimationStyle("200ms")}
            >
              {translateMessage("generated.m0126")}
            </p>

            {/* CTA buttons */}
            <div
              className="fade-in slide-in-from-bottom-6 mt-10 flex animate-in flex-wrap items-center justify-center gap-4 duration-700"
              style={getAnimationStyle("300ms")}
            >
              <Link href="/register">
                <Button
                  className="group min-w-45 shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-primary/30 hover:shadow-xl"
                  size="lg"
                >
                  {translateMessage("generated.m0127")}
                  <svg
                    className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Button>
              </Link>
              <Link href="/login">
                <Button className="min-w-45" size="lg" variant="outline">
                  {translateMessage("generated.m0014")}
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div
              className="fade-in slide-in-from-bottom-7 mt-16 flex animate-in flex-wrap items-center justify-center gap-8 text-muted-foreground/60 text-sm duration-700"
              style={getAnimationStyle("400ms")}
            >
              <div className="flex items-center gap-2">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                {translateMessage("generated.m0128")}
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12,6 12,12 16,14" />
                </svg>
                {translateMessage("generated.m0129")}
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <rect height="21" rx="2" ry="2" width="18" x="3" y="3" />
                  <line x1="3" x2="21" y1="9" y2="9" />
                  <line x1="9" x2="9" y1="21" y2="9" />
                </svg>
                {translateMessage("generated.m0130")}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative border-border/40 border-y bg-muted/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="mb-16 text-center">
            <h2 className="font-bold text-3xl tracking-tight sm:text-4xl">
              {translateMessage("generated.m0131")}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {translateMessage("generated.m0132")}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div
                className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5"
                key={feature.title}
                style={getAnimationStyle(`${index * 100}ms`)}
              >
                {/* Corner accent on hover */}
                <div className="pointer-events-none absolute top-0 right-0 h-20 w-20 translate-x-8 -translate-y-8 rounded-full bg-primary/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />

                <div className="relative">
                  <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary transition-colors duration-300 group-hover:bg-primary/15">
                    <HugeiconsIcon className="size-6" icon={feature.icon} />
                  </div>
                  <h3 className="mb-2 font-semibold text-lg">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits/Stats Section */}
      <section className="relative">
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="rounded-3xl border border-border/50 bg-linear-to-b from-card/80 to-card/40 p-8 backdrop-blur-sm md:p-12">
            <div className="mb-12 text-center">
              <h2 className="font-bold text-3xl tracking-tight sm:text-4xl">
                {translateMessage("generated.m0133")}
              </h2>
              <p className="mt-4 text-muted-foreground">
                {translateMessage("generated.m0134")}
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {benefits.map((benefit, index) => (
                <div
                  className="text-center"
                  key={benefit.label}
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  <div className="mb-2 font-bold text-4xl text-primary md:text-5xl">
                    {benefit.value}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    {benefit.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative border-border/40 border-t">
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary/10 via-primary/5 to-transparent p-8 md:p-16">
            {/* Decorative elements */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-0 right-0 h-64 w-64 translate-x-1/3 -translate-y-1/3 rounded-full bg-primary/10 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 left-0 h-48 w-48 -translate-x-1/3 translate-y-1/3 rounded-full bg-primary/5 blur-2xl"
            />

            <div className="relative flex flex-col items-center text-center">
              <h2 className="max-w-2xl font-bold text-3xl tracking-tight sm:text-4xl">
                {translateMessage("generated.m0135")}
              </h2>
              <p className="mt-4 max-w-xl text-muted-foreground">
                {translateMessage("generated.m0136")}
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link href="/register">
                  <Button
                    className="group min-w-40 shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-primary/30 hover:shadow-xl"
                    size="lg"
                  >
                    {translateMessage("generated.m0122")}
                    <svg
                      className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline">
                    {translateMessage("generated.m0137")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-border/40 border-t bg-muted/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center gap-6">
            <Logo />
            <div className="flex flex-wrap items-center justify-center gap-6 text-muted-foreground text-sm">
              <Link
                className="transition-colors hover:text-foreground"
                href="/login"
              >
                {translateMessage("generated.m0888")}
              </Link>
              <Link
                className="transition-colors hover:text-foreground"
                href="/register"
              >
                {translateMessage("generated.m0889")}
              </Link>
            </div>
            <div className="h-px w-full max-w-xs bg-linear-to-r from-transparent via-border to-transparent" />
            <p className="text-muted-foreground/70 text-sm">
              {translateMessage("generated.m1092", {
                value0: new Date().getFullYear(),
              })}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
