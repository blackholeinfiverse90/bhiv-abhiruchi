import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Lock, Mail, User as UserIcon, ArrowRight, Sparkles, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

export function SignInPage({ defaultSignUp = false }) {
  const [isSignUp, setIsSignUp] = useState(defaultSignUp);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/intake";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        if (!fullName.trim()) {
          setError("Please enter your full name");
          setIsSubmitting(false);
          return;
        }

        const res = await register(fullName, email, password);
        if (res.success) {
          toast.success("Account created successfully!");
          if (res.user?.role === 'admin') {
            navigate("/admin", { replace: true });
          } else {
            navigate(from, { replace: true });
          }
        } else {
          setError(res.error || "Registration failed");
          toast.error(res.error || "Registration failed");
        }
      } else {
        const res = await login(email, password);
        if (res.success) {
          toast.success("Signed in successfully!");
          if (res.user?.role === 'admin') {
            navigate("/admin", { replace: true });
          } else {
            navigate(from, { replace: true });
          }
        } else {
          setError(res.error || "Invalid email or password");
          toast.error(res.error || "Invalid email or password");
        }
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[74vh]">
      <div className="w-full max-w-md bg-slate-950/75 backdrop-blur-2xl border border-white/15 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Subtle ambient corner accents */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="text-center mb-6 relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-400/25 text-orange-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gurukul Assessment Portal</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {isSignUp ? "Create Your Account" : "Welcome Back"}
          </h2>
          <p className="text-white/60 text-xs sm:text-sm leading-relaxed">
            {isSignUp
              ? "Register to start your field-aligned learning assessment"
              : "Sign in with your email and password to continue"}
          </p>
        </div>

        {/* Segmented Tab Selector */}
        <div className="flex bg-slate-900/80 border border-white/10 rounded-xl p-1 mb-6 relative z-10">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setError(""); }}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 ${
              !isSignUp
                ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                : "text-white/65 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setError(""); }}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 ${
              isSignUp
                ? "bg-orange-500 text-white shadow-md shadow-orange-500/20"
                : "text-white/65 hover:text-white"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/15 border border-red-500/30 text-red-200 text-xs sm:text-sm p-3 rounded-xl mb-4 relative z-10">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1.5">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/75 border border-white/15 text-white text-sm focus:outline-none focus:border-orange-500/80 focus:ring-1 focus:ring-orange-500/60 transition-all placeholder:text-white/35"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/75 border border-white/15 text-white text-sm focus:outline-none focus:border-orange-500/80 focus:ring-1 focus:ring-orange-500/60 transition-all placeholder:text-white/35"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900/75 border border-white/15 text-white text-sm focus:outline-none focus:border-orange-500/80 focus:ring-1 focus:ring-orange-500/60 transition-all placeholder:text-white/35"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/45 hover:text-white/85 focus:outline-none transition-colors p-0.5"
                title={showPassword ? "Hide password" : "Show password"}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-orange-400" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-orange-500/20 transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span>{isSignUp ? "Create Account" : "Sign In"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer switch link */}
        <div className="mt-5 pt-4 border-t border-white/10 text-center text-xs text-white/55 relative z-10">
          {isSignUp ? "Already have an account?" : "New to Gurukul?"}{" "}
          <button
            type="button"
            onClick={() => { setIsSignUp((prev) => !prev); setError(""); }}
            className="text-orange-400 hover:text-orange-300 font-semibold transition-colors"
          >
            {isSignUp ? "Sign In" : "Create Account"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SignUpPage() {
  return <SignInPage defaultSignUp />;
}
