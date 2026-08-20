'use client'

import { useState, useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'
import {
  ArrowLeft, Utensils, Heart, ShieldCheck, Zap, Clock, Users,
  Sun, Moon, Award, Target, Eye, BarChart3, Globe, Sparkles, ChevronDown, Linkedin
} from 'lucide-react'
import Link from 'next/link'

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

// --- Theme Toggle --------------------------------
function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="h-8 w-8" />

  const isDark = theme === 'dark'
  return (
    <button
      id="theme-toggle"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="relative h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300 ml-1 hover:scale-110 active:scale-95 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-slate-600 dark:text-amber-300"
    >
      <Sun
        className="h-3.5 w-3.5 absolute transition-all duration-500"
        style={{ opacity: isDark ? 0 : 1, transform: isDark ? 'rotate(-90deg) scale(0)' : 'rotate(0deg) scale(1)' }}
      />
      <Moon
        className="h-3.5 w-3.5 absolute transition-all duration-500"
        style={{ opacity: isDark ? 1 : 0, transform: isDark ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0)' }}
      />
    </button>
  )
}

export default function AboutPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div className="relative overflow-hidden min-h-screen flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .font-display { font-family: 'Space Grotesk', sans-serif; }
        .font-nav { font-family: 'Outfit', sans-serif; letter-spacing: 0.02em; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { opacity: 0; animation: fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) forwards; }
        .d1 { animation-delay: 0.05s; }
        .d2 { animation-delay: 0.15s; }
        .d3 { animation-delay: 0.25s; }
        .d4 { animation-delay: 0.35s; }
        .d5 { animation-delay: 0.45s; }
        .d6 { animation-delay: 0.55s; }
      `}</style>

      {/* Decorative Blur Background Circles */}
      <div className="absolute top-1/4 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/10 blur-[130px] dark:bg-teal-500/5" />
      <div className="absolute bottom-1/4 left-1/3 -z-10 h-[450px] w-[450px] rounded-full bg-indigo-500/10 blur-[160px] dark:bg-indigo-500/5" />
      <div className="absolute top-3/4 right-1/4 -z-10 h-80 w-80 rounded-full bg-emerald-500/5 blur-[120px]" />

      {/* Floating Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4 pointer-events-none">
        <nav
          className="pointer-events-auto flex items-center gap-2 rounded-full px-5 py-2.5 bg-white/30 dark:bg-slate-900/60 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] border border-white/20 dark:border-white/5 hover:border-white/40 dark:hover:border-white/10 transition-all duration-300"
        >
          {/* Back link */}
          <Link href="/" className="flex items-center gap-1.5 pr-3 sm:pr-4 border-r border-white/25 dark:border-white/15 mr-1 font-nav text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Home</span>
          </Link>

          <div className="flex items-center mr-2">
            <img src="/logo.png" alt="QRDineX Logo" className="h-8 w-auto object-contain" />
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />
        </nav>
      </header>

      <main className="flex-1">

        {/* ── Full-screen Hero ───────────────────────────────────────── */}
        <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 bg-slate-950 overflow-hidden">
          {/* Ambient blobs */}
          <div className="absolute top-1/3 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/10 blur-[130px]" />
          <div className="absolute bottom-1/4 left-1/3 -z-10 h-[450px] w-[450px] rounded-full bg-indigo-500/10 blur-[160px]" />
          <div className="absolute top-3/4 right-1/4 -z-10 h-80 w-80 rounded-full bg-emerald-500/5 blur-[120px]" />

          <div className="max-w-3xl mx-auto animate-fade-up d1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-400 mb-6">
              <Sparkles className="h-3 w-3" />
              <span>Meet QRDineX</span>
            </div>
            <h1 className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.05] animate-fade-up d2">
              Transforming the way we{' '}
              <span className="bg-gradient-to-r from-teal-500 via-emerald-400 to-sky-400 bg-clip-text text-transparent">
                dine out
              </span>
            </h1>
            <p className="mt-6 text-sm sm:text-lg leading-relaxed text-slate-400 max-w-2xl mx-auto animate-fade-up d3 font-mono tracking-tight">
  "Skip the Wait, Enjoy the Plate" — We build lightweight, zero-install software that connects diners and kitchens in real time.
</p>
          </div>

          {/* Divider with team intro */}
          <div className="mt-20 animate-fade-up d4">
            <p className="font-mono text-xs font-semibold uppercase tracking-widest text-teal-500 mb-3">
              The People Behind It
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
              Meet the Team
            </h2>
            <p className="mt-3 text-sm text-slate-400 max-w-md mx-auto">
              A small team with a big mission — making restaurant tech accessible to every owner.
            </p>
          </div>

          {/* Scroll-down cue */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
            <span className="text-xs text-slate-500 uppercase tracking-widest">Scroll</span>
            <ChevronDown className="h-5 w-5 text-slate-500" />
          </div>
        </section>


        {/* ── Person 1: image LEFT, quote RIGHT ─────────────────────── */}
        <div
          className="min-h-screen flex items-center border-t border-slate-100 dark:border-slate-800/60 transition-colors duration-300"
          style={{
            backgroundColor: '#ffffff',
            backgroundImage: [
              'linear-gradient(to right, #f0f0f0 1px, transparent 1px)',
              'linear-gradient(to bottom, #f0f0f0 1px, transparent 1px)',
              'radial-gradient(circle 600px at 0% 200px, #d5c5ff, transparent)',
              'radial-gradient(circle 600px at 100% 200px, #d5c5ff, transparent)',
            ].join(', '),
            backgroundSize: '20px 20px, 20px 20px, 100% 100%, 100% 100%',
          }}
        >
          <div className="mx-auto max-w-6xl w-full px-6 md:px-10 py-20 flex flex-col md:flex-row items-center gap-12 md:gap-20">

            {/* Image — left */}
            <Reveal className="relative flex-shrink-0 w-64 h-64 md:w-80 md:h-80" delay={50}>
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-teal-500 to-emerald-400 blur-2xl opacity-20 scale-110" />
              <img
                src="/team/founder.png"
                alt="Ashan Shrestha"
                className="relative w-full h-full rounded-3xl object-cover shadow-2xl ring-1 ring-slate-200 dark:ring-slate-700"
                onError={(e) => {
                  const t = e.currentTarget as HTMLImageElement
                  t.style.display = 'none'
                  const fb = t.nextElementSibling as HTMLElement
                  if (fb) fb.style.display = 'flex'
                }}
              />
              {/* Fallback */}
              <div style={{ display: 'none' }} className="relative w-full h-full rounded-3xl bg-gradient-to-br from-teal-500 to-emerald-400 shadow-2xl items-center justify-center text-white text-7xl font-bold">
                A
              </div>
            </Reveal>

            {/* Quote — right */}
            <Reveal className="flex-1" delay={150}>
              <span className="inline-block rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-1 text-xs font-semibold text-white shadow-sm mb-5">
                Founder
              </span>
             <h3 className="font-display text-3xl md:text-4xl font-bold text-[#8B4513] leading-tight">
                  Sarfaraz Alam
                </h3>
              <div className="mt-6 relative">
                <span className="absolute -top-4 -left-3 text-7xl text-teal-400/30 dark:text-teal-500/20 font-serif leading-none select-none">"</span>
                <p className="relative text-lg md:text-xl leading-relaxed bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 bg-clip-text text-transparent italic px-6">
                  Visionary behind QRDineX. Passionate about bridging technology and hospitality to transform how restaurants operate.
                </p>
                <span className="absolute -bottom-8 -right-3 text-7xl text-teal-400/30 dark:text-teal-500/20 font-serif leading-none select-none rotate-180">"</span>
              </div>
              <div className="mt-10 h-px w-16 bg-gradient-to-r from-teal-500 to-transparent" />
            </Reveal>
          </div>
        </div>

        {/* ── Person 2: quote LEFT, image RIGHT ─────────────────────── */}
        <div className="relative min-h-screen flex items-center border-t border-slate-100 dark:border-slate-800/60 transition-colors duration-300 overflow-hidden">
          {/* Background layer — mask only clips this div, not the content */}
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: '#f9fafb',
              backgroundImage: [
                'linear-gradient(to right, #d1d5db 1px, transparent 1px)',
                'linear-gradient(to bottom, #d1d5db 1px, transparent 1px)',
              ].join(', '),
              backgroundSize: '32px 32px',
              WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 0% 0%, #000 50%, transparent 90%)',
              maskImage: 'radial-gradient(ellipse 80% 80% at 0% 0%, #000 50%, transparent 90%)',
            }}
          />
          {/* Content sits fully above the masked background */}
          <div className="relative z-10 mx-auto max-w-5xl w-full px-6 md:px-10 py-20 flex flex-col md:items-end md:text-right text-left">

            {/* Quote container */}
            <Reveal className="w-full max-w-3xl flex flex-col md:items-end" delay={150}>
              <span className="inline-block rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-1 text-xs font-semibold text-white shadow-sm mb-5">
                Lead Developer
              </span>
              
              <h3 className="font-display text-3xl md:text-4xl font-bold text-slate-900 dark:text-white leading-tight">
                Ashif Ansari
              </h3>
              
              <div className="mt-6 relative w-full">
                <span className="absolute -top-4 -left-3 text-7xl text-sky-400/30 dark:text-sky-500/20 font-serif leading-none select-none">"</span>
                <p className="relative text-lg md:text-xl leading-relaxed text-slate-600 dark:text-slate-300 italic px-6 md:pl-12 md:pr-6">
                  Architects the platform from the ground up. Obsessed with performance, clean code, and shipping features that actually matter.
                </p>
                <span className="absolute -bottom-8 -right-3 text-7xl text-sky-400/30 dark:text-sky-500/20 font-serif leading-none select-none rotate-180">"</span>
              </div>

              {/* More info to fill empty space */}
              <div className="mt-8 max-w-2xl text-slate-500 dark:text-slate-400 font-mono text-sm leading-relaxed tracking-tight space-y-4">
                <p>
                  As the primary engineer of QRDineX, Ashif is responsible for scaling the system's real-time communication pipeline. He built the zero-install web interface from scratch, focusing on sub-second rendering speeds and robust state sync between customer menus and kitchen displays.
                </p>
                <p>
                  Specializing in React, Next.js, and event-driven Node.js web sockets, his goal is to make dining out friction-free by ensuring no order is ever missed or delayed.
                </p>
              </div>

              {/* Tech Stack Tags / Key Specs */}
              <div className="mt-6 flex flex-wrap gap-2 justify-start md:justify-end">
                {['Next.js / React', 'Node.js', 'Socket.io', 'TailwindCSS', 'PostgreSQL', 'Real-time Sync'].map((tech) => (
                  <span
                    key={tech}
                    className="inline-flex items-center rounded-lg bg-slate-100 dark:bg-slate-900/80 px-2.5 py-1 text-xs font-medium text-slate-650 dark:text-slate-400 border border-slate-200/50 dark:border-slate-800"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex justify-start md:justify-end">
                <a
                  href="https://www.linkedin.com/in/ashif-ansari-7b4191262/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 dark:border-sky-500/20 bg-sky-500/10 hover:bg-sky-500/20 dark:bg-sky-500/5 dark:hover:bg-sky-500/10 px-4 py-2 text-xs font-semibold text-sky-600 dark:text-sky-400 transition-all hover:scale-105 active:scale-95 shadow-sm"
                >
                  <Linkedin className="h-3.5 w-3.5" />
                  <span>Connect on LinkedIn</span>
                </a>
              </div>
              <div className="mt-10 h-px w-16 bg-gradient-to-r from-sky-500 to-transparent mx-auto md:mr-0 mr-auto" />
            </Reveal>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 md:px-6">{/* reopen max-w-5xl */}

          {/* Core Impact Statistics */}
          <div className="mt-16 grid gap-4 grid-cols-2 lg:grid-cols-4 animate-fade-up d4">
            <div className="group relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-teal-500/20 hover:bg-slate-50 dark:hover:bg-slate-900/80">
              <p className="text-3xl sm:text-4xl font-extrabold text-teal-600 dark:text-teal-400">15m+</p>
              <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">Avg. Wait Time Saved</p>
              <p className="mt-1 text-[11px] text-muted-foreground leading-normal">Per customer dining session.</p>
            </div>
            <div className="group relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-teal-500/20 hover:bg-slate-50 dark:hover:bg-slate-900/80">
              <p className="text-3xl sm:text-4xl font-extrabold text-teal-600 dark:text-teal-400">+18%</p>
              <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">Average Order Value</p>
              <p className="mt-1 text-[11px] text-muted-foreground leading-normal">Boosted via visual menus.</p>
            </div>
            <div className="group relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-teal-500/20 hover:bg-slate-50 dark:hover:bg-slate-900/80">
              <p className="text-3xl sm:text-4xl font-extrabold text-teal-600 dark:text-teal-400">Zero</p>
              <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">App Installs Required</p>
              <p className="mt-1 text-[11px] text-muted-foreground leading-normal">Scans instantly in browser.</p>
            </div>
            <div className="group relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-teal-500/20 hover:bg-slate-50 dark:hover:bg-slate-900/80">
              <p className="text-3xl sm:text-4xl font-extrabold text-teal-600 dark:text-teal-400">99.9%</p>
              <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">Socket.io Uptime</p>
              <p className="mt-1 text-[11px] text-muted-foreground leading-normal">Bulletproof kitchen sync.</p>
            </div>
          </div>

          <hr className="my-16 border-slate-200 dark:border-slate-800/50" />

          {/* 3 Pillars Section */}
          <div className="grid gap-8 sm:grid-cols-3 animate-fade-up d5">
            <div className="group flex flex-col items-center text-center p-6 bg-slate-50/40 dark:bg-slate-900/20 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm hover:border-teal-500/30 transition-all duration-300 hover:-translate-y-1">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 mb-5 shadow-sm group-hover:scale-110 transition-transform duration-300">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">Our Mission</h3>
              <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Empower restaurants to deliver high-touch hospitality by automating time-consuming transactional operations.
              </p>
            </div>

            <div className="group flex flex-col items-center text-center p-6 bg-slate-50/40 dark:bg-slate-900/20 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm hover:border-teal-500/30 transition-all duration-300 hover:-translate-y-1">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 mb-5 shadow-sm group-hover:scale-110 transition-transform duration-300">
                <Eye className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">Our Vision</h3>
              <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Build a world where eating out is friction-free, social, and perfectly synchronized from dining room to kitchen.
              </p>
            </div>

            <div className="group flex flex-col items-center text-center p-6 bg-slate-50/40 dark:bg-slate-900/20 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm hover:border-teal-500/30 transition-all duration-300 hover:-translate-y-1">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 mb-5 shadow-sm group-hover:scale-110 transition-transform duration-300">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">Our Values</h3>
              <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Prioritizing lightning speed, diner privacy, and robust reliability to support fast-paced culinary service.
              </p>
            </div>
          </div>

          {/* Interactive Timeline Section */}
          <div className="mt-24 animate-fade-up d6">
            <div className="text-center">
              <h2 className="font-display text-3xl font-bold text-slate-900 dark:text-white">Evolution Timeline</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Our journey from a simple dining room frustration to a robust SaaS platform.</p>
            </div>

            <div className="mt-12 relative border-l border-slate-200 dark:border-slate-800/80 ml-4 md:ml-12 space-y-10">
              {/* Timeline Item 1 */}
              <div className="relative pl-8 md:pl-12 group">
                {/* Dot */}
                <div className="absolute -left-[9px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-950 border-2 border-teal-600 dark:border-teal-400 group-hover:bg-teal-500 transition-colors duration-300" />
                <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 p-6 transition-all duration-300 group-hover:border-teal-500/20 group-hover:bg-slate-50 dark:group-hover:bg-slate-900/60">
                  <span className="inline-block rounded-md bg-teal-100 dark:bg-teal-950 px-2 py-0.5 text-xs font-bold text-teal-600 dark:text-teal-400">2025</span>
                  <h4 className="mt-2 text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock className="h-4 w-4 text-teal-500" />
                    The Friction Spotted
                  </h4>
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Experiencing frustrating delays in busy bistros just to order or pay inspired us. We realized that paper menus and manual billing belong in the past, and mobile technology should unlock a smoother experience.
                  </p>
                </div>
              </div>

              {/* Timeline Item 2 */}
              <div className="relative pl-8 md:pl-12 group">
                {/* Dot */}
                <div className="absolute -left-[9px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-950 border-2 border-teal-600 dark:border-teal-400 group-hover:bg-teal-500 transition-colors duration-300" />
                <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 p-6 transition-all duration-300 group-hover:border-teal-500/20 group-hover:bg-slate-50 dark:group-hover:bg-slate-900/60">
                  <span className="inline-block rounded-md bg-teal-100 dark:bg-teal-950 px-2 py-0.5 text-xs font-bold text-teal-600 dark:text-teal-400">Early 2026</span>
                  <h4 className="mt-2 text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Zap className="h-4 w-4 text-teal-500" />
                    Real-Time Engineering
                  </h4>
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Designed and engineered a zero-install browser environment using Socket.io and Next.js. We introduced shared multi-device dining carts, so group diners could add items, coordinate orders, and call service together.
                  </p>
                </div>
              </div>

              {/* Timeline Item 3 */}
              <div className="relative pl-8 md:pl-12 group">
                {/* Dot */}
                <div className="absolute -left-[9px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-950 border-2 border-teal-600 dark:border-teal-400 group-hover:bg-teal-500 transition-colors duration-300" />
                <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 p-6 transition-all duration-300 group-hover:border-teal-500/20 group-hover:bg-slate-50 dark:group-hover:bg-slate-900/60">
                  <span className="inline-block rounded-md bg-teal-100 dark:bg-teal-950 px-2 py-0.5 text-xs font-bold text-teal-600 dark:text-teal-400">Mid 2026</span>
                  <h4 className="mt-2 text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Globe className="h-4 w-4 text-teal-500" />
                    Going Live & Launch
                  </h4>
                  <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Rolled out QRDineX to busy cafes, high-volume dining rooms, and lounges. We integrated automated table statuses, a visual Kitchen Display System (KDS), and secure billing options, helping hosts run smarter dining floors.
                  </p>
                </div>
              </div>
            </div>
          </div>


        </div>
      </main>

      <footer className="flex w-full flex-col items-center gap-2 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-6 sm:flex-row md:px-8 transition-colors duration-300">
        <p className="text-xs text-slate-500 dark:text-slate-400">© {new Date().getFullYear()} QRDineX. All rights reserved.</p>
        <nav className="flex gap-4 sm:ml-auto sm:gap-6">
          <Link href="/" className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Home</Link>
          <a href="#" className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Terms of Service</a>
          <a href="#" className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Privacy</a>
        </nav>
      </footer>
    </div>
  )
}
