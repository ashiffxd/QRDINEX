'use client'

import { useState, useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'
import {
  ArrowRight, Utensils, QrCode, LineChart, ShieldCheck,
  ChefHat, Boxes, Wifi, ScanLine, ClipboardList, Bell,
  Sun, Moon, Check, X, Star, Calculator, HelpCircle,
  TrendingUp, Users, IndianRupee, Sparkles, ChevronDown, Zap
  , ChevronLeft, ChevronRight , Smartphone
} from 'lucide-react'



interface TypewriterTextProps {
  text: string
  speed?: number
  delay?: number
  className?: string
  showCursor?: boolean
}

export function TypewriterText({
  text,
  speed = 35,
  delay = 200,
  className = '',
  showCursor = true,
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [hasTriggered, setHasTriggered] = useState(false)
  const containerRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasTriggered) {
          setHasTriggered(true)
        }
      },
      { threshold: 0.2 }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [hasTriggered])

  useEffect(() => {
    if (!hasTriggered) return

    let currentIndex = 0
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        if (currentIndex <= text.length) {
          setDisplayedText(text.slice(0, currentIndex))
          currentIndex++
        } else {
          clearInterval(interval)
        }
      }, speed)

      return () => clearInterval(interval)
    }, delay)

    return () => clearTimeout(timeout)
  }, [hasTriggered, text, speed, delay])

  return (
    <span ref={containerRef} className={`inline-block ${className}`}>
      {displayedText}
      {showCursor && hasTriggered && displayedText.length < text.length && (
        <span className="inline-block animate-pulse text-blue-600 dark:text-blue-400 font-normal ml-0.5">
          |
        </span>
      )}
    </span>
  )
}
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

// --- Theme Toggle -------------------------------------------------------
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
      className="relative h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300 ml-1 hover:scale-110 active:scale-95 bg-black/8 dark:bg-white/10 hover:bg-black/15 dark:hover:bg-white/20 text-slate-600 dark:text-amber-300"
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

// --- Data ---------------------------------------------------------------
const metrics = [
  { value: '+35%', label: 'Faster Table Turnover', icon: TrendingUp },
  { value: '150k+', label: 'Orders Processed Monthly', icon: Users },
  { value: '₹0', label: 'Paper Reprinting Costs', icon: IndianRupee },
  { value: '99.9%', label: 'Guaranteed System Uptime', icon: Zap },
]

const steps = [
  { num: '01', icon: ScanLine,      title: 'Guest scans the table code', desc: "Each table gets its own code. No app, no login — the menu opens straight in the browser." },
  { num: '02', icon: ClipboardList, title: 'Order fires to the kitchen',  desc: "The order lands on the kitchen screen the moment it's placed, itemised and table-tagged." },
  { num: '03', icon: Bell,          title: 'Staff serve, not scribble',   desc: "Your team spends their time at the table, not relaying orders back and forth on paper." },
]

const features = [
  { icon: QrCode,      title: 'QR Menus & Ordering',    desc: 'Generate a unique code per table. Guests browse and order directly from their phones.' },
  { icon: ChefHat,     title: 'Kitchen Display Routing', desc: 'Orders route straight to the kitchen screen, grouped by table and course.' },
  { icon: LineChart,   title: 'Real-Time Dashboard',     desc: 'Watch active tables, incoming orders, and daily revenue update live.' },
  { icon: ShieldCheck, title: 'Role-Based Access',       desc: 'Owners and staff get exactly the permissions they need.' },
  { icon: Boxes,       title: 'Menu & Inventory Sync',   desc: '86 an item and it disappears from every table instantly.' },
  { icon: Wifi,        title: 'Works on Any Phone',      desc: 'No app to download. Every menu opens in a browser guests already carry.' },
]

const comparisonData = [
  { feature: 'Order Placement Speed', paper: '5–10 mins waiting for staff', qrdinex: 'Instant (< 30 seconds)' },
  { feature: 'Menu Updates & 86ing', paper: 'Cross off paper or reprint menu', qrdinex: '1-click real-time sync across all tables' },
  { feature: 'Upselling & Visuals', paper: 'Text-only descriptions on paper', qrdinex: 'High-res food images & auto-upsells (+18% ticket)' },
  { feature: 'Guest Experience', paper: 'Waving at busy staff for bill/order', qrdinex: 'Order & pay seamlessly from phone' },
  { feature: 'App Download Required', paper: 'No app needed', qrdinex: 'No app needed (Web QR)' },
  { feature: 'Staff Allocation', paper: 'Tied up taking & bringing orders', qrdinex: 'Focused on hospitality & faster turnover' },
]

const testimonials = [
  {
    quote: "QRDineX cut our guest wait times in half during Friday dinner rushes. Kitchen chaos completely disappeared.",
    author: "Chef Marco Vance",
    role: "Head Chef & Co-owner",
    restaurant: "The Bistro Taphouse",
    rating: 5,
  },
  {
    quote: "Our average ticket size went up by 22% within two weeks. People order more when they can see photo previews!",
    author: "Sarah Jenkins",
    role: "General Manager",
    restaurant: "Seaside Grill & Bar",
    rating: 5,
  },
  {
    quote: "Setup took under 20 minutes. We generated table QRs, uploaded our menu, and fired our first real order the same night.",
    author: "Liam O'Connor",
    role: "Operations Lead",
    restaurant: "Craft & Roast Cafe",
    rating: 5,
  },
]

// --- Data (Place with your other data constants) -----------------------
const pricingPlans = [
  {
    name: 'Starter',
    desc: 'Perfect for small cafes & pop-up food spots.',
    monthlyPrice: 299,
    annualPrice: 239,
    features: [
      'Up to 15 Active Tables',
      'Instant Web QR Menus',
      'Basic Order Routing',
      'Daily Revenue Reports',
      'Email Support',
    ],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Pro',
    desc: 'Ideal for busy restaurants, bars & bistros.',
    monthlyPrice: 599,
    annualPrice: 479,
    features: [
      'Unlimited Active Tables',
      'Kitchen Display System (KDS)',
      'Real-Time Menu & 86 Inventory Sync',
      'Visual Upselling & High-Res Photos',
      'Multi-Staff Role Access',
      'Priority 24/7 Support',
    ],
    cta: 'Start 14-Day Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    desc: 'Designed for multi-location restaurant chains.',
    monthlyPrice: 999,
    annualPrice: 799,
    features: [
      'Multi-Location Central Control',
      'Custom POS & Printer Integration',
      'Dedicated Account Manager',
      'Custom Branding & QR Styling',
      'Advanced Sales & Inventory Analytics',
      'SLA & 99.9% Uptime Guarantee',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
]

const faqs = [
  {
    q: "Do guests need to download an app to view the menu or order?",
    a: "No! Guests simply scan the QR code using their standard smartphone camera. The full interactive menu opens instantly in their native web browser."
  },
  {
    q: "What hardware or screens do we need in our kitchen?",
    a: "QRDineX runs on any web browser. You can use an existing iPad, Android tablet, laptop, or dedicated KDS monitor in the kitchen without buying expensive proprietary hardware."
  },
  {
    q: "How fast can we launch QRDineX in our restaurant?",
    a: "You can be fully operational in less than 30 minutes! Simply sign up, upload your menu items with prices, and download your printable table QR codes."
  },
  {
    q: "Can we still take cash and traditional orders alongside QR orders?",
    a: "Absolutely. Staff can manually input orders or accept cash directly through the QRDineX manager interface while guests continue using table QR codes."
  },
  {
    q: "What happens if an item runs out during a shift?",
    a: "With our 1-click '86' feature, staff can mark an item out-of-stock from any phone or tablet, and it instantly disappears from every digital table menu."
  },
]

// --- Page ---------------------------------------------------------------
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  // Interactive States
  const [isAnnual, setIsAnnual] = useState(true)
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  // Calculator States
  const [tablesCount, setTablesCount] = useState(25)
  const [avgTicket, setAvgTicket] = useState(45)
  const [dailyTurns, setDailyTurns] = useState(4)
  const [currentFeature, setCurrentFeature] = useState(0)

const prevFeature = () => {
  setCurrentFeature((prev) => (prev === 0 ? features.length - 1 : prev - 1))
}

const nextFeature = () => {
  setCurrentFeature((prev) => (prev === features.length - 1 ? 0 : prev + 1))
}

  useEffect(() => {
    setMounted(true)
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ROI Calculations (~15% higher table turn efficiency + 18% ticket increase from visual upselling)
  const monthlyRevenue = tablesCount * dailyTurns * avgTicket * 30
  const estimatedExtraRevenue = Math.round(monthlyRevenue * 0.18)

  const navClass = scrolled
    ? 'bg-white/20 dark:bg-slate-900/70 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.18)] border border-white/30 dark:border-white/10'
    : 'bg-white/10 dark:bg-slate-900/40 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.10)] border border-white/20 dark:border-white/8'

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500&family=Outfit:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .font-display { font-family: 'Space Grotesk', sans-serif; }
        .font-nav { font-family: 'Outfit', sans-serif; letter-spacing: 0.02em; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-in { opacity: 0; animation: fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) forwards; }
        .d1 { animation-delay: 0.05s; }
        .d2 { animation-delay: 0.22s; }
        .d3 { animation-delay: 0.38s; }
      `}</style>

     
      {/* Floating Header */}
<header className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4 pointer-events-none">
  <nav
    className={`pointer-events-auto flex items-center gap-1 sm:gap-2 rounded-full px-5 py-2.5 transition-all duration-500 ${navClass}`}
    style={{
      boxShadow: scrolled
        ? '0 8px 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.3)'
        : '0 4px 20px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.2)',
    }}
  >
    {/* Brand */}
    <a href="/" className="flex items-center gap-2 pr-3 sm:pr-4 border-r border-white/25 dark:border-white/15 mr-1">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-700/90 shadow-sm">
        <Utensils className="h-3.5 w-3.5 text-white" />
      </div>
      <span className="font-nav text-sm font-bold tracking-wide text-slate-900 dark:text-white">QRDineX</span>
    </a>

    {/* Links */}
    <a href="#how-it-works" className="hidden lg:block font-nav text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors px-2.5 py-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10">How it works</a>
    <a href="#features" className="hidden lg:block font-nav text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors px-2.5 py-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10">Features</a>
    <a href="#calculator" className="hidden md:block font-nav text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors px-2.5 py-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10">ROI Calculator</a>
    <a href="#pricing" className="hidden sm:block font-nav text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors px-2.5 py-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10">Pricing</a>
    <a href="#faq" className="hidden md:block font-nav text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors px-2.5 py-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10">FAQ</a>

    {/* Theme Toggle */}
    <ThemeToggle />

    {/* Login Button */}
    <a
      href="/login"
      className="inline-flex h-8 items-center rounded-full border border-slate-300/60 dark:border-white/20 px-3.5 font-nav text-xs font-semibold text-slate-800 dark:text-white hover:bg-black/5 dark:hover:bg-white/10 hover:-translate-y-px transition-all ml-1"
    >
      Login
    </a>

    {/* Start Free Trial CTA */}
    <a
      href="/signup"
      className="inline-flex h-8 items-center rounded-full bg-blue-700 px-4 font-nav text-xs font-semibold text-white shadow hover:bg-blue-600 hover:shadow-md hover:-translate-y-px transition-all"
    >
      Signup
    </a>
  </nav>
</header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full h-screen overflow-hidden">
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

        {/* 1. Metric Badges Bar */}
        <section className="w-full border-y border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 py-10">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {metrics.map(({ value, label, icon: Icon }) => (
                <div key={label} className="flex flex-col items-center text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 mb-2">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-display text-2xl font-bold sm:text-3xl text-slate-900 dark:text-white">{value}</span>
                  <span className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

    


{/* Features - Horizontal Slider with Deeper Glass Card and Center Side Arrows */}
{/* Features - Horizontal Slider with Mono Feature Descriptions */}
<section id="features" className="relative w-full py-16 md:py-24 overflow-hidden">
  
  {/* 1. Background Image Layer */}
  <div 
    className="absolute inset-0 bg-cover bg-center" 
    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&q=80&w=2400')" }} 
  />

  {/* 2. Soft Gradient Overlay Layer */}
  <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/60 to-slate-950/90" />

  {/* 3. Main Content Layer */}
  <div className="relative z-10 mx-auto max-w-5xl px-4 md:px-6">
    
    {/* Left-Aligned Section Header */}
    <Reveal className="max-w-3xl text-left">
      <p className="font-mono text-xs sm:text-sm font-semibold uppercase tracking-widest text-blue-400 drop-shadow-sm">
        Everything included
      </p>
      <h2 className="font-display mt-3 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1] drop-shadow-md">
        Everything you need to <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-300 bg-clip-text text-transparent">run your restaurant</span>
      </h2>
      <p className="mt-4 text-base sm:text-lg leading-relaxed text-slate-100 font-serif italic drop-shadow-sm">
        <span className="font-bold not-italic px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/30 backdrop-blur-xs">
          QRDineX
        </span>{" "}
        streamlines operations, cuts wait times, and keeps every table, order, and role in sync.
      </p>
    </Reveal>

    {/* Slider Box */}
    <Reveal delay={100} className="mt-12 relative max-w-5xl">
      <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-slate-900/70 backdrop-blur-md py-8 md:py-12 shadow-2xl min-h-[360px] flex flex-col justify-between">
        
        {/* Sliding Window Track (Strict overflow-hidden viewport) */}
        <div className="overflow-hidden w-full">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentFeature * 100}%)` }}
          >
            {features.map(({ icon: Icon, title, desc }, index) => (
              /* Each item takes exactly 100% (min-w-full) with internal padding */
              <div 
                key={title} 
                className="w-full min-w-full shrink-0 flex flex-col items-start text-left px-12 md:px-16"
              >
                
                {/* Floating Icon Box */}
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/20 backdrop-blur-md text-blue-400 mb-6 border border-blue-400/25 shadow-inner">
                  <Icon className="h-7 w-7 text-blue-400 drop-shadow-md" />
                </div>
                
                <span className="font-mono text-xs font-bold text-blue-400 tracking-wider uppercase mb-2 drop-shadow-xs">
                  Feature {index + 1} of {features.length}
                </span>
                
                {/* Main Feature Title */}
                <h3 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow-md">
                  <span className="text-blue-400">{title.split(' ')[0]}</span>{' '}
                  {title.split(' ').slice(1).join(' ')}
                </h3>
                
                {/* Feature Description (Mono Style) */}
                <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-300 max-w-xl font-mono tracking-tight drop-shadow-sm">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Center Left Navigation Arrow */}
        <button
          onClick={prevFeature}
          aria-label="Previous feature"
          className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/40 backdrop-blur-md text-white hover:bg-blue-600 hover:border-blue-500 hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-lg"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        {/* Center Right Navigation Arrow */}
        <button
          onClick={nextFeature}
          aria-label="Next feature"
          className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/40 backdrop-blur-md text-white hover:bg-blue-600 hover:border-blue-500 hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-lg"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Bottom Pagination Dots */}
        <div className="mt-8 pt-4 flex items-center justify-center w-full gap-2 z-10">
          {features.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentFeature(idx)}
              aria-label={`Go to feature ${idx + 1}`}
              className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                currentFeature === idx
                  ? 'w-8 bg-blue-500 shadow-sm shadow-blue-500/50'
                  : 'w-2.5 bg-white/25 hover:bg-white/50'
              }`}
            />
          ))}
        </div>

      </div>
    </Reveal>
  </div>
</section>

{/* 3. How It Works Section */}
{/* 3. How It Works Section with Background Image & Glassmorphism */}
<section id="how-it-works" className="relative w-full py-16 md:py-24 overflow-hidden">
  
  {/* 1. Background Image Layer */}
  <div 
    className="absolute inset-0 bg-cover bg-center" 
    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=2400')" }} 
  />

  {/* 2. Soft Gradient Overlay Layer */}
  <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/60 to-slate-950/90" />

  {/* 3. Main Content Layer */}
  <div className="relative z-10 mx-auto max-w-6xl px-4 md:px-6">
    
    {/* Left-Aligned Header with Typewriter Transition */}
    <div className="max-w-3xl text-left">
      <p className="font-mono text-xs sm:text-sm font-semibold uppercase tracking-widest text-blue-400 drop-shadow-sm">
        How It Works
      </p>
      
      {/* Scroll-Triggered Writing Heading */}
      <h2 className="font-display mt-3 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1] min-h-[2.4em] sm:min-h-[1.8em] drop-shadow-md">
        <span>3 simple steps to </span>
        <TypewriterText
          text="transform dining"
          speed={45}
          delay={300}
          className="bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-300 bg-clip-text text-transparent pb-1"
        />
      </h2>

      <p className="mt-4 text-base sm:text-lg leading-relaxed text-slate-100 font-serif italic drop-shadow-sm">
        Get{" "}
        <span className="font-bold not-italic px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/30 backdrop-blur-xs">
          QRDineX
        </span>{" "}
        up and running in minutes without buying complex hardware or rewriting your menu.
      </p>
    </div>

    {/* Staggered Glassmorphic Cards Layout */}
    <div className="mt-16 grid gap-8 md:grid-cols-3 items-start pb-8">
      
      {/* Step 1 - Default Baseline */}
      <Reveal delay={0}>
        <div className="group relative flex flex-col justify-between rounded-2xl border border-white/15 bg-slate-900/70 backdrop-blur-md p-6 sm:p-8 shadow-2xl transition-all duration-300 ease-out hover:-translate-y-3 hover:-rotate-1 hover:shadow-blue-500/20 hover:border-blue-400/50 overflow-hidden min-h-[320px]">
          
          {/* Top Gradient Highlight Bar on Hover */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 shadow-xs">
                Step 01
              </span>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/25 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-inner">
                <QrCode className="h-6 w-6" />
              </div>
            </div>

            <h3 className="font-display text-xl sm:text-2xl font-bold text-white group-hover:text-blue-300 transition-colors duration-200 drop-shadow-md">
              Scan Table QR
            </h3>
            <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-200 drop-shadow-sm">
              Guests scan the sleek QR stand placed on their dining table using any smartphone camera—no app download required.
            </p>
          </div>

          <div className="mt-8 pt-4 border-t border-white/15 text-[11px] font-mono text-blue-300 font-medium tracking-wide">
            Instant Camera Access →
          </div>
        </div>
      </Reveal>

      {/* Step 2 - Offset Downward for Staggered Effect */}
      <Reveal delay={150}>
        <div className="group relative flex flex-col justify-between rounded-2xl border border-white/15 bg-slate-900/70 backdrop-blur-md p-6 sm:p-8 shadow-2xl transition-all duration-300 ease-out md:translate-y-10 hover:translate-y-7 hover:rotate-1 hover:shadow-blue-500/20 hover:border-blue-400/50 overflow-hidden min-h-[320px]">
          
          {/* Top Gradient Highlight Bar on Hover */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 shadow-xs">
                Step 02
              </span>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/25 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-inner">
                <Smartphone className="h-6 w-6" />
              </div>
            </div>

            <h3 className="font-display text-xl sm:text-2xl font-bold text-white group-hover:text-blue-300 transition-colors duration-200 drop-shadow-md">
              Browse & Order
            </h3>
            <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-200 drop-shadow-sm">
              Diners explore rich visual menus with HD photos, filter dietary tags, and select custom dish add-ons with a tap.
            </p>
          </div>

          <div className="mt-8 pt-4 border-t border-white/15 text-[11px] font-mono text-blue-300 font-medium tracking-wide">
            Dynamic Visual Upselling →
          </div>
        </div>
      </Reveal>

      {/* Step 3 - Offset Slightly Upward / Asymmetrical Shift */}
      <Reveal delay={300}>
        <div className="group relative flex flex-col justify-between rounded-2xl border border-white/15 bg-slate-900/70 backdrop-blur-md p-6 sm:p-8 shadow-2xl transition-all duration-300 ease-out md:translate-y-3 hover:-translate-y-1 hover:-rotate-1 hover:shadow-blue-500/20 hover:border-blue-400/50 overflow-hidden min-h-[320px]">
          
          {/* Top Gradient Highlight Bar on Hover */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 shadow-xs">
                Step 03
              </span>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/25 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-inner">
                <Zap className="h-6 w-6" />
              </div>
            </div>

            <h3 className="font-display text-xl sm:text-2xl font-bold text-white group-hover:text-blue-300 transition-colors duration-200 drop-shadow-md">
              Kitchen Sync & Pay
            </h3>
            <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-200 drop-shadow-sm">
              Orders send directly to your Kitchen Display System (KDS), while guests pay instantly via UPI, cards, or digital wallets.
            </p>
          </div>

          <div className="mt-8 pt-4 border-t border-white/15 text-[11px] font-mono text-blue-300 font-medium tracking-wide">
            Zero Wait Time Checkout →
          </div>
        </div>
      </Reveal>

    </div>
  </div>
</section>
{/* 2. Interactive ROI / Savings Calculator - Dark Theme */}
<section id="calculator" className="relative w-full py-16 md:py-24 bg-slate-900 overflow-hidden">
  
  {/* Ambient Subtle Radial Glow in Background */}
  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900 to-slate-900 pointer-events-none" />

  {/* Main Content Container */}
  <div className="relative z-10 mx-auto max-w-6xl px-4 md:px-6">
    
    {/* Left-Aligned & Enlarged Header */}
    <Reveal className="max-w-3xl text-left">
      <p className="font-mono text-xs sm:text-sm font-semibold uppercase tracking-widest text-blue-400 drop-shadow-sm">
        ROI Calculator
      </p>
      <h2 className="font-display mt-3 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1] drop-shadow-md">
        Calculate your <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-300 bg-clip-text text-transparent">monthly revenue boost</span>
      </h2>
      <p className="mt-4 text-base sm:text-lg leading-relaxed text-slate-300 font-serif italic drop-shadow-sm">
        See how much additional revenue QRDineX can generate through faster table turnover and visual upselling.
      </p>
    </Reveal>

    <Reveal delay={100} className="mt-12">
      {/* Outer Glassmorphic Wrapper */}
      <div className="grid gap-8 lg:grid-cols-12 rounded-3xl border border-white/15 bg-slate-800/70 backdrop-blur-md p-6 md:p-8 shadow-2xl">
        
        {/* Sliders Input Controls */}
        <div className="lg:col-span-7 flex flex-col gap-6 justify-center">
          
          {/* Active Tables Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-slate-200">Active Dining Tables</label>
              <span className="font-mono font-bold text-blue-400 text-sm">{tablesCount} tables</span>
            </div>
            <input
              type="range" min="5" max="100" step="5" value={tablesCount}
              onChange={(e) => setTablesCount(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Average Ticket Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-slate-200">Average Order Ticket (₹)</label>
              <span className="font-mono font-bold text-blue-400 text-sm">₹{avgTicket} / ticket</span>
            </div>
            <input
              type="range" min="100" max="3000" step="50" value={avgTicket}
              onChange={(e) => setAvgTicket(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Daily Turnover Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-slate-200">Average Table Turnovers / Day</label>
              <span className="font-mono font-bold text-blue-400 text-sm">{dailyTurns} turns/day</span>
            </div>
            <input
              type="range" min="1" max="8" step="1" value={dailyTurns}
              onChange={(e) => setDailyTurns(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </div>

        {/* Output Revenue Display Card */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-2xl bg-gradient-to-br from-blue-700 via-blue-900 to-slate-900 p-6 sm:p-8 text-white border border-blue-400/20 shadow-xl">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-medium text-blue-300 uppercase tracking-wider">
              <Sparkles className="h-4 w-4 text-amber-300" /> Estimated Revenue Growth
            </div>
            <div className="mt-6 font-display text-4xl sm:text-5xl font-bold text-white tracking-tight drop-shadow-md">
              +₹{estimatedExtraRevenue.toLocaleString('en-IN')}
              <span className="text-xs font-normal text-blue-200 block mt-1">Estimated extra sales / month</span>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/20 space-y-2 text-xs text-blue-100">
            <div className="flex justify-between">
              <span>Base Monthly Revenue:</span>
              <span className="font-mono font-semibold">₹{monthlyRevenue.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span>Est. Upsell & Speed Lift:</span>
              <span className="font-mono font-semibold text-amber-300">+18% Boost</span>
            </div>
          </div>
        </div>

      </div>
    </Reveal>
  </div>
</section>

        {/* 3. Comparison Table Section */}
        <section className="w-full py-16 md:py-24 bg-slate-50 dark:bg-slate-900/50 transition-colors duration-300">
  <div className="mx-auto max-w-6xl px-4 md:px-6">
    
    {/* Left-Aligned & Enlarged Header */}
    <Reveal className="max-w-3xl text-left">
      <p className="font-mono text-xs sm:text-sm font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
        Why QRDineX
      </p>
      <h2 className="font-display mt-3 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
        Traditional paper <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-400 bg-clip-text text-transparent">vs. QRDineX</span>
      </h2>
      <p className="mt-4 text-base sm:text-lg leading-relaxed text-slate-500 dark:text-slate-400 italic">
        Compare traditional paper menus and manual orders against our instant QR restaurant platform.
      </p>
    </Reveal>

    <Reveal delay={100} className="mt-12 overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[600px]">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800">
            <th className="py-4 px-4 font-display font-semibold text-sm text-slate-900 dark:text-white w-1/3">Key Dimension</th>
            <th className="py-4 px-4 font-display font-semibold text-sm text-slate-500 dark:text-slate-400 w-1/3">Traditional Paper & POS</th>
            <th className="py-4 px-4 font-display font-semibold text-sm text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-950/40 rounded-t-xl w-1/3">QRDineX Platform</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
          {comparisonData.map((row) => (
            <tr key={row.feature} className="hover:bg-slate-100/50 dark:hover:bg-slate-900/80 transition-colors">
              <td className="py-4 px-4 font-medium text-sm text-slate-900 dark:text-white">{row.feature}</td>
              <td className="py-4 px-4 text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <X className="h-4 w-4 text-red-500 shrink-0" />
                {row.paper}
              </td>
              <td className="py-4 px-4 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white bg-blue-50/30 dark:bg-blue-950/20">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  {row.qrdinex}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Reveal>
  </div>
</section>

        {/* 4. Testimonials Section */}
       <section className="w-full py-16 md:py-24 bg-amber-50 dark:bg-slate-950 transition-colors duration-300">
  <div className="mx-auto max-w-6xl px-4 md:px-6">
    
    {/* Left-Aligned & Enlarged Header */}
    <Reveal className="max-w-3xl text-left">
      <p className="font-mono text-xs sm:text-sm font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
        Testimonials
      </p>
      <h2 className="font-display mt-3 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
        Loved by <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-400 bg-clip-text text-transparent">chefs & managers</span>
      </h2>
      <p className="mt-4 text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-400 italic">
        Here is what restaurant operators say about switching to QRDineX.
      </p>
    </Reveal>


    {/* Testimonials Grid with Hover Animations */}
    <div className="mt-12 grid gap-6 md:grid-cols-3">
      {testimonials.map((item, i) => (
        <Reveal key={item.author} delay={i * 100}>
          <div className="group relative h-full flex flex-col justify-between rounded-2xl border border-amber-200/70 dark:border-slate-800 bg-white/70 dark:bg-slate-900/40 p-6 sm:p-8 shadow-sm transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-500/40 dark:hover:border-blue-500/40 overflow-hidden">
            
            {/* Top Gradient Highlight Bar on Hover */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />


            <div>
              {/* Rating Stars with Staggered Hover Scale Animation */}
              <div className="flex gap-1 text-amber-400 mb-4">
                {[...Array(item.rating)].map((_, idx) => (
                  <Star
                    key={idx}
                    className="h-4 w-4 fill-amber-400 transition-transform duration-300 group-hover:scale-125"
                    style={{ transitionDelay: `${idx * 40}ms` }}
                  />
                ))}
              </div>


              {/* Quote Text */}
              <p className="text-sm sm:text-base italic leading-relaxed text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors duration-200">
                "{item.quote}"
              </p>
            </div>


            {/* Author Footer */}
            <div className="mt-6 pt-4 border-t border-amber-200/60 dark:border-slate-800/80 group-hover:border-blue-500/20 transition-colors duration-300">
              <p className="font-display font-semibold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                {item.author}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {item.role} · <span className="text-blue-600 dark:text-blue-400 font-medium">{item.restaurant}</span>
              </p>
            </div>


          </div>
        </Reveal>
      ))}
    </div>


  </div>
</section>

     
        {/* 5. Pricing Tiers Section */}
{/* 5. Pricing Tiers Section */}
<section id="pricing" className="w-full py-16 md:py-24 bg-slate-200 dark:bg-slate-900 transition-colors duration-300">
  <div className="mx-auto max-w-6xl px-4 md:px-6">
    
    {/* Left-Aligned & Enlarged Header */}
    <Reveal className="max-w-3xl text-left">
      <p className="font-mono text-xs sm:text-sm font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
        Simple Pricing
      </p>
      <h2 className="font-display mt-3 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
        Transparent plans <span className="bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-400 bg-clip-text text-transparent">for every venue</span>
      </h2>
      <p className="mt-4 text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-400 italic">
        No hidden fees, no credit card required to start your free 14-day trial.
      </p>
      
      {/* Billing Toggle */}
      <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 shadow-sm">
        <button
          onClick={() => setIsAnnual(false)}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${!isAnnual ? 'bg-blue-700 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
        >
          Monthly
        </button>
        <button
          onClick={() => setIsAnnual(true)}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${isAnnual ? 'bg-blue-700 text-white shadow' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
        >
          Annual <span className="rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold text-slate-950">Save 20%</span>
        </button>
      </div>
    </Reveal>


    {/* Pricing Cards Grid with Micro-Animations */}
    <div className="mt-12 grid gap-8 text-left md:grid-cols-3 items-stretch">
      {pricingPlans.map((plan, i) => {
        const price = isAnnual ? plan.annualPrice : plan.monthlyPrice
        return (
          <Reveal key={plan.name} delay={i * 100}>
            <div className={`group relative h-full flex flex-col justify-between rounded-2xl p-6 sm:p-8 transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-xl hover:shadow-blue-500/10 overflow-hidden ${
              plan.popular
                ? 'border-2 border-blue-600 dark:border-blue-500 bg-white dark:bg-slate-900 shadow-lg'
                : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 shadow-sm hover:border-blue-500/40 dark:hover:border-blue-500/40'
            }`}>
              
              {/* Top Accent Line (Gradient on hover for regular cards, solid blue for popular) */}
              <div className={`absolute top-0 left-0 right-0 h-1 transition-opacity duration-300 ${
                plan.popular 
                  ? 'bg-blue-600' 
                  : 'bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-400 opacity-0 group-hover:opacity-100'
              }`} />


              {plan.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
                  Most Popular
                </span>
              )}


              <div>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                  {plan.name}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">{plan.desc}</p>
                
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white transition-transform duration-300 group-hover:scale-105 origin-left inline-block">
                    ₹{price.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">/ month</span>
                </div>


                <ul className="mt-8 space-y-3">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-300">
                      <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>


              <a
                href="/signup"
                className={`mt-8 inline-flex h-11 w-full items-center justify-center rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  plan.popular
                    ? 'bg-blue-700 text-white shadow-md hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-600/25 active:scale-[0.98]'
                    : 'border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white hover:bg-blue-600 hover:text-white hover:border-blue-600 dark:hover:bg-blue-600 dark:hover:border-blue-600 active:scale-[0.98]'
                }`}
              >
                {plan.cta}
              </a>
            </div>
          </Reveal>
        )
      })}
    </div>
  </div>
</section>
        {/* 6. FAQ Accordion Section */}
        <section id="faq" className="w-full py-16 md:py-24 bg-white dark:bg-slate-950 transition-colors duration-300">
          <div className="mx-auto max-w-4xl px-4 md:px-6">
            <Reveal className="text-center mx-auto max-w-xl">
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">Questions & Answers</p>
              <h2 className="font-display mt-3 text-3xl font-bold tracking-tight md:text-4xl text-slate-900 dark:text-white">Frequently Asked Questions</h2>
            </Reveal>

            <div className="mt-12 space-y-4">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx
                return (
                  <Reveal key={faq.q} delay={idx * 60}>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 overflow-hidden transition-all">
                      <button
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        className="flex w-full items-center justify-between p-5 text-left text-sm font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <span>{faq.q}</span>
                        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-600' : 'text-slate-400'}`} />
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300 border-t border-slate-200/60 dark:border-slate-800/60 pt-3">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  </Reveal>
                )
              })}
            </div>
          </div>
        </section>

        {/* CTA banner */}
        <section className="w-full py-16 md:py-20 bg-slate-50 dark:bg-slate-900/50 transition-colors duration-300">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <Reveal>
              <div className="relative flex flex-col items-center gap-6 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 to-blue-900 dark:from-blue-800 dark:to-slate-900 px-8 py-12 text-center md:flex-row md:justify-between md:text-left">
                <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                <div className="relative">
                  <h2 className="font-display text-2xl font-bold text-white md:text-3xl">Put a code on every table, today.</h2>
                  <p className="mt-2 text-sm text-blue-100">Free trial, no card required — see your first order fire in minutes.</p>
                </div>
                <a href="/signup" className="relative inline-flex h-11 shrink-0 items-center rounded-md bg-white dark:bg-slate-100 px-7 text-sm font-semibold text-blue-700 hover:-translate-y-0.5 hover:shadow-lg transition-all">
                  Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="flex w-full flex-col items-center gap-2 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-6 sm:flex-row md:px-8 transition-colors duration-300">
        <p className="text-xs text-slate-500 dark:text-slate-400">© {new Date().getFullYear()} QRDineX. All rights reserved.</p>
        <nav className="flex gap-4 sm:ml-auto sm:gap-6">
          <a href="#" className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Terms of Service</a>
          <a href="#" className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Privacy</a>
        </nav>
      </footer>
    </div>
  )
}