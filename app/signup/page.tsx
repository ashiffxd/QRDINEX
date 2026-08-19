import type { Metadata } from 'next'
import Link from 'next/link'
import { Utensils } from 'lucide-react'
import { SignupForm } from '@/components/auth/SignupForm'

// ---------------------------------------------------------------------------
// SEO
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: 'Register Your Restaurant — QRDineX',
  description:
    'Create a QRDineX account for your restaurant. Get digital menus, QR table ordering, and complete restaurant management in one platform.',
}

// ---------------------------------------------------------------------------
// PAGE
// ---------------------------------------------------------------------------

export default function SignupPage() {
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

        {/* Background pattern */}
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
        <Link href="/" className="relative z-10 flex items-center hover:opacity-90 transition-opacity">
          <img src="/logo.png" alt="QRDineX Logo" className="h-9 w-auto object-contain shadow-sm" />
        </Link>

        {/* Headline */}
        <div className="relative z-10 space-y-6">
          <blockquote className="space-y-3">
            <p className="font-display text-4xl font-bold leading-tight tracking-tight">
              Your restaurant,
              <br />
              <span className="opacity-80">fully digital.</span>
            </p>
            <p className="max-w-xs text-base leading-relaxed opacity-75">
              Join thousands of restaurant owners who use QRDineX to manage
              tables, serve customers faster, and grow their business.
            </p>
          </blockquote>

          {/* Feature list */}
          <ul className="space-y-3 text-sm">
            {[
              'QR code table ordering — zero app downloads',
              'Real-time order management dashboard',
              'Digital menu with instant updates',
              'Complete dining session tracking',
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-2 opacity-90">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                  ✓
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom note */}
        <p className="relative z-10 text-xs opacity-60">
          © {new Date().getFullYear()} QRDineX. All rights reserved.
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* RIGHT PANEL — Form */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-1 flex-col items-center justify-start overflow-y-auto px-4 py-10 sm:px-8 lg:px-12">
        {/* Mobile logo */}
        <Link href="/" className="mb-8 flex items-center lg:hidden hover:opacity-90 transition-opacity">
          <img src="/logo.png" alt="QRDineX Logo" className="h-8 w-auto object-contain shadow-sm" />
        </Link>

        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="mb-8 space-y-1">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Register your restaurant
            </h1>
            <p className="text-sm text-muted-foreground">
              Fill in the details below. Your account will be reviewed and activated by our team.
            </p>
          </div>

          {/* Pending approval notice */}
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/50 dark:bg-white">
            <span className="mt-0.5 text-amber-600 dark:text-amber-400" aria-hidden="true">
              ⏳
            </span>
            <div className="space-y-0.5">
              <p className="font-display text-sm font-medium text-amber-800 dark:text-black-300">
                Approval Required
              </p>
              <p className="text-xs leading-relaxed text-amber-700 dark:text-black">
                New restaurant accounts are reviewed by our team before activation.
                You will receive access once your registration is approved.
              </p>
            </div>
          </div>

          {/* The form */}
          <SignupForm />

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-muted-foreground">
            By registering, you agree to our{' '}
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
