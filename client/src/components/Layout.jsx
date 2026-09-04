import React, { useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAssessmentGuard } from "../context/AssessmentGuardContext";
import { i18n, useI18n } from "../lib/i18n";
import { LogOut, User as UserIcon } from "lucide-react";

export default function Layout() {
  const { user, isAuthenticated, logout } = useAuth();
  const { requestNavigation } = useAssessmentGuard();
  const isAdmin =
    (typeof window !== "undefined" && sessionStorage.getItem("is_admin") === "1") ||
    user?.role === "admin";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";

  // Language selection state using i18n
  const { t, lang } = useI18n();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langRefDesktop = React.useRef(null);
  const langRefMobile = React.useRef(null);
  const languages = [
    { code: "en", label: "English" },
    { code: "hi", label: "हिन्दी" },
    { code: "mr", label: "मराठी" },
  ];

  React.useEffect(() => {
    const onClick = (e) => {
      const inDesktop = langRefDesktop.current && langRefDesktop.current.contains(e.target);
      const inMobile = langRefMobile.current && langRefMobile.current.contains(e.target);
      if (!inDesktop && !inMobile) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const handleAdminLogout = () => {
    const doLogout = () => {
      sessionStorage.removeItem("is_admin");
      logout();
      navigate("/");
    };
    const proceed = requestNavigation(doLogout);
    if (proceed) {
      doLogout();
    }
  };

  const handleUserLogout = () => {
    const proceed = requestNavigation(() => logout());
    if (proceed) {
      logout();
    }
  };

  return (
    <div className="min-h-screen text-white">
      {/* Floating Pill Navbar */}
      <header className="sticky top-3 sm:top-4 z-50 max-w-6xl mx-auto px-3 sm:px-4">
        <div className="rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-4 sm:px-6 py-2 sm:py-2.5 shadow-2xl flex items-center justify-between transition-all duration-300 hover:border-white/30">
          
          {/* Circular Logo & Brand */}
          <Link
            to="/"
            onClick={(e) => {
              if (!requestNavigation("/")) e.preventDefault();
            }}
            className="flex items-center gap-3 group"
          >
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center p-1.5 overflow-hidden shadow-inner group-hover:scale-105 transition-transform duration-300">
              <img
                src="/blackhole-logo.png"
                alt="Blackhole logo"
                className="h-full w-full object-contain filter drop-shadow"
              />
            </div>
            <span className="text-base sm:text-lg font-semibold tracking-wide text-white">
              Gurukul
            </span>
          </Link>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center gap-3">
            
            {/* Nav Pill Links when Authenticated */}
            {isAuthenticated && (
              <div className="flex items-center gap-1.5">
                <NavLink
                  to="/dashboard"
                  onClick={(e) => {
                    if (!requestNavigation("/dashboard")) e.preventDefault();
                  }}
                  className={({ isActive }) =>
                    `rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                      isActive
                        ? "bg-white/25 border border-white/30 text-white shadow-sm"
                        : "border border-transparent hover:border-white/20 hover:bg-white/10 text-white/80"
                    }`
                  }
                >
                  {t("nav.dashboard")}
                </NavLink>
                <NavLink
                  to="/intake"
                  onClick={(e) => {
                    if (!requestNavigation("/intake")) e.preventDefault();
                  }}
                  className={({ isActive }) =>
                    `rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                      isActive
                        ? "bg-white/25 border border-white/30 text-white shadow-sm"
                        : "border border-transparent hover:border-white/20 hover:bg-white/10 text-white/80"
                    }`
                  }
                >
                  {t("nav.intake")}
                </NavLink>
                <NavLink
                  to="/assignment"
                  onClick={(e) => {
                    if (!requestNavigation("/assignment")) e.preventDefault();
                  }}
                  className={({ isActive }) =>
                    `rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                      isActive
                        ? "bg-white/25 border border-white/30 text-white shadow-sm"
                        : "border border-transparent hover:border-white/20 hover:bg-white/10 text-white/80"
                    }`
                  }
                >
                  {t("nav.assignment")}
                </NavLink>
                {isAdmin && (
                  <NavLink
                    to="/admin"
                    onClick={(e) => {
                      if (!requestNavigation("/admin")) e.preventDefault();
                    }}
                    className={({ isActive }) =>
                      `rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                        isActive
                          ? "bg-orange-500 text-white shadow-md border border-orange-400"
                          : "bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 border border-orange-500/40"
                      }`
                    }
                  >
                    Admin Panel
                  </NavLink>
                )}
              </div>
            )}

            {/* Language Dropdown */}
            <div className="relative" ref={langRefDesktop}>
              <button
                onClick={() => setIsLangOpen((v) => !v)}
                className="rounded-full px-3.5 py-1.5 text-xs font-medium border border-white/20 hover:bg-white/15 flex items-center gap-2 text-white/90 transition-all duration-200"
                aria-haspopup="listbox"
                aria-expanded={isLangOpen ? "true" : "false"}
                aria-label={t("nav.selectLanguage")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-80" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm7.94 9h-3.17a15.8 15.8 0 00-.77-4.02A8.02 8.02 0 0119.94 11zM12 4a13.9 13.9 0 011.9 5H10.1A13.9 13.9 0 0112 4zM8 5.98A15.8 15.8 0 007.23 11H4.06A8.02 8.02 0 018 5.98zM4.06 13h3.17c.16 1.39.5 2.74.99 3.98A8.02 8.02 0 014.06 13zM12 20a13.9 13.9 0 01-1.9-5h3.8A13.9 13.9 0 0112 20zm4-1.98A15.8 15.8 0 0016.77 13h3.17A8.02 8.02 0 0116 18.02zM8.94 13h6.12c-.15 1.37-.48 2.71-.98 3.94H9.92A17.9 17.9 0 018.94 13zm0-2c.15-1.37.48-2.71.98-3.94h4.16c.5 1.23.83 2.57.98 3.94H8.94z" />
                </svg>
                <span>
                  {languages.find((l) => l.code === lang)?.label || "English"}
                </span>
              </button>
              {isLangOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-2xl border border-white/20 bg-black/70 backdrop-blur-xl shadow-xl p-1.5 space-y-1 z-50">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        i18n.setLang(l.code);
                        setIsLangOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        lang === l.code ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10"
                      }`}
                      role="option"
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Auth Actions */}
            {isAdmin ? (
              <button
                onClick={handleAdminLogout}
                className="rounded-full bg-red-500/80 hover:bg-red-600 px-4 py-1.5 text-xs font-semibold shadow-md"
              >
                {t("nav.logoutAdmin")}
              </button>
            ) : isAuthenticated ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs">
                  <UserIcon className="w-3.5 h-3.5 text-orange-400" />
                  <span className="font-medium max-w-[120px] truncate">{user?.full_name || user?.email}</span>
                </div>
                <button
                  onClick={handleUserLogout}
                  title="Sign Out"
                  className="p-1.5 rounded-full bg-white/10 hover:bg-red-500/20 hover:text-red-300 border border-white/15 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Link
                to="/sign-in"
                onClick={(e) => {
                  if (!requestNavigation("/sign-in")) e.preventDefault();
                }}
                className="rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 px-4 py-1.5 text-xs font-semibold shadow-md transition-all"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile controls */}
          <div className="md:hidden flex items-center gap-2">
            <div className="relative" ref={langRefMobile}>
              <button
                onClick={() => setIsLangOpen((v) => !v)}
                className="rounded-full p-2 text-white hover:bg-white/10 border border-white/20 flex items-center gap-1 text-xs"
              >
                <span>{languages.find((l) => l.code === lang)?.label || "EN"}</span>
              </button>
              {isLangOpen && (
                <div className="absolute right-0 mt-2 w-36 rounded-2xl border border-white/20 bg-black/70 backdrop-blur-xl shadow-xl p-1 space-y-1 z-50">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        i18n.setLang(l.code);
                        setIsLangOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs ${
                        lang === l.code ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10"
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-full p-2 text-white hover:bg-white/10 border border-white/20"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-slate-950/90 backdrop-blur-2xl p-4 space-y-3 rounded-2xl mt-2 border border-white/20 shadow-2xl">
            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-orange-400" />
                  <span className="font-semibold">{user?.full_name || user?.email}</span>
                </div>
                <NavLink
                  to="/dashboard"
                  onClick={(e) => {
                    setIsMobileMenuOpen(false);
                    if (!requestNavigation("/dashboard")) e.preventDefault();
                  }}
                  className={({ isActive }) =>
                    `block w-full rounded-xl px-4 py-2.5 text-xs font-semibold ${
                      isActive ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white" : "bg-white/5 text-white/80"
                    }`
                  }
                >
                  {t("nav.dashboard")}
                </NavLink>
                <NavLink
                  to="/intake"
                  onClick={(e) => {
                    setIsMobileMenuOpen(false);
                    if (!requestNavigation("/intake")) e.preventDefault();
                  }}
                  className={({ isActive }) =>
                    `block w-full rounded-xl px-4 py-2.5 text-xs font-semibold ${
                      isActive ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white" : "bg-white/5 text-white/80"
                    }`
                  }
                >
                  {t("nav.intake")}
                </NavLink>
                <NavLink
                  to="/assignment"
                  onClick={(e) => {
                    setIsMobileMenuOpen(false);
                    if (!requestNavigation("/assignment")) e.preventDefault();
                  }}
                  className={({ isActive }) =>
                    `block w-full rounded-xl px-4 py-2.5 text-xs font-semibold ${
                      isActive ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white" : "bg-white/5 text-white/80"
                    }`
                  }
                >
                  {t("nav.assignment")}
                </NavLink>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleUserLogout();
                  }}
                  className="w-full text-left rounded-xl px-4 py-2.5 text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/sign-in"
                onClick={(e) => {
                  setIsMobileMenuOpen(false);
                  if (!requestNavigation("/sign-in")) e.preventDefault();
                }}
                className="block w-full text-center rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2.5 text-xs font-semibold text-white shadow-md"
              >
                Sign In
              </Link>
            )}
          </div>
        )}
      </header>
      <main key={`lang-${lang}`} className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
