'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import {
  ArrowLeft, Utensils, Heart, ShieldCheck, Zap, Clock, Users,
  Sun, Moon, Award, Target, Eye
} from 'lucide-react'
import Link from 'next/link'

// --- Theme Toggle (copied from main page) --------------------------------
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
    <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600&family=Outfit:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .font-display { font-family: 'Space Grotesk', sans-serif; }
        .font-nav { font-family: 'Outfit', sans-serif; letter-spacing: 0.02em; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { opacity: 0; animation: fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) forwards; }
        .d1 { animation-delay: 0.05s; }
        .d2 { animation-delay: 0.2s; }
        .d3 { animation-delay: 0.35s; }
      `}</style>

      {/* Floating Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4 pointer-events-none">
        <nav
          className="pointer-events-auto flex items-center gap-2 rounded-full px-5 py-2.5 bg-white/20 dark:bg-slate-900/70 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.18)] border border-white/30 dark:border-white/10 transition-all duration-500"
        >
          {/* Back link */}
          <Link href="/" className="flex items-center gap-1.5 pr-3 sm:pr-4 border-r border-white/25 dark:border-white/15 mr-1 font-nav text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Home</span>
          </Link>

          <div className="flex items-center mr-2">
            <img src="/logo.png" alt="QRDineX Logo" className="h-8 w-auto object-contain shadow-sm" />
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />
        </nav>
      </header>

      <main className="flex-1 pt-32 pb-24">
        <div className="mx-auto max-w-4xl px-4 md:px-6">
          
          {/* Hero Header */}
          <div className="text-center max-w-2xl mx-auto">
            <p className="font-mono text-xs sm:text-sm font-semibold uppercase tracking-widest text-teal-600 dark:text-teal-400 animate-fade-up d1">
              About QRDineX
            </p>
            <h1 className="font-display mt-4 text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.1] animate-fade-up d2">
              Transforming the way we <span className="bg-gradient-to-r from-teal-600 via-emerald-500 to-sky-400 bg-clip-text text-transparent">dine out</span>
            </h1>
            <p className="mt-6 text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-400 italic animate-fade-up d3">
              "Skip the Wait, Enjoy the Plate" — Our goal is to connect diners and kitchens seamlessly, eliminating friction and boosting hospitality.
            </p>
          </div>

          <hr className="my-16 border-slate-200 dark:border-slate-800" />

          {/* 3 Pillars Section */}
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="flex flex-col items-center text-center p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/60 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 mb-4">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">Our Mission</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Empowering venues to focus on high-touch hospitality by automating low-touch operations.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/60 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 mb-4">
                <Eye className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">Our Vision</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                A world where dining out is completely seamless, zero-wait, and personalized for every guest.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/50 dark:border-slate-800/60 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 mb-4">
                <Award className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">Our Values</h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Built on speed, data privacy, and a deep appreciation for culinary operations.
              </p>
            </div>
          </div>

          {/* Story Content Block */}
          <div className="mt-16 bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-8 border border-slate-200/60 dark:border-slate-800/80">
            <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">The QRDineX Story</h2>
            <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-400">
              Founded in 2026, QRDineX emerged from a simple dining frustration: waiting 15 minutes just to catch a waiter's eye, place an order, or pay the bill. We realized that while mobile web technology had advanced, the in-restaurant dining journey was still stuck in the paper era.
            </p>
            <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-400">
              We built QRDineX as a lightweight, no-install platform that gives guests immediate access to visual ordering, group cart collaboration, and instant billing directly on their device. Today, cafes, bistros, and high-volume dining rooms use QRDineX to slash wait times, boost staff efficiency, and increase average ticket sizes by up to 18% through beautiful, high-res digital menus.
            </p>
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
