import Link from "next/link"
import Logo from "@/components/logo"
import { Button } from "@/components/ui/button"

// Static decorative components - hoisted outside to avoid re-creation
const GridPattern = (
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

const GradientOrbs = (
  <>
    <div className="absolute top-[-20%] right-[-10%] h-125 w-125 rounded-full bg-primary/7 blur-[100px]" />
    <div className="absolute bottom-[-10%] left-[-5%] h-100 w-100 rounded-full bg-primary/5 blur-[80px]" />
    <div className="absolute top-[40%] left-[20%] h-75 w-75 rounded-full bg-primary/3 blur-[60px]" />
  </>
)

const FloatingElements = (
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

// Feature data - static, defined at module level
const features = [
  {
    title: "Śledzenie zapasów",
    description:
      "Monitoruj stany magazynowe w czasie rzeczywistym. Otrzymuj powiadomienia o niskich stanach.",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        <path
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Kody QR",
    description:
      "Skanuj i generuj kody QR dla produktów. Szybka identyfikacja i lokalizacja.",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        <path
          d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Raporty i analizy",
    description:
      "Szczegółowe raporty i wizualizacje danych. Podejmuj lepsze decyzje biznesowe.",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        <path
          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Zarządzanie lokalizacjami",
    description:
      "Organizuj magazyn w strefy i regały. Zawsze wiedz, gdzie leży produkt.",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        <path
          d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Historia operacji",
    description:
      "Pełna historia przyjęć, wydań i przesunięć. Audyt i kontrola zmian.",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        <path
          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Wieloosobowy dostęp",
    description:
      "Role i uprawnienia dla zespołu. Każdy ma dostęp tylko do tego, co potrzebuje.",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        viewBox="0 0 24 24"
      >
        <path
          d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
]

const benefits = [
  { value: "99.9%", label: "Dostępność systemu" },
  { value: "< 1s", label: "Czas odpowiedzi" },
  { value: "24/7", label: "Monitoring" },
  { value: "SSL", label: "Szyfrowanie danych" },
]

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-background">
      {/* Background decorations */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {GradientOrbs}
        {GridPattern}
        {FloatingElements}
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-border/40 border-b bg-background/70 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Logo href="/" />
          <nav className="flex items-center gap-2">
            <Link href="/login">
              <Button size="sm" variant="ghost">
                Zaloguj się
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Załóż konto</Button>
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
              System aktywny
            </div>

            {/* Headline */}
            <h1
              className="fade-in slide-in-from-bottom-4 max-w-4xl animate-in font-bold text-4xl tracking-tight duration-700 sm:text-5xl md:text-6xl lg:text-7xl"
              style={{
                animationDelay: "100ms",
                animationFillMode: "backwards",
              }}
            >
              Zarządzanie magazynem <br className="hidden sm:block" />
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  dla firmy
                </span>
                <svg
                  aria-hidden="true"
                  className="absolute -bottom-2 left-0 h-3 w-full text-primary/30"
                  preserveAspectRatio="none"
                  viewBox="0 0 200 12"
                >
                  <path
                    d="M1 9c30-6 70-6 100 0s70 6 98 0"
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
              style={{
                animationDelay: "200ms",
                animationFillMode: "backwards",
              }}
            >
              Kompletny system do zarządzania stanami magazynowymi, śledzenia
              produktów i optymalizacji operacji logistycznych.
            </p>

            {/* CTA buttons */}
            <div
              className="fade-in slide-in-from-bottom-6 mt-10 flex animate-in flex-wrap items-center justify-center gap-4 duration-700"
              style={{
                animationDelay: "300ms",
                animationFillMode: "backwards",
              }}
            >
              <Link href="/register">
                <Button
                  className="group min-w-[180px] shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-primary/30 hover:shadow-xl"
                  size="lg"
                >
                  Rozpocznij teraz
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
                <Button className="min-w-[180px]" size="lg" variant="outline">
                  Zaloguj się
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div
              className="fade-in slide-in-from-bottom-7 mt-16 flex animate-in flex-wrap items-center justify-center gap-8 text-muted-foreground/60 text-sm duration-700"
              style={{
                animationDelay: "400ms",
                animationFillMode: "backwards",
              }}
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
                Bezpieczny dostęp
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
                Dane w czasie rzeczywistym
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
                Intuicyjny interfejs
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
              Wszystko, czego potrzebujesz
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Kompleksowe narzędzia do efektywnego zarządzania magazynem
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div
                className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5"
                key={feature.title}
                style={{
                  animationDelay: `${index * 100}ms`,
                  animationFillMode: "backwards",
                }}
              >
                {/* Corner accent on hover */}
                <div className="pointer-events-none absolute top-0 right-0 h-20 w-20 translate-x-8 -translate-y-8 rounded-full bg-primary/10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />

                <div className="relative">
                  <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary transition-colors duration-300 group-hover:bg-primary/15">
                    {feature.icon}
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
          <div className="rounded-3xl border border-border/50 bg-gradient-to-b from-card/80 to-card/40 p-8 backdrop-blur-sm md:p-12">
            <div className="mb-12 text-center">
              <h2 className="font-bold text-3xl tracking-tight sm:text-4xl">
                Niezawodność, na której możesz polegać
              </h2>
              <p className="mt-4 text-muted-foreground">
                System zaprojektowany z myślą o bezpieczeństwie i wydajności
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
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 md:p-16">
            {/* Decorative elements */}
            <div className="pointer-events-none absolute top-0 right-0 h-64 w-64 translate-x-1/3 -translate-y-1/3 rounded-full bg-primary/10 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-48 w-48 -translate-x-1/3 translate-y-1/3 rounded-full bg-primary/5 blur-2xl" />

            <div className="relative flex flex-col items-center text-center">
              <h2 className="max-w-2xl font-bold text-3xl tracking-tight sm:text-4xl">
                Gotowy, aby usprawnić zarządzanie magazynem?
              </h2>
              <p className="mt-4 max-w-xl text-muted-foreground">
                Dołącz do systemu i zacznij efektywnie zarządzać swoimi zasobami
                już dziś.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link href="/register">
                  <Button
                    className="group min-w-40 shadow-lg shadow-primary/25 transition-all duration-300 hover:shadow-primary/30 hover:shadow-xl"
                    size="lg"
                  >
                    Załóż konto
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
                    Mam już konto
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
                Logowanie
              </Link>
              <Link
                className="transition-colors hover:text-foreground"
                href="/register"
              >
                Rejestracja
              </Link>
            </div>
            <div className="h-px w-full max-w-xs bg-gradient-to-r from-transparent via-border to-transparent" />
            <p className="text-muted-foreground/70 text-sm">
              © 2025 GdzieToLeży. System wewnętrzny.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
