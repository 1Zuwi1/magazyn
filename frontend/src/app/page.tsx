import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { LanguageSwitcher } from "@/components/language-switcher"
import Logo from "@/components/logo"
import { Button } from "@/components/ui/button"

export default async function LandingPage() {
  const t = await getTranslations("landing")
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between">
          <Logo href="/" />
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/login">
              <Button size="sm">{t("actions.login")}</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center">
        <section className="container mx-auto px-4 py-24 md:py-32">
          <div className="flex flex-col items-center text-center">
            <h1 className="mt-6 max-w-3xl font-bold text-4xl tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              {t("hero.titleLine1")} <br className="hidden sm:block" />
              <span className="text-primary">{t("hero.titleHighlight")}</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              {t("hero.subtitle")}
            </p>
            <div className="mt-8">
              <Link href="/login">
                <Button size="lg">{t("actions.cta")}</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="flex flex-col items-center gap-4 text-center text-muted-foreground text-sm">
            <Logo />
            <p>{t("footer")}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
