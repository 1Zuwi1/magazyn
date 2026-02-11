import type { ReactNode } from "react"

interface AuthCardProps {
  children: ReactNode
}

function AuthCardDecoration() {
  return (
    <>
      {/* Corner accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-0 h-16 w-16"
      >
        <div className="absolute top-3 left-3 h-px w-6 bg-linear-to-r from-primary/40 to-transparent" />
        <div className="absolute top-3 left-3 h-6 w-px bg-linear-to-b from-primary/40 to-transparent" />
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 right-0 h-16 w-16"
      >
        <div className="absolute top-3 right-3 h-px w-6 bg-linear-to-l from-primary/40 to-transparent" />
        <div className="absolute top-3 right-3 h-6 w-px bg-linear-to-b from-primary/40 to-transparent" />
      </div>
    </>
  )
}

export default function AuthCard({ children }: AuthCardProps) {
  return (
    <div className="fade-in slide-in-from-bottom-4 relative animate-in duration-500">
      {/* Background glow */}
      <div className="pointer-events-none absolute -inset-4 rounded-3xl bg-linear-to-b from-primary/5 via-transparent to-transparent blur-2xl" />

      {/* Card container */}
      <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-8 shadow-black/5 shadow-xl">
        <AuthCardDecoration />
        {children}
      </div>
      <div className="pointer-events-none absolute -bottom-2 left-1/2 h-px w-1/2 -translate-x-1/2 bg-linear-to-r from-transparent via-primary/30 to-transparent" />
    </div>
  )
}
