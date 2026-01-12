"use client"

import {
  Analytics,
  ArrowRight01Icon,
  CellularNetworkIcon,
  Package,
  Smartphone,
  Video,
  View,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { motion } from "framer-motion"
import Link from "next/link"
import Logo from "@/components/logo"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  const features = [
    {
      title: "Szybkie Skanowanie",
      description:
        "Błyskawicznie skanuj kody QR i barkody za pomocą kamery w telefonie. Zarządzaj stanem magazynowym bez zbędnych kliknięć.",
      icon: Smartphone,
    },
    {
      title: "Wizualizacja 3D",
      description:
        "Zobacz swój magazyn w trzech wymiarach. Łatwo lokalizuj przedmioty na regałach dzięki interaktywnej mapie 3D.",
      icon: View,
    },
    {
      title: "Pełna Kontrola",
      description:
        "Śledź historię ruchu towarów, zarządzaj dostawami i wydaniami. Każdy przedmiot ma swoje miejsce i historię.",
      icon: Package,
    },
    {
      title: "Zaawansowana Analityka",
      description:
        "Generuj raporty wydajności, twórz prognozy zapotrzebowania i optymalizuj przestrzeń magazynową dzięki twardym danym.",
      icon: Analytics,
    },
    {
      title: "Wsparcie Mobilne",
      description:
        "Twoi pracownicy mogą pracować na dowolnym urządzeniu – tablecie, telefonie czy dedykowanym kolektorze danych.",
      icon: CellularNetworkIcon,
    },
    {
      title: "Powiadomienia Smart",
      description:
        "Otrzymuj alerty o niskim stanie zapasów, zbliżających się terminach ważności lub opóźnieniach w dostawach.",
      icon: Video,
    },
  ]

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      {/* Navigation */}
      <header className="fixed top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Logo href="/" />
          <div className="flex items-center gap-4">
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/login"
            >
              Zaloguj się
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 lg:pt-56">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_45%_at_50%_50%,var(--color-primary-100)_0%,transparent_100%)] opacity-20 dark:opacity-10" />
          <div className="container mx-auto px-4">
            <motion.div
              animate="visible"
              className="flex flex-col items-center text-center"
              initial="hidden"
              variants={containerVariants}
            >
              <motion.h1
                className="max-w-4xl text-balance font-bold text-4xl tracking-tight sm:text-6xl lg:text-7xl"
                variants={itemVariants}
              >
                Inteligencja w Twoim{" "}
                <span className="text-primary">magazynie</span>
              </motion.h1>
              <motion.p
                className="mt-6 max-w-2xl text-balance text-lg text-muted-foreground sm:text-xl"
                variants={itemVariants}
              >
                GdzieToLeży to nowoczesna platforma zarządzania magazynem, która
                zmienia sposób, w jaki zarządzasz logistyką. Szybkość, precyzja
                i przejrzystość w jednym miejscu.
              </motion.p>
              <motion.div
                className="mt-10 flex flex-col gap-4 sm:flex-row"
                variants={itemVariants}
              >
                <Link href="/login">
                  <Button className="h-12 px-8 text-base shadow-lg" size="lg">
                    Zacznij korzystać
                    <HugeiconsIcon
                      className="ml-2 size-5"
                      icon={ArrowRight01Icon}
                    />
                  </Button>
                </Link>
                <Button
                  className="h-12 px-8 text-base"
                  size="lg"
                  variant="outline"
                >
                  Zobacz jak to działa
                </Button>
              </motion.div>
            </motion.div>

            {/* Mock UI Reveal */}
            <motion.div
              className="mt-20 overflow-hidden rounded-xl border bg-card shadow-2xl"
              initial={{ opacity: 0, y: 40 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <div className="flex h-8 items-center gap-2 border-b bg-muted/50 px-4">
                <div className="size-2.5 rounded-full bg-red-400" />
                <div className="size-2.5 rounded-full bg-amber-400" />
                <div className="size-2.5 rounded-full bg-emerald-400" />
              </div>
              <div className="aspect-video bg-muted/20 p-4 md:p-8">
                <div className="h-full rounded-lg bg-background p-4 shadow-sm md:p-6">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded-full bg-primary/10" />
                      <div className="space-y-1">
                        <div className="h-4 w-32 rounded bg-muted" />
                        <div className="h-3 w-20 rounded bg-muted/60" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-8 w-20 rounded bg-muted" />
                      <div className="h-8 w-8 rounded bg-muted" />
                    </div>
                  </div>
                  <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="h-32 rounded-xl bg-muted/30" />
                    <div className="h-32 rounded-xl bg-muted/30" />
                    <div className="h-32 rounded-xl bg-muted/30" />
                  </div>
                  <div className="mt-8 h-48 rounded-xl bg-primary/5" />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="bg-muted/30 py-24 sm:py-32">
          <div className="container mx-auto px-4">
            <div className="mb-16 flex flex-col items-center text-center">
              <h2 className="font-bold text-3xl tracking-tight sm:text-4xl">
                Wszystko, czego potrzebujesz
              </h2>
              <p className="mt-4 max-w-2xl text-muted-foreground sm:text-lg">
                Nasze narzędzia zostały zaprojektowane we współpracy z
                menedżerami logistyki, aby każda funkcja odpowiadała na realne
                potrzeby.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  key={feature.title}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileInView={{ opacity: 1, y: 0 }}
                >
                  <Card className="h-full border-none shadow-md transition-all hover:shadow-xl dark:bg-card/50">
                    <CardHeader>
                      <div className="mb-4 inline-flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <HugeiconsIcon className="size-6" icon={feature.icon} />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Vision/3D Section */}
        <section className="py-24 sm:py-32">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center gap-12 lg:flex-row">
              <div className="flex-1 space-y-6">
                <span className="font-semibold text-primary text-sm uppercase tracking-wider">
                  Nowy standard
                </span>
                <h2 className="font-bold text-4xl tracking-tight sm:text-5xl">
                  Magazyn na Twoim ekranie
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Dzięki zaawansowanej wizualizacji 3D, Twoi magazynierzy nie
                  muszą już szukać produktów "na pamięć". System wskaże im
                  dokładną półkę, na której znajduje się towar.
                </p>
                <div className="space-y-4">
                  {[
                    "Mapowanie regałów i sektorów",
                    "Wskaźniki zapełnienia w czasie rzeczywistym",
                  ].map((item) => (
                    <div className="flex items-center gap-3" key={item}>
                      <div className="flex size-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                        <HugeiconsIcon
                          className="size-4"
                          icon={ArrowRight01Icon}
                        />
                      </div>
                      <span className="font-medium">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-4">
                  <Button className="rounded-full px-8">Sprawdź więcej</Button>
                </div>
              </div>
              <div className="flex-1">
                <div className="relative mx-auto aspect-square w-full max-w-md">
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-primary/20 blur-3xl" />
                  <div className="relative flex h-full items-center justify-center rounded-3xl border bg-card/50 shadow-2xl backdrop-blur-sm">
                    <HugeiconsIcon
                      className="size-48 text-primary opacity-20"
                      icon={Package}
                    />
                    <div className="absolute right-12 bottom-12 left-12 h-48 rounded-xl border bg-background/80 p-4 shadow-lg backdrop-blur">
                      <div className="flex h-full flex-col justify-between">
                        <div className="space-y-2">
                          <div className="h-4 w-1/2 rounded bg-muted" />
                          <div className="h-3 w-1/3 rounded bg-muted/60" />
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-primary/20">
                          <div className="h-full w-2/3 bg-primary" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-background pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
            <div className="col-span-2 lg:col-span-2">
              <Logo className="mb-6" />
              <p className="max-w-xs text-muted-foreground leading-relaxed">
                Nowoczesne rozwiązanie do kompleksowego zarządzania procesami
                magazynowymi. Twoja logistyka na nowym poziomie.
              </p>
            </div>
            <div>
              <h3 className="mb-4 font-bold text-sm uppercase tracking-wider">
                Produkt
              </h3>
              <ul className="space-y-3 text-muted-foreground text-sm">
                <li>Funkcje</li>
                <li>Cennik</li>
                <li>Integracje</li>
                <li>Zmiany w systemie</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 font-bold text-sm uppercase tracking-wider">
                Firma
              </h3>
              <ul className="space-y-3 text-muted-foreground text-sm">
                <li>O nas</li>
                <li>Kariera</li>
                <li>Kontakt</li>
                <li>Blog</li>
              </ul>
            </div>
          </div>
          <div className="mt-16 flex flex-col items-center justify-between border-t pt-8 md:flex-row">
            <p className="text-muted-foreground text-sm">
              © 2025 GdzieToLeży. Wszelkie prawa zastrzeżone.
            </p>
            <div className="mt-4 flex gap-6 md:mt-0">
              <span className="text-muted-foreground text-sm transition-colors hover:text-primary">
                Polityka prywatności
              </span>
              <span className="text-muted-foreground text-sm transition-colors hover:text-primary">
                Regulamin
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
