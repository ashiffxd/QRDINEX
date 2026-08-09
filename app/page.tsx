'use client'

import { useState, useEffect, useRef } from 'react'
import {
  ArrowRight, Utensils, QrCode, LineChart, ShieldCheck,
  ChefHat, Boxes, Wifi, ScanLine, ClipboardList, Bell,
} from 'lucide-react'

// --- Scroll-reveal hook -------------------------------------------------
function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.unobserve(node) } },
      { threshold: 0.15 }
    )
    obs.observe(node)
    return () => obs.disconnect()
  }, [])
  return [ref, inView] as const
}

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [ref, inView] = useReveal()
  return (
    <div ref={ref} className={className} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? 'translateY(0)' : 'translateY(24px)',
      transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
    }}>
      {children}
    </div>
  )
}

// --- Data ---------------------------------------------------------------
const steps = [
  { num: '01', icon: ScanLine,     title: 'Guest scans the table code',  desc: "Each table gets its own code. No app, no login — the menu opens straight in the browser." },
  { num: '02', icon: ClipboardList, title: 'Order fires to the kitchen',  desc: "The order lands on the kitchen screen the moment it's placed, itemised and table-tagged." },
  { num: '03', icon: Bell,          title: 'Staff serve, not scribble',   desc: "Your team spends their time at the table, not relaying orders back and forth on paper." },
]

const features = [
  { icon: QrCode,      title: 'QR Menus & Ordering',      desc: 'Generate a unique code per table. Guests browse and order directly from their phones.' },
  { icon: ChefHat,     title: 'Kitchen Display Routing',   desc: 'Orders route straight to the kitchen screen, grouped by table and course.' },
  { icon: LineChart,   title: 'Real-Time Dashboard',       desc: 'Watch active tables, incoming orders, and daily revenue update live.' },
  { icon: ShieldCheck, title: 'Role-Based Access',         desc: 'Owners and staff get exactly the permissions they need.' },
  { icon: Boxes,       title: 'Menu & Inventory Sync',     desc: '86 an item and it disappears from every table instantly.' },
  { icon: Wifi,        title: 'Works on Any Phone',        desc: 'No app to download. Every menu opens in a browser guests already carry.' },
]

// --- Page ---------------------------------------------------------------
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .font-display { font-family: 'Space Grotesk', sans-serif; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-in { opacity: 0; animation: fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) forwards; }
        .d1 { animation-delay: 0.05s; }
        .d2 { animation-delay: 0.22s; }
        .d3 { animation-delay: 0.38s; }
      `}</style>

      {/* Nav */}
      <header className={`sticky top-0 z-50 flex h-16 items-center px-4 lg:px-8 transition-all duration-300 backdrop-blur-xl border-b ${
        scrolled ? 'bg-white/85 shadow-sm border-slate-200' : 'bg-white/50 border-white/40'
      }`}>
        <a href="/" className="flex items-center gap-2">
          <Utensils className="h-5 w-5 text-blue-700" />
          <span className="font-display text-xl font-bold tracking-tight">QRDineX</span>
        </a>
        <nav className="ml-auto flex items-center gap-6">
          <a href="#how-it-works" className="hidden sm:block text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">How it works</a>
          <a href="#features"     className="hidden sm:block text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">Features</a>
          <a href="/login"        className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">Login</a>
          <a href="/signup" className="inline-flex h-9 items-center rounded-md bg-blue-700 px-4 text-sm font-semibold text-white shadow hover:-translate-y-0.5 hover:shadow-md transition-all">
            Start Free Trial
          </a>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative w-full h-[calc(100vh-4rem)] overflow-hidden">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=2400')" }} />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/60 to-slate-900/85" />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
            <h1 className={`font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white ${mounted ? 'hero-in d1' : 'opacity-0'}`}>
              QRDineX
            </h1>
            <div className={`mt-5 flex items-center gap-3 text-[11px] sm:text-sm uppercase tracking-[0.2em] text-sky-400 font-mono ${mounted ? 'hero-in d2' : 'opacity-0'}`}>
              <span className="h-px w-8 bg-white/30" />
              = Scan · Order · Dine =
              <span className="h-px w-8 bg-white/30" />
            </div>
          </div>
          <p className="absolute bottom-3 right-4 font-mono text-[10px] text-white/40">Photo: Jay Wennington / Unsplash</p>
        </section>


        {/* How it works */}
        <section id="how-it-works" className="w-full py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <Reveal className="max-w-2xl">
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-blue-700">How it works</p>
              <h2 className="font-display mt-3 text-3xl font-bold tracking-tight md:text-4xl">From scan to served, three steps</h2>
            </Reveal>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {steps.map(({ num, icon: Icon, title, desc }, i) => (
                <Reveal key={num} delay={i * 120}>
                  <div className="h-full rounded-xl border border-slate-100 bg-white p-6 shadow-sm hover:-translate-y-1.5 hover:shadow-md hover:border-blue-100 transition-all">
                    <span className="font-mono text-xs font-semibold text-blue-700">TICKET {num}</span>
                    <div className="mt-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                      <Icon className="h-5 w-5 text-blue-700" />
                    </div>
                    <h3 className="font-display mt-4 text-lg font-semibold">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">{desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="w-full bg-slate-50 py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <Reveal className="max-w-2xl">
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-blue-700">Everything included</p>
              <h2 className="font-display mt-3 text-3xl font-bold tracking-tight md:text-4xl">Everything you need to run your restaurant</h2>
              <p className="mt-3 text-base text-slate-500">QRDineX streamlines operations, cuts wait times, and keeps every table, order, and role in sync.</p>
            </Reveal>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, desc }, i) => (
                <Reveal key={title} delay={(i % 3) * 100}>
                  <div className="h-full rounded-xl border border-slate-100 bg-white p-6 shadow-sm hover:-translate-y-1.5 hover:shadow-md hover:border-blue-100 transition-all">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                      <Icon className="h-5 w-5 text-blue-700" />
                    </div>
                    <h3 className="font-display mt-4 text-lg font-semibold">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">{desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA banner */}
        <section className="w-full py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <Reveal>
              <div className="relative flex flex-col items-center gap-6 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 to-blue-900 px-8 py-12 text-center md:flex-row md:justify-between md:text-left">
                <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                <div className="relative">
                  <h2 className="font-display text-2xl font-bold text-white md:text-3xl">Put a code on every table, today.</h2>
                  <p className="mt-2 text-sm text-blue-100">Free trial, no card required — see your first order fire in minutes.</p>
                </div>
                <a href="/signup" className="relative inline-flex h-11 shrink-0 items-center rounded-md bg-white px-7 text-sm font-semibold text-blue-700 hover:-translate-y-0.5 hover:shadow-lg transition-all">
                  Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="flex w-full flex-col items-center gap-2 border-t border-slate-100 px-4 py-6 sm:flex-row md:px-8">
        <p className="text-xs text-slate-500">© {new Date().getFullYear()} QRDineX. All rights reserved.</p>
        <nav className="flex gap-4 sm:ml-auto sm:gap-6">
          <a href="#" className="text-xs text-slate-500 hover:text-slate-900 transition-colors">Terms of Service</a>
          <a href="#" className="text-xs text-slate-500 hover:text-slate-900 transition-colors">Privacy</a>
        </nav>
      </footer>
    </div>
  )
}