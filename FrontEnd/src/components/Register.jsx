import { useState, useEffect } from "react";
import { register } from "../components/api"; // adjust path if needed
import { useNavigate } from "react-router-dom"; // for navigation after registration
import { Link } from "react-router-dom"; // for navigation to login page

// ── SVG Icons ─────────────────────────────────
const EyeOn = () => (
  <svg
    className="w-[15px] h-[15px]"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOff = () => (
  <svg
    className="w-[15px] h-[15px]"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);
const Sun = () => (
  <svg
    className="w-[14px] h-[14px]"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);
const Moon = () => (
  <svg className="w-[14px] h-[14px]" fill="currentColor" viewBox="0 0 24 24">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);
const ArrowRight = () => (
  <svg
    className="w-3.5 h-3.5"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);
const MailIcon = () => (
  <svg
    className="w-3.5 h-3.5 shrink-0"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);
const LockIcon = () => (
  <svg
    className="w-3.5 h-3.5 shrink-0"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const UserPlusIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="white"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="19" y1="8" x2="19" y2="14" />
    <line x1="22" y1="11" x2="16" y2="11" />
  </svg>
);
const CheckIcon = () => (
  <svg
    className="w-3.5 h-3.5 shrink-0"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// ── Main Component ────────────────────────────
export default function Register() {
  // ── Original state (unchanged) ──
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ── UI-only state ──
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mounted, setMounted] = useState(false);
  const [focused, setFocused] = useState(null);
  const [isDark, setIsDark] = useState(() => {
    // Shared with Login page
    const saved = localStorage.getItem("rag_theme");
    return saved ? saved === "dark" : true;
  });

  const navigate = useNavigate(); // Hook for navigation

  // Entrance animation trigger
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Persist theme (shared key with Login)
  useEffect(() => {
    localStorage.setItem("rag_theme", isDark ? "dark" : "light");
  }, [isDark]);

  // ── Original handler — logic untouched ──
  const handleRegister = async () => {
    setError("");
    setSuccess("");

    if (!name || !email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const res = await register(name, email, password);
      console.log("Register response", res.data);

      // Original: alert("Registered successfully") → replaced with inline success
      setSuccess("Registered successfully! Redirecting to login…");

      // Original: window.location.href = "/login"
      setTimeout(() => {
        localStorage.setItem(
          "taost",
          JSON.stringify({
            type: "success",
            message: "Registration Successful !",
          }),
        );
        navigate("/login");
      }, 400);
    } catch (err) {
      // Original error extraction preserved exactly
      const msg = err.response?.data?.error || "Registration failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") handleRegister();
  };

  // ── Theme-aware class helpers (mirrors Login.jsx) ──
  const bg = isDark ? "bg-[#070b14]" : "bg-[#f0fdf4]";
  const cardBg = isDark ? "bg-[#0d1424]" : "bg-white";
  const cardBdr = isDark ? "border-white/[0.07]" : "border-emerald-200/60";
  const cardShad = isDark
    ? "shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
    : "shadow-[0_20px_60px_rgba(34,197,94,0.1)]";
  const textHead = isDark ? "text-slate-100" : "text-slate-800";
  const textSub = isDark ? "text-slate-500" : "text-slate-400";
  const textMut = isDark ? "text-slate-500" : "text-slate-500";
  const labelCl = isDark ? "text-slate-500" : "text-slate-400";
  const inputBg = isDark ? "bg-[#111927]" : "bg-slate-50";
  const inputTxt = isDark ? "text-slate-200" : "text-slate-800";
  const inputPh = isDark ? "placeholder-slate-600" : "placeholder-slate-400";
  const iconCl = isDark ? "text-slate-600" : "text-slate-400";
  const divider = isDark ? "via-white/10" : "via-emerald-200/60";
  const togBg = isDark
    ? "bg-[#131e31] border-white/10 text-slate-400"
    : "bg-emerald-50 border-emerald-200 text-slate-500";
  const linkCl = isDark
    ? "text-blue-400 hover:text-blue-300"
    : "text-blue-600 hover:text-blue-500";
  const footTxt = isDark ? "text-slate-700" : "text-slate-400";

  // Green accent for register (matches original #22c55e button)
  const inputBorder = (field) => {
    if (focused === field)
      return isDark
        ? "border-emerald-500 ring-2 ring-emerald-500/20"
        : "border-emerald-400 ring-2 ring-emerald-400/20";
    return isDark ? "border-white/[0.07]" : "border-slate-200";
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes orb1 {
          0%,100% { transform: translate(0,0) scale(1); }
          40%      { transform: translate(28px,-22px) scale(1.07); }
          70%      { transform: translate(-18px,18px) scale(0.95); }
        }
        @keyframes orb2 {
          0%,100% { transform: translate(0,0) scale(1); }
          35%      { transform: translate(-26px,24px) scale(1.1); }
          68%      { transform: translate(22px,-14px) scale(0.93); }
        }
        @keyframes orb3 {
          0%,100% { transform: translate(0,0); }
          50%      { transform: translate(16px,20px); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes shake {
          0%,100% { transform: translateX(0);  }
          20%      { transform: translateX(-5px); }
          40%      { transform: translateX(5px);  }
          60%      { transform: translateX(-3px); }
          80%      { transform: translateX(3px);  }
        }
        @keyframes logoGlow {
          0%,100% { box-shadow: 0 0  0  0  rgba(34,197,94,0);    }
          50%      { box-shadow: 0 0 20px 4px rgba(34,197,94,0.3); }
        }
        @keyframes successPop {
          0%   { opacity:0; transform:scale(0.95) translateY(4px); }
          100% { opacity:1; transform:scale(1)    translateY(0);    }
        }

        .card-enter      { opacity:0; transform:translateY(22px); }
        .card-enter-done {
          opacity:1; transform:translateY(0);
          transition: opacity .55s cubic-bezier(.22,1,.36,1),
                      transform .55s cubic-bezier(.22,1,.36,1);
        }
        .field-enter { opacity:0; transform:translateY(10px); }
        .field-1 { transition:opacity .5s ease .10s,transform .5s cubic-bezier(.22,1,.36,1) .10s; }
        .field-2 { transition:opacity .5s ease .17s,transform .5s cubic-bezier(.22,1,.36,1) .17s; }
        .field-3 { transition:opacity .5s ease .24s,transform .5s cubic-bezier(.22,1,.36,1) .24s; }
        .field-4 { transition:opacity .5s ease .30s,transform .5s cubic-bezier(.22,1,.36,1) .30s; }
        .field-5 { transition:opacity .5s ease .36s,transform .5s cubic-bezier(.22,1,.36,1) .36s; }
        .field-done { opacity:1 !important; transform:translateY(0) !important; }

        .orb-1 { animation: orb1 13s ease-in-out infinite; }
        .orb-2 { animation: orb2 17s ease-in-out infinite; }
        .orb-3 { animation: orb3 11s ease-in-out infinite; }
        .logo-glow-green { animation: logoGlow 3s ease-in-out infinite; }
        .shimmer-btn { animation: shimmer 2.5s ease-in-out infinite; }
        .error-shake  { animation: shake 0.4s ease; }
        .success-pop  { animation: successPop 0.35s cubic-bezier(.22,1,.36,1) both; }
        .spinner {
          display:inline-block;
          width:15px; height:15px;
          border:2px solid rgba(255,255,255,0.3);
          border-top-color:#fff;
          border-radius:50%;
          animation:spin 0.7s linear infinite;
        }
        input:-webkit-autofill {
          -webkit-box-shadow:0 0 0 100px #111927 inset !important;
          -webkit-text-fill-color:#cbd5e1 !important;
        }
      `}</style>

      {/* ── Root ── */}
      <div
        className={`relative min-h-screen flex items-center justify-center ${bg} overflow-hidden transition-colors duration-500`}
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {/* ── Background orbs — green tint for Register ── */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className={`orb-1 absolute top-[8%] left-[12%] w-72 h-72 rounded-full blur-[60px] ${isDark ? "bg-emerald-600/10" : "bg-emerald-400/8"}`}
          />
          <div
            className={`orb-2 absolute bottom-[8%] right-[8%] w-80 h-80 rounded-full blur-[70px] ${isDark ? "bg-teal-600/8" : "bg-teal-400/6"}`}
          />
          <div
            className={`orb-3 absolute top-[48%] left-[52%] w-52 h-52 rounded-full blur-[50px] ${isDark ? "bg-cyan-500/6" : "bg-cyan-400/5"}`}
          />
          {/* Grid */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(${isDark ? "rgba(255,255,255,0.025)" : "rgba(34,197,94,0.04)"} 1px, transparent 1px),
                linear-gradient(90deg, ${isDark ? "rgba(255,255,255,0.025)" : "rgba(34,197,94,0.04)"} 1px, transparent 1px)
              `,
              backgroundSize: "52px 52px",
            }}
          />
        </div>

        {/* ── Theme toggle ── */}
        <button
          onClick={() => setIsDark((d) => !d)}
          className={`fixed top-4 right-4 z-50 w-9 h-9 rounded-xl border flex items-center justify-center transition-all duration-300 hover:scale-105 hover:opacity-80 ${togBg}`}
          title={isDark ? "Light mode" : "Dark mode"}
        >
          {isDark ? <Sun /> : <Moon />}
        </button>

        {/* ── Card ── */}
        <div
          className={`
            relative z-10 w-full max-w-[340px] mx-4
            ${cardBg} border ${cardBdr} ${cardShad}
            rounded-2xl px-7 py-7
            backdrop-blur-xl
            transition-colors duration-500
            ${mounted ? "card-enter-done" : "card-enter"}
          `}
        >
          {/* ── Logo + heading ── */}
          <div
            className={`text-center mb-6 field-enter field-1 ${mounted ? "field-done" : ""}`}
          >
            <div className="logo-glow-green w-11 h-11 mx-auto mb-3 rounded-[13px] bg-gradient-to-br from-emerald-600 to-emerald-400 flex items-center justify-center">
              <UserPlusIcon />
            </div>
            <h1
              className={`text-[18px] font-bold tracking-tight ${textHead} transition-colors duration-500`}
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              Create account
            </h1>
            <p
              className={`text-[12px] mt-0.5 ${textSub} transition-colors duration-500`}
            >
              Join RAG Assistant today
            </p>
          </div>

          {/* ── Error alert ── */}
          {error && (
            <div
              key={error}
              className={`error-shake mb-4 flex items-start gap-2 px-3 py-2.5 rounded-xl border text-[12px]
                ${
                  isDark
                    ? "bg-red-500/10 border-red-500/25 text-red-400"
                    : "bg-red-50 border-red-200 text-red-600"
                }`}
            >
              <span className="mt-px shrink-0 text-[13px]">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* ── Success alert ── */}
          {success && (
            <div
              className={`success-pop mb-4 flex items-start gap-2 px-3 py-2.5 rounded-xl border text-[12px]
                ${
                  isDark
                    ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                    : "bg-emerald-50 border-emerald-200 text-emerald-700"
                }`}
            >
              <span className="mt-px shrink-0">
                <CheckIcon />
              </span>
              <span>{success}</span>
            </div>
          )}

          {/* Name Filed */}

          <div
            className={`mb-3.5 field-enter field-1 ${mounted ? "field-done" : ""}`}
          >
            <label
              className={`block text-[10px] font-semibold uppercase tracking-widest mb-1.5 ${labelCl} transition-colors duration-500`}
            >
              Name
            </label>
            <div
              className={`flex items-center gap-2 px-3 h-[42px] rounded-xl border transition-all duration-200 ${inputBg} ${inputBorder("name")} transition-colors duration-500`}
            >
              <span className={iconCl}>
                <UserPlusIcon />
              </span>
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => setFocused("name")}
                onBlur={() => setFocused(null)}
                onKeyDown={handleKey}
                disabled={loading || !!success}
                className={`flex-1 bg-transparent outline-none border-none text-[13px] ${inputTxt} ${inputPh} disabled:opacity-50 transition-colors duration-500`}
              />
            </div>
          </div>

          {/* ── Email field ── */}
          <div
            className={`mb-3.5 field-enter field-2 ${mounted ? "field-done" : ""}`}
          >
            <label
              className={`block text-[10px] font-semibold uppercase tracking-widest mb-1.5 ${labelCl} transition-colors duration-500`}
            >
              Email
            </label>
            <div
              className={`flex items-center gap-2 px-3 h-[42px] rounded-xl border transition-all duration-200 ${inputBg} ${inputBorder("email")} transition-colors duration-500`}
            >
              <span className={iconCl}>
                <MailIcon />
              </span>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
                onKeyDown={handleKey}
                disabled={loading || !!success}
                className={`flex-1 bg-transparent outline-none border-none text-[13px] ${inputTxt} ${inputPh} disabled:opacity-50 transition-colors duration-500`}
              />
            </div>
          </div>

          {/* ── Password field ── */}
          <div
            className={`mb-5 field-enter field-3 ${mounted ? "field-done" : ""}`}
          >
            <label
              className={`block text-[10px] font-semibold uppercase tracking-widest mb-1.5 ${labelCl} transition-colors duration-500`}
            >
              Password
            </label>
            <div
              className={`flex items-center gap-2 px-3 h-[42px] rounded-xl border transition-all duration-200 ${inputBg} ${inputBorder("password")} transition-colors duration-500`}
            >
              <span className={iconCl}>
                <LockIcon />
              </span>
              <input
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocused("password")}
                onBlur={() => setFocused(null)}
                onKeyDown={handleKey}
                disabled={loading || !!success}
                className={`flex-1 bg-transparent outline-none border-none text-[13px] ${inputTxt} ${inputPh} disabled:opacity-50 transition-colors duration-500`}
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                tabIndex={-1}
                className={`${iconCl} hover:opacity-70 transition-opacity p-0.5 rounded shrink-0`}
              >
                {showPass ? <EyeOff /> : <EyeOn />}
              </button>
            </div>
          </div>

          {/* ── Register button — green accent matching original #22c55e ── */}
          <div className={`field-enter field-4 ${mounted ? "field-done" : ""}`}>
            <button
              onClick={handleRegister}
              disabled={loading || !!success}
              className={`
                relative w-full h-[42px] rounded-xl text-white text-[13px] font-semibold
                flex items-center justify-center gap-2 overflow-hidden
                transition-all duration-300
                ${
                  loading || success
                    ? "bg-emerald-700/50 cursor-not-allowed"
                    : "bg-gradient-to-r from-emerald-700 via-emerald-500 to-emerald-400 hover:brightness-110 active:scale-[0.98] cursor-pointer shadow-[0_6px_24px_rgba(34,197,94,0.35)] hover:shadow-[0_8px_32px_rgba(34,197,94,0.5)]"
                }
              `}
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              {/* Shimmer sweep on idle */}
              {!loading && !success && (
                <span
                  className="shimmer-btn pointer-events-none absolute inset-0 rounded-xl"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.14) 50%, transparent 100%)",
                    backgroundSize: "200% 100%",
                  }}
                />
              )}

              {loading ? (
                <>
                  <span className="spinner" />
                  <span>Creating account…</span>
                </>
              ) : success ? (
                <>
                  <CheckIcon />
                  <span>Registered!</span>
                </>
              ) : (
                <>
                  <span>Register</span>
                  <ArrowRight />
                </>
              )}
            </button>
          </div>

          {/* ── Login link — original text preserved ── */}
          <p
            className={`field-enter field-5 ${mounted ? "field-done" : ""} mt-4 text-center text-[12px] ${textMut} transition-colors duration-500`}
          >
            Already have account?{" "}
            <Link
              to="/login"
              className={`font-semibold transition-colors duration-200 ${linkCl}`}
            >
              Login
            </Link>
          </p>

          {/* ── Bottom divider ── */}
          <div
            className={`mt-5 h-px bg-gradient-to-r from-transparent ${divider} to-transparent`}
          />
          <p
            className={`mt-3 text-center text-[10px] tracking-wide ${footTxt} transition-colors duration-500`}
          >
            RAG Assistant · Secure Registration
          </p>
        </div>
      </div>
    </>
  );
}
