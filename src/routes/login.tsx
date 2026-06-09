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
  const [loading, setLoading] = useState(false);

  // Sign In States
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [signInErrorMsg, setSignInErrorMsg] = useState<string | null>(null);

  // Sign Up States
  const [signUpDisplayName, setSignUpDisplayName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [signUpErrorMsg, setSignUpErrorMsg] = useState<string | null>(null);

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInErrorMsg(null);

    if (!signInEmail || !signInPassword) {
      setSignInErrorMsg("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signInEmail,
        password: signInPassword,
      });

      if (error) throw error;
      toast.success("Successfully logged in!");
      navigate({ to: "/" });
    } catch (err) {
      const error = err as Error;
      setSignInErrorMsg(error.message || "An authentication error occurred.");
      toast.error(error.message || "Failed to authenticate.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpErrorMsg(null);

    if (!signUpEmail || !signUpPassword || !signUpConfirmPassword || !signUpDisplayName) {
      setSignUpErrorMsg("Please fill in all required fields.");
      return;
    }

    if (signUpPassword !== signUpConfirmPassword) {
      setSignUpErrorMsg("Passwords do not match.");
      return;
    }

    if (signUpPassword.length < 6) {
      setSignUpErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: signUpEmail,
        password: signUpPassword,
        options: {
          data: {
            display_name: signUpDisplayName,
            full_name: signUpDisplayName,
          },
        },
      });

      if (error) throw error;

      if (data.session) {
        toast.success("Successfully registered and logged in!");
        navigate({ to: "/" });
      } else {
        toast.success("Registration successful! Please check your email for verification link.");
        setMode("signin");
        setSignUpPassword("");
        setSignUpConfirmPassword("");
      }
    } catch (err) {
      const error = err as Error;
      setSignUpErrorMsg(error.message || "A registration error occurred.");
      toast.error(error.message || "Failed to register.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 surface-mesh">
      {/* Background Blobs for Visual Aesthetics */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/15 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-indigo-500/15 blur-[120px]" />

      {/* Main Double Slider Card */}
      <div
        className={`auth-slider-container glass-card rounded-3xl border border-border/60 bg-card/45 shadow-glow ${
          mode === "signup" ? "right-panel-active" : ""
        }`}
      >
        {/* 1. SIGN UP FORM PANEL */}
        <div className="auth-form-container auth-sign-up-container">
          <form onSubmit={handleSignUpSubmit} className="flex flex-col space-y-3.5 justify-center h-full">
            <div className="text-center mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow mx-auto mb-2.5 md:hidden">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground font-display">
                Create Account
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Register using your corporate email address
              </p>
            </div>

            {signUpErrorMsg && (
              <div className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{signUpErrorMsg}</div>
              </div>
            )}

            {/* Display Name Field */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-muted-foreground">Display Name</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User2 className="h-4 w-4 text-muted-foreground/60" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  disabled={loading}
                  value={signUpDisplayName}
                  onChange={(e) => setSignUpDisplayName(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-background/50 pl-10 pr-3 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all disabled:opacity-50"
                />
              </div>
            </div>

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
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
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
                  type={showSignUpPassword ? "text" : "password"}
                  required
                  placeholder="At least 6 characters"
                  disabled={loading}
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-background/50 pl-10 pr-10 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground/60 hover:text-foreground"
                >
                  {showSignUpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-muted-foreground">Confirm Password</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-muted-foreground/60" />
                </span>
                <input
                  type={showSignUpPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  disabled={loading}
                  value={signUpConfirmPassword}
                  onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-background/50 pl-10 pr-3 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary text-sm font-semibold text-white shadow-card transition-all hover:shadow-glow hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-card"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                "Create Account"
              )}
            </button>

            {/* Mobile-only switcher link */}
            <div className="text-center mt-3 md:hidden">
              <p className="text-xs text-muted-foreground">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setSignUpErrorMsg(null);
                  }}
                  className="font-semibold text-primary hover:underline"
                >
                  Sign In
                </button>
              </p>
            </div>
          </form>
        </div>

        {/* 2. SIGN IN FORM PANEL */}
        <div className="auth-form-container auth-sign-in-container">
          <form onSubmit={handleSignInSubmit} className="flex flex-col space-y-4 justify-center h-full">
            <div className="text-center mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow mx-auto mb-2.5 md:hidden">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground font-display">
                Sign In
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Enter your credentials to enter Amortix
              </p>
            </div>

            {signInErrorMsg && (
              <div className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 p-3.5 text-xs text-destructive">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{signInErrorMsg}</div>
              </div>
            )}

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
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
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
                  type={showSignInPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  disabled={loading}
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-background/50 pl-10 pr-10 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowSignInPassword(!showSignInPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground/60 hover:text-foreground"
                >
                  {showSignInPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary text-sm font-semibold text-white shadow-card transition-all hover:shadow-glow hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-card"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                "Sign In"
              )}
            </button>

            {/* Mobile-only switcher link */}
            <div className="text-center mt-3 md:hidden">
              <p className="text-xs text-muted-foreground">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setSignInErrorMsg(null);
                  }}
                  className="font-semibold text-primary hover:underline"
                >
                  Create Account
                </button>
              </p>
            </div>
          </form>
        </div>

        {/* 3. DESKTOP SLIDING OVERLAY CONTAINER */}
        <div className="auth-overlay-container hidden md:block">
          <div className="auth-overlay">
            {/* Left Overlay panel (displays when signup mode is active, switch to signin) */}
            <div className="auth-overlay-panel auth-overlay-left">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md shadow-glow mb-4 border border-white/20">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-extrabold font-display text-white mb-2">Welcome Back!</h1>
              <p className="text-sm text-white/80 leading-relaxed mb-6 max-w-[280px]">
                To stay connected with your amortization analysis tools, please log in with your credentials.
              </p>
              <button
                onClick={() => {
                  setMode("signin");
                  setSignUpErrorMsg(null);
                }}
                className="px-8 py-2.5 rounded-xl border border-white text-sm font-semibold text-white bg-transparent hover:bg-white/15 active:scale-95 transition-all shadow-soft cursor-pointer"
              >
                Sign In
              </button>
            </div>

            {/* Right Overlay panel (displays when signin mode is active, switch to signup) */}
            <div className="auth-overlay-panel auth-overlay-right">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md shadow-glow mb-4 border border-white/20">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-extrabold font-display text-white mb-2">New to Amortix?</h1>
              <p className="text-sm text-white/80 leading-relaxed mb-6 max-w-[280px]">
                Set up your workspace and start managing corporate loan amortization schedules in seconds.
              </p>
              <button
                onClick={() => {
                  setMode("signup");
                  setSignInErrorMsg(null);
                }}
                className="px-8 py-2.5 rounded-xl border border-white text-sm font-semibold text-white bg-transparent hover:bg-white/15 active:scale-95 transition-all shadow-soft cursor-pointer"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
