import type { Metadata } from 'next'
import Link from 'next/link'
import { Utensils, QrCode, ShieldCheck, BarChart3 } from 'lucide-react'
import { LoginForm } from '@/components/auth/LoginForm'

// ---------------------------------------------------------------------------
// SEO
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: 'Sign In — QRDineX',
  description:
    'Sign in to your QRDineX account to manage your restaurant, menus, tables, and orders.',
}

// ---------------------------------------------------------------------------
// Feature pills shown on the branding panel
// ---------------------------------------------------------------------------

const FEATURES = [
  { icon: QrCode, label: 'QR table ordering' },
  { icon: ShieldCheck, label: 'Secure role-based access' },
  { icon: BarChart3, label: 'Real-time dashboard' },
] as const

// ---------------------------------------------------------------------------
// PAGE
// ---------------------------------------------------------------------------

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* ------------------------------------------------------------------ */}
      {/* LEFT PANEL — Branding (hidden on mobile) */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative hidden w-[45%] flex-col justify-between bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900 p-10 text-primary-foreground lg:flex overflow-hidden">
        {/* Glow Blobs for Mesh Gradient Effect */}
        <div className="absolute -left-[10%] -top-[10%] h-[50%] w-[50%] rounded-full bg-sky-400/20 blur-[100px] pointer-events-none" />
        <div className="absolute -right-[10%] -bottom-[10%] h-[50%] w-[50%] rounded-full bg-violet-500/25 blur-[120px] pointer-events-none" />
        <div className="absolute right-[20%] top-[25%] h-[35%] w-[35%] rounded-full bg-blue-500/15 blur-[90px] pointer-events-none" />

        {/* Dot-grid background */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          aria-hidden="true"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, white 1px, transparent 1px),
                              radial-gradient(circle at 75% 75%, white 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2">
          <Utensils className="h-7 w-7" />
          <span className="font-display text-2xl font-bold tracking-tight">QRDineX</span>
        </div>

        {/* Headline */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-3">
            <p className="font-display text-4xl font-bold leading-tight tracking-tight">
              Welcome back.
              <br />
              <span className="opacity-80">Your restaurant awaits.</span>
            </p>
            <p className="max-w-xs text-sm leading-relaxed opacity-75">
              Sign in to manage your tables, update your menu, and serve customers
              faster with QRDineX.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2">
            {FEATURES.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur-sm"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <p className="relative z-10 text-xs opacity-60">
          © {new Date().getFullYear()} QRDineX. All rights reserved.
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* RIGHT PANEL — Form */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-8 lg:px-12">
        {/* Mobile logo */}
        <div className="mb-10 flex items-center gap-2 lg:hidden">
          <Utensils className="h-6 w-6 text-primary" />
          <span className="font-display text-xl font-bold tracking-tight">QRDineX</span>
        </div>

        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="mb-8 space-y-1.5">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Sign in
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your email and password to access your dashboard.
            </p>
          </div>

          {/* Form */}
          <LoginForm />

          {/* Footer */}
          <p className="mt-10 text-center text-xs text-muted-foreground">
            By signing in, you agree to our{' '}
            <Link href="#" className="underline underline-offset-4 hover:text-foreground">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="#" className="underline underline-offset-4 hover:text-foreground">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
