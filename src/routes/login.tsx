import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, BookOpen, Lock, Mail, Eye, EyeOff, ShieldAlert, User2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Authenticate · Amortix" },
      {
        name: "description",
        content: "Access your premium corporate loan amortization workspace.",
      },
    ],
  }),
  component: LoginPage,
});

type AuthMode = "signin" | "signup";

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Basic Validations
    if (!email || !password) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    if (mode === "signup" && !displayName) {
      setErrorMsg("Please enter your display name.");
      return;
    }

    if (mode === "signup" && password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    if (mode === "signup" && password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signin") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        toast.success("Successfully logged in!");
        navigate({ to: "/" });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName,
              full_name: displayName,
            },
          },
        });

        if (error) throw error;

        // Note: Supabase sign up might auto-login or request email verification
        if (data.session) {
          toast.success("Successfully registered and logged in!");
          navigate({ to: "/" });
        } else {
          toast.success("Registration successful! Please check your email for verification link.");
          setMode("signin");
          setPassword("");
          setConfirmPassword("");
        }
      }
    } catch (err) {
      const error = err as Error;
      setErrorMsg(error.message || "An authentication error occurred.");
      toast.error(error.message || "Failed to authenticate.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 surface-mesh">
      {/* Background Blobs for Visual Aesthetics */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-indigo-500/10 blur-[120px]" />

      <div className="relative w-full max-w-md">
        {/* Logo / Branding Header */}
        <div className="flex flex-col items-center space-y-2 mb-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight font-display text-foreground">
              Amortix
            </h1>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">
              Treasury Loan Management Suite
            </p>
          </div>
        </div>

        {/* Main Glassmorphic Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="glass-card overflow-hidden rounded-3xl border border-border/60 bg-card/45 p-6 shadow-glow sm:p-8"
        >
          {/* Form Tabs */}
          <div className="flex rounded-xl bg-muted/50 p-1 mb-6 border border-border/30">
            <button
              onClick={() => {
                setMode("signin");
                setErrorMsg(null);
              }}
              className={`flex-1 rounded-lg py-2.5 text-xs font-semibold tracking-wide transition-all ${mode === "signin"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode("signup");
                setErrorMsg(null);
              }}
              className={`flex-1 rounded-lg py-2.5 text-xs font-semibold tracking-wide transition-all ${mode === "signup"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Create Account
            </button>
          </div>

          {/* Form Actions */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 p-3.5 text-xs text-destructive"
                >
                  <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">{errorMsg}</div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Display Name Field (Only in Sign Up Mode) */}
            <AnimatePresence>
              {mode === "signup" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-1 overflow-hidden"
                >
                  <label className="block text-xs font-semibold text-muted-foreground">
                    Display Name
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <User2 className="h-4 w-4 text-muted-foreground/60" />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="John Doe"
                      disabled={loading}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="h-10 w-full rounded-xl border border-input bg-background/50 pl-10 pr-3 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all disabled:opacity-50"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Field */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-muted-foreground">Email</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4 text-muted-foreground/60" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-background/50 pl-10 pr-3 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-muted-foreground">Password</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-muted-foreground/60" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder={mode === "signin" ? "••••••••" : "At least 6 characters"}
                  disabled={loading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-background/50 pl-10 pr-10 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground/60 hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Only in Sign Up Mode) */}
            <AnimatePresence>
              {mode === "signup" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-1 overflow-hidden"
                >
                  <label className="block text-xs font-semibold text-muted-foreground">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-4 w-4 text-muted-foreground/60" />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      disabled={loading}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-10 w-full rounded-xl border border-input bg-background/50 pl-10 pr-3 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all disabled:opacity-50"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary text-sm font-semibold text-white shadow-card transition-all hover:shadow-glow hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-card"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : mode === "signin" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>
          </form>
        </motion.div>


      </div>
    </div>
  );
}
