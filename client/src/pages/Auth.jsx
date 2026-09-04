import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Lock, Mail, User as UserIcon, ArrowRight, Sparkles, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

export function SignInPage() {
  const [isSignUp, setIsSignUp] = useState(false);
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
    <div className="flex justify-center items-center min-h-[80vh] px-4 py-8">
      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Ambient decorative glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Tab Selector */}
        <div className="flex bg-white/5 border border-white/10 rounded-full p-1 mb-6 relative z-10">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setError(""); }}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-full transition-all duration-200 ${
              !isSignUp
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20"
                : "text-white/70 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setError(""); }}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-full transition-all duration-200 ${
              isSignUp
                ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20"
                : "text-white/70 hover:text-white"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Title */}
        <div className="text-center mb-6 relative z-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-white via-orange-100 to-amber-200 bg-clip-text text-transparent">
            {isSignUp ? "Join Gurukul" : "Welcome Back"}
          </h2>
          <p className="text-white/70 text-xs sm:text-sm mt-1">
            {isSignUp
              ? "Create your account to start your personalized learning journey"
              : "Enter your email & password to access your assessment dashboard"}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/15 border border-red-500/30 text-red-300 text-xs sm:text-sm p-3 rounded-xl mb-4 relative z-10 animate-in fade-in">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {isSignUp && (
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/60 transition-all placeholder:text-white/30"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-white/80 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/60 transition-all placeholder:text-white/30"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/80 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/60 transition-all placeholder:text-white/30"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 focus:outline-none transition-colors p-0.5"
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
            className="w-full mt-2 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-orange-500/25 transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
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
      </div>
    </div>
  );
}

export function SignUpPage() {
  return <SignInPage />;
}
