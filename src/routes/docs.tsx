import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Presentation,
  BookOpen,
  Database,
  Lightbulb,
  ArrowLeft,
  ArrowRight,
  Calculator,
  CheckCircle,
  HelpCircle,
  FileSpreadsheet,
  TrendingUp,
  Cpu,
  Layers,
  LineChart,
  Code,
  Shield,
  Clock,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Documentation & Presentation · Amortix" },
      {
        name: "description",
        content:
          "Explore the Amortix slide deck, detailed user manual, database models, and future roadmap.",
      },
    ],
  }),
  component: DocsPage,
});

type TabType = "slides" | "docs" | "schema" | "roadmap";

function DocsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("slides");
  const [currentSlide, setCurrentSlide] = useState(0);

  // EMI Calculator State
  const [calcPrincipal, setCalcPrincipal] = useState(100000);
  const [calcRate, setCalcRate] = useState(8.5);
  const [calcTenure, setCalcTenure] = useState(24);
  const [calcEmi, setCalcEmi] = useState(0);
  const [calcTotalInterest, setCalcTotalInterest] = useState(0);

  // Recalculate EMI whenever inputs change
  useEffect(() => {
    const P = Number(calcPrincipal);
    const annualRate = Number(calcRate);
    const N = Number(calcTenure);

    if (P > 0 && annualRate >= 0 && N > 0) {
      const r = annualRate / 12 / 100; // monthly rate
      let emi = 0;
      if (r === 0) {
        emi = P / N;
      } else {
        emi = (P * r * Math.pow(1 + r, N)) / (Math.pow(1 + r, N) - 1);
      }
      const totalAmount = emi * N;
      const totalInt = totalAmount - P;

      setCalcEmi(emi);
      setCalcTotalInterest(totalInt);
    } else {
      setCalcEmi(0);
      setCalcTotalInterest(0);
    }
  }, [calcPrincipal, calcRate, calcTenure]);

  // Slides configuration
  const slides = [
    {
      title: "Amortix",
      subtitle: "Premium Loan Amortization Suite",
      tagline: "Precision debt portfolio management for modern treasury teams.",
      icon: Sparkles,
      content: (
        <div className="space-y-6 text-center">
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">
            Amortix eliminates the risk and hassle of tracking multi-million dollar corporate debt
            portfolios using fragmented, error-prone spreadsheets.
          </p>
          <div className="flex justify-center gap-6 pt-4">
            <div className="flex flex-col items-center rounded-2xl border border-border bg-card/40 px-6 py-4 shadow-soft">
              <span className="text-2xl font-bold text-gradient">Real-Time</span>
              <span className="text-xs text-muted-foreground">KPI tracking</span>
            </div>
            <div className="flex flex-col items-center rounded-2xl border border-border bg-card/40 px-6 py-4 shadow-soft">
              <span className="text-2xl font-bold text-gradient">Dynamic</span>
              <span className="text-xs text-muted-foreground">Amortization engine</span>
            </div>
            <div className="flex flex-col items-center rounded-2xl border border-border bg-card/40 px-6 py-4 shadow-soft">
              <span className="text-2xl font-bold text-gradient">Auditable</span>
              <span className="text-xs text-muted-foreground">Supabase sync</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "The Spreadsheet Dilemma",
      subtitle: "Why Legacy Debt Tracking Fails",
      tagline: "Treasury teams face operational risks daily.",
      icon: HelpCircle,
      content: (
        <div className="grid grid-cols-1 gap-4 text-left md:grid-cols-3">
          <div className="rounded-2xl border border-border/80 bg-card/30 p-5 shadow-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <Layers className="h-5 w-5" />
            </div>
            <h4 className="mt-3 font-semibold text-foreground">Broken Formulas</h4>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Row deletions, copy-paste errors, and customized modifications break compound interest
              schedules, leading to inaccurate payment dates and accruals.
            </p>
          </div>
          <div className="rounded-2xl border border-border/80 bg-card/30 p-5 shadow-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <Clock className="h-5 w-5" />
            </div>
            <h4 className="mt-3 font-semibold text-foreground">Balloon Payment Surprises</h4>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Lump-sum principal maturities (balloon payments) buried in static spreadsheets lack
              active alerts, posing severe liquidity/treasury refinancing risks.
            </p>
          </div>
          <div className="rounded-2xl border border-border/80 bg-card/30 p-5 shadow-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <h4 className="mt-3 font-semibold text-foreground">Prepayment Inflexibility</h4>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Recalculating interest-savings when applying extra monthly payments or custom
              pre-payments requires manual formulas that are tedious to scale.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "The Amortix Solution",
      subtitle: "Centralized Corporate Amortization",
      tagline: "A modern SaaS application designed for security and scalability.",
      icon: CheckCircle,
      content: (
        <div className="grid grid-cols-1 gap-4 text-left md:grid-cols-2">
          <div className="flex gap-4 rounded-2xl border border-border bg-card/30 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/15 text-success">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Portfolio KPI Dashboard</h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Aggregated statistics detailing total outstanding debt, monthly EMI obligations, and
                weighted average interest rates in real-time.
              </p>
            </div>
          </div>
          <div className="flex gap-4 rounded-2xl border border-border bg-card/30 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Dynamic Calculations</h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Calculates precise schedules supporting month-specific custom prepayments, reducing balance types, flat
                interest types, and customized balloon maturities.
              </p>
            </div>
          </div>
          <div className="flex gap-4 rounded-2xl border border-border bg-card/30 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">One-Click Excel Exports</h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Generate clean, audited, client-ready Excel sheets representing complete
                amortization breakdowns with a single click.
              </p>
            </div>
          </div>
          <div className="flex gap-4 rounded-2xl border border-border bg-card/30 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/15 text-success">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Supabase Authentication</h4>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Secure access controls and database synchronization ensuring data stays auditable,
                encrypted, and backed up in real-time.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Technical Architecture",
      subtitle: "Modern & Robust Stack",
      tagline: "Engineered for performance, zero cold starts, and full type safety.",
      icon: Cpu,
      content: (
        <div className="grid grid-cols-2 gap-4 text-left md:grid-cols-4">
          <div className="rounded-2xl border border-border bg-card/20 p-4 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Code className="h-5 w-5" />
            </div>
            <h4 className="mt-2 text-sm font-semibold">React 19 & TS</h4>
            <p className="mt-1 text-[11px] text-muted-foreground">Type-safe components</p>
          </div>
          <div className="rounded-2xl border border-border bg-card/20 p-4 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Layers className="h-5 w-5" />
            </div>
            <h4 className="mt-2 text-sm font-semibold">TanStack Start</h4>
            <p className="mt-1 text-[11px] text-muted-foreground">SSR with file routing</p>
          </div>
          <div className="rounded-2xl border border-border bg-card/20 p-4 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Database className="h-5 w-5" />
            </div>
            <h4 className="mt-2 text-sm font-semibold">Supabase</h4>
            <p className="mt-1 text-[11px] text-muted-foreground">Postgres database & Auth</p>
          </div>
          <div className="rounded-2xl border border-border bg-card/20 p-4 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <LineChart className="h-5 w-5" />
            </div>
            <h4 className="mt-2 text-sm font-semibold">Recharts</h4>
            <p className="mt-1 text-[11px] text-muted-foreground">Fluid SVG charts</p>
          </div>
        </div>
      ),
    },
    {
      title: "Business Impact & ROI",
      subtitle: "Value Delivered to Finance Teams",
      tagline: "Driving efficiency and transparency.",
      icon: LineChart,
      content: (
        <div className="grid grid-cols-1 gap-4 text-left md:grid-cols-3">
          <div className="rounded-2xl border border-border/80 bg-card/30 p-5 shadow-soft">
            <span className="text-3xl font-extrabold text-gradient">95%</span>
            <h4 className="mt-2 font-semibold text-foreground">Time Saved</h4>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Instantly compute and simulate payment schedules instead of maintaining dozens of
              bespoke files.
            </p>
          </div>
          <div className="rounded-2xl border border-border/80 bg-card/30 p-5 shadow-soft">
            <span className="text-3xl font-extrabold text-gradient">100%</span>
            <h4 className="mt-2 font-semibold text-foreground">Audit Compliance</h4>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Every loan's properties are centrally saved, reducing human error during financial
              reporting.
            </p>
          </div>
          <div className="rounded-2xl border border-border/80 bg-card/30 p-5 shadow-soft">
            <span className="text-3xl font-extrabold text-gradient">0%</span>
            <h4 className="mt-2 font-semibold text-foreground">Missed Obligations</h4>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Clear visual callouts for upcoming balloon payments prevent refinancing defaults.
            </p>
          </div>
        </div>
      ),
    },
  ];

  // Slide Deck Navigation Keyboard Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab !== "slides") return;
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrentSlide((prev) => Math.max(prev - 1, 0));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, slides.length]);

  const CurrentIcon = slides[currentSlide].icon;

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Reference & Presentation Hub
        </div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Documentation & Slides</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Discover Amortix's features, financial formulas, database models, and future roadmap.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border/60">
        <button
          onClick={() => setActiveTab("slides")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "slides"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Presentation className="h-4.5 w-4.5" />
          Presentation Slides
        </button>
        <button
          onClick={() => setActiveTab("docs")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "docs"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen className="h-4.5 w-4.5" />
          Technical Docs
        </button>
        <button
          onClick={() => setActiveTab("schema")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "schema"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Database className="h-4.5 w-4.5" />
          Database Schema
        </button>
        <button
          onClick={() => setActiveTab("roadmap")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "roadmap"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Lightbulb className="h-4.5 w-4.5" />
          Future Roadmap
        </button>
      </div>

      {/* Main Content Area */}
      <div>
        {activeTab === "slides" && (
          <div className="flex flex-col items-center">
            {/* Interactive Presentation Deck Frame */}
            <div className="glass-card w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-card/65 shadow-glow relative min-h-[460px] flex flex-col justify-between p-8 sm:p-12">
              <div className="absolute top-4 right-6 text-[10px] uppercase tracking-wider text-muted-foreground">
                Slide {currentSlide + 1} of {slides.length}
              </div>

              {/* Slide Content */}
              <div className="flex-1 flex flex-col justify-center items-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25 }}
                    className="w-full flex flex-col items-center space-y-6"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow text-white">
                      <CurrentIcon className="h-8 w-8" />
                    </div>

                    <div className="text-center space-y-2">
                      <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                        {slides[currentSlide].title}
                      </h2>
                      <h3 className="text-lg font-semibold text-primary">
                        {slides[currentSlide].subtitle}
                      </h3>
                      <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                        {slides[currentSlide].tagline}
                      </p>
                    </div>

                    <div className="w-full pt-4">{slides[currentSlide].content}</div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Deck Navigation Controls */}
              <div className="flex items-center justify-between border-t border-border/40 pt-6 mt-8">
                <button
                  onClick={() => setCurrentSlide((prev) => Math.max(prev - 1, 0))}
                  disabled={currentSlide === 0}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold hover:bg-accent disabled:opacity-40"
                >
                  <ArrowLeft className="h-4 w-4" /> Prev
                </button>
                <div className="flex gap-2">
                  {slides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-2 w-2 rounded-full transition-all duration-300 ${
                        idx === currentSlide
                          ? "bg-primary w-6"
                          : "bg-muted-foreground/30 hover:bg-muted-foreground/60"
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1))}
                  disabled={currentSlide === slides.length - 1}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-primary px-4 py-2 text-xs font-semibold text-white shadow-card hover:shadow-glow disabled:opacity-40"
                >
                  Next <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground text-center">
              💡 Tip: You can also use the{" "}
              <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted">Left</kbd> and{" "}
              <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted">Right</kbd> arrow
              keys or{" "}
              <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted">Space</kbd> on
              your keyboard to navigate slides.
            </p>
          </div>
        )}

        {activeTab === "docs" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Scrollable Documentation Content */}
            <div className="glass-card rounded-2xl p-6 lg:col-span-2 space-y-6">
              <section className="space-y-3">
                <h3 className="text-xl font-bold tracking-tight text-foreground border-b border-border/40 pb-2">
                  1. Amortix User Guide
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Amortix is built to help treasury divisions coordinate bank relations and manage
                  outstanding corporate debt. The workflow is fully streamlined from input variables
                  to dashboard aggregation.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl border border-border/80 bg-card/20">
                    <h5 className="font-semibold text-sm text-foreground">Creating a Loan</h5>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Input the bank name, a unique loan identifier, borrowed amount, annual
                      interest rate, and terms. You can select either a standard, reducing, or flat
                      interest type.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl border border-border/80 bg-card/20">
                    <h5 className="font-semibold text-sm text-foreground">Excel Exports</h5>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Amortix parses interest schedules directly and packages them into
                      high-fidelity Excel sheets for auditing, sharing, or record keeping.
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-xl font-bold tracking-tight text-foreground border-b border-border/40 pb-2">
                  2. Amortization Calculations & Math
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  For the standard Reducing Balance method, monthly payments (EMI) are calculated
                  using the amortizing annuity formula:
                </p>

                {/* Math Block */}
                <div className="my-4 p-5 rounded-2xl border border-border bg-muted/30 text-center font-serif text-lg md:text-xl text-gradient">
                  EMI = P × [ r(1+r)ⁿ ] / [ (1+r)ⁿ - 1 ]
                </div>

                <div className="text-xs text-muted-foreground leading-relaxed space-y-1 pl-4 border-l-2 border-primary">
                  <div>
                    • <strong>EMI</strong>: Equated Monthly Installment
                  </div>
                  <div>
                    • <strong>P</strong>: Principal amount borrowed (loan amount)
                  </div>
                  <div>
                    • <strong>r</strong>: Monthly interest rate (Annual Interest Rate / 12 months /
                    100)
                  </div>
                  <div>
                    • <strong>n</strong>: Tenure in months (total payments)
                  </div>
                </div>

                <h4 className="font-semibold text-sm pt-2 text-foreground">
                  Extra Payments & Month-Specific Prepayments
                </h4>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  Adding extra principal payments monthly lowers the outstanding balance faster.
                  In addition to standard recurring monthly prepayments, Amortix supports <strong>month-specific custom prepayments</strong>.
                  Users can apply unique, one-off additional payments to any month of the schedule (excluding the final month).
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The amortization engine dynamically calculates interest savings, shifts payoff dates forward, and recalibrates the final balloon maturity amounts in real-time based on these combined extra payment schedules.
                </p>
              </section>
            </div>

            {/* Interactive Calculator sidebar widget */}
            <div className="glass-card rounded-2xl p-6 h-fit space-y-4">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                <h3 className="text-base font-bold">Interactive Calculator</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Simulate standard reducing balance loan schedules instantly below.
              </p>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Principal Amount ($)
                  </label>
                  <input
                    type="number"
                    value={calcPrincipal}
                    onChange={(e) => setCalcPrincipal(Math.max(0, Number(e.target.value)))}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Annual Interest Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={calcRate}
                    onChange={(e) => setCalcRate(Math.max(0, Number(e.target.value)))}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Tenure (Months)
                  </label>
                  <input
                    type="number"
                    value={calcTenure}
                    onChange={(e) => setCalcTenure(Math.max(1, Number(e.target.value)))}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>

              <div className="border-t border-border/40 pt-4 mt-4 space-y-2">
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>Monthly EMI:</span>
                  <span className="font-bold text-foreground text-sm">
                    $
                    {calcEmi.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>Total Interest:</span>
                  <span className="font-bold text-gradient text-sm">
                    $
                    {calcTotalInterest.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>Total Repayment:</span>
                  <span className="font-semibold text-foreground">
                    $
                    {(Number(calcPrincipal) + calcTotalInterest).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "schema" && (
          <div className="glass-card rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-foreground">
                Supabase Postgres Model Schema
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                The database model utilizes type-safe fields generated automatically from Supabase
                schemas.
              </p>
            </div>

            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                    <th className="pb-3 pr-4">Column Name</th>
                    <th className="pb-3 px-4">Postgres Type</th>
                    <th className="pb-3 px-4">Constraints</th>
                    <th className="pb-3 pl-4">Functional Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  <tr className="hover:bg-accent/30">
                    <td className="py-3.5 pr-4 font-mono text-xs text-primary font-bold">id</td>
                    <td className="py-3.5 px-4 font-mono text-xs">uuid</td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">
                      PRIMARY KEY, DEFAULT gen_random_uuid()
                    </td>
                    <td className="py-3.5 pl-4 text-xs">
                      Unique identifier generated for each individual loan.
                    </td>
                  </tr>
                  <tr className="hover:bg-accent/30">
                    <td className="py-3.5 pr-4 font-mono text-xs text-primary font-bold">
                      bank_name
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">text</td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">NOT NULL</td>
                    <td className="py-3.5 pl-4 text-xs">The lending banking institution name.</td>
                  </tr>
                  <tr className="hover:bg-accent/30">
                    <td className="py-3.5 pr-4 font-mono text-xs text-primary font-bold">
                      loan_number
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">text</td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">NOT NULL</td>
                    <td className="py-3.5 pl-4 text-xs">
                      Unique reference key or contract code issued by the bank.
                    </td>
                  </tr>
                  <tr className="hover:bg-accent/30">
                    <td className="py-3.5 pr-4 font-mono text-xs text-primary font-bold">
                      purpose
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">text</td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">NULLABLE</td>
                    <td className="py-3.5 pl-4 text-xs">
                      Brief memo detailing the use of funds (e.g. Working Capital).
                    </td>
                  </tr>
                  <tr className="hover:bg-accent/30">
                    <td className="py-3.5 pr-4 font-mono text-xs text-primary font-bold">
                      borrowed_amount
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">numeric</td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">NOT NULL</td>
                    <td className="py-3.5 pl-4 text-xs">
                      Total principal volume borrowed at origination.
                    </td>
                  </tr>
                  <tr className="hover:bg-accent/30">
                    <td className="py-3.5 pr-4 font-mono text-xs text-primary font-bold">
                      interest_rate
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">numeric</td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">NOT NULL</td>
                    <td className="py-3.5 pl-4 text-xs">
                      Annual percentage rate (APR) of the loan.
                    </td>
                  </tr>
                  <tr className="hover:bg-accent/30">
                    <td className="py-3.5 pr-4 font-mono text-xs text-primary font-bold">
                      tenure_months
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">integer</td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">NOT NULL</td>
                    <td className="py-3.5 pl-4 text-xs">
                      Duration of loan amortization schedule in months.
                    </td>
                  </tr>
                  <tr className="hover:bg-accent/30">
                    <td className="py-3.5 pr-4 font-mono text-xs text-primary font-bold">
                      start_date
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">date</td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">NOT NULL</td>
                    <td className="py-3.5 pl-4 text-xs">
                      The date when the loan becomes active and interest starts.
                    </td>
                  </tr>
                  <tr className="hover:bg-accent/30">
                    <td className="py-3.5 pr-4 font-mono text-xs text-primary font-bold">
                      balloon_date
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">date</td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">NULLABLE</td>
                    <td className="py-3.5 pl-4 text-xs">
                      Target date for final large lump-sum maturity payment.
                    </td>
                  </tr>
                  <tr className="hover:bg-accent/30">
                    <td className="py-3.5 pr-4 font-mono text-xs text-primary font-bold">
                      balloon_amount
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">numeric</td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">NULLABLE</td>
                    <td className="py-3.5 pl-4 text-xs">
                      Financial amount due at the balloon date.
                    </td>
                  </tr>
                  <tr className="hover:bg-accent/30">
                    <td className="py-3.5 pr-4 font-mono text-xs text-primary font-bold">
                      extra_payment
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">numeric</td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">NULLABLE</td>
                    <td className="py-3.5 pl-4 text-xs">
                      Optional recurring monthly prepayment to reduce principal.
                    </td>
                  </tr>
                  <tr className="hover:bg-accent/30">
                    <td className="py-3.5 pr-4 font-mono text-xs text-primary font-bold">
                      emi_type
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">text</td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">
                      NOT NULL, DEFAULT 'standard'
                    </td>
                    <td className="py-3.5 pl-4 text-xs">
                      Method of repayment structure: Standard, Reducing, Flat.
                    </td>
                  </tr>
                  <tr className="hover:bg-accent/30">
                    <td className="py-3.5 pr-4 font-mono text-xs text-primary font-bold">
                      loan_status
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">text</td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">
                      NOT NULL, DEFAULT 'active'
                    </td>
                    <td className="py-3.5 pl-4 text-xs">
                      Current state of the loan contract: active, closed, overdue.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="pt-6">
              <h3 className="text-base font-bold tracking-tight text-foreground">
                Table: loan_extra_payments
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Stores custom, one-off additional principal prepayments for individual months.
              </p>
            </div>

            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                    <th className="pb-3 pr-4">Column Name</th>
                    <th className="pb-3 px-4">Postgres Type</th>
                    <th className="pb-3 px-4">Constraints</th>
                    <th className="pb-3 pl-4">Functional Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  <tr className="hover:bg-accent/30">
                    <td className="py-3.5 pr-4 font-mono text-xs text-primary font-bold">id</td>
                    <td className="py-3.5 px-4 font-mono text-xs">uuid</td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">
                      PRIMARY KEY, DEFAULT gen_random_uuid()
                    </td>
                    <td className="py-3.5 pl-4 text-xs">
                      Unique identifier for the prepayment record.
                    </td>
                  </tr>
                  <tr className="hover:bg-accent/30">
                    <td className="py-3.5 pr-4 font-mono text-xs text-primary font-bold">loan_id</td>
                    <td className="py-3.5 px-4 font-mono text-xs">uuid</td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">
                      NOT NULL, REFERENCES loans(id) ON DELETE CASCADE
                    </td>
                    <td className="py-3.5 pl-4 text-xs">
                      Foreign key linking the prepayment to its corresponding loan.
                    </td>
                  </tr>
                  <tr className="hover:bg-accent/30">
                    <td className="py-3.5 pr-4 font-mono text-xs text-primary font-bold">payment_no</td>
                    <td className="py-3.5 px-4 font-mono text-xs">integer</td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">
                      NOT NULL, CHECK (payment_no &gt; 0)
                    </td>
                    <td className="py-3.5 pl-4 text-xs">
                      The specific month number in the schedule (1-indexed) where the prepayment is applied.
                    </td>
                  </tr>
                  <tr className="hover:bg-accent/30">
                    <td className="py-3.5 pr-4 font-mono text-xs text-primary font-bold">amount</td>
                    <td className="py-3.5 px-4 font-mono text-xs">numeric</td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">
                      NOT NULL, CHECK (amount &gt;= 0)
                    </td>
                    <td className="py-3.5 pl-4 text-xs">
                      The financial amount of additional principal paid in this month.
                    </td>
                  </tr>
                  <tr className="hover:bg-accent/30">
                    <td className="py-3.5 pr-4 font-mono text-xs text-primary font-bold">created_at</td>
                    <td className="py-3.5 px-4 font-mono text-xs">timestamptz</td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">
                      NOT NULL, DEFAULT now()
                    </td>
                    <td className="py-3.5 pl-4 text-xs">
                      Timestamp when the prepayment record was created.
                    </td>
                  </tr>
                  <tr className="hover:bg-accent/30">
                    <td className="py-3.5 pr-4 font-mono text-xs text-primary font-bold">updated_at</td>
                    <td className="py-3.5 px-4 font-mono text-xs">timestamptz</td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">
                      NOT NULL, DEFAULT now()
                    </td>
                    <td className="py-3.5 pl-4 text-xs">
                      Timestamp when the prepayment record was last updated.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "roadmap" && (
          <div className="glass-card rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-foreground">
                Amortix Future Roadmap & Ideas
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Proposed functional enhancements and upcoming feature rollout phases.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl border border-border bg-card/20 space-y-3">
                <div className="inline-flex items-center gap-1 bg-primary/10 text-primary rounded-lg px-2.5 py-1 text-xs font-semibold">
                  <Clock className="h-3.5 w-3.5" /> Phase 1: Near-Term
                </div>
                <h4 className="font-bold text-sm text-foreground">
                  Automated Reminders & Warnings
                </h4>
                <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4 leading-relaxed">
                  <li>In-app alert tray for upcoming monthly installments.</li>
                  <li>
                    Refinancing risk alerts triggered 6 months before balloon payment maturities.
                  </li>
                  <li>Interest rate reset notices for floating-rate agreements.</li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl border border-border bg-card/20 space-y-3">
                <div className="inline-flex items-center gap-1 bg-success/10 text-success rounded-lg px-2.5 py-1 text-xs font-semibold">
                  <TrendingUp className="h-3.5 w-3.5" /> Phase 2: Growth
                </div>
                <h4 className="font-bold text-sm text-foreground">Multi-Currency & Hedging</h4>
                <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4 leading-relaxed">
                  <li>
                    Support foreign currency loans (EUR, GBP, JPY) with real-time exchange rates.
                  </li>
                  <li>Simulate dynamic cross-currency currency swings and inflation impacts.</li>
                  <li>Hedging integrations (interest rate swaps simulation tool).</li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl border border-border bg-card/20 space-y-3">
                <div className="inline-flex items-center gap-1 bg-accent/15 text-accent-foreground rounded-lg px-2.5 py-1 text-xs font-semibold">
                  <Cpu className="h-3.5 w-3.5" /> Phase 3: Enterprise
                </div>
                <h4 className="font-bold text-sm text-foreground">
                  Accounting Software Integrations
                </h4>
                <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4 leading-relaxed">
                  <li>
                    Connect APIs to sync monthly interest schedules directly with QuickBooks or
                    Xero.
                  </li>
                  <li>Automatic generation of accounting journal entries for interest accruals.</li>
                  <li>Corporate Single Sign-On (SAML/SSO) for security policies.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
