/**
 * Toast.jsx — Premium animated toast notification
 *
 * Original functionality preserved 100%:
 *  ✦ Reads from localStorage "toast" key
 *  ✦ Parses { type, message } — supports "success" and any other type (error)
 *  ✦ Removes from localStorage after reading
 *  ✦ Auto-hides after 3000ms
 *
 * Added (UI only):
 *  ✦ Smooth slide-in from top-right + slide-out on dismiss
 *  ✦ Animated progress bar countdown
 *  ✦ Icon per type (success / error / warning / info)
 *  ✦ Manual dismiss button
 *  ✦ Subtle shimmer + glow effects
 *  ✦ Dark glass-morphism card design
 *
 * Usage: mount <Toast /> once at the root of your app (e.g. App.jsx)
 * To trigger: localStorage.setItem("toast", JSON.stringify({ type: "success", message: "Done!" }))
 */

import { useEffect, useState } from "react";

// ── Icons ────────────────────────────────────
const SuccessIcon = () => (
  <svg
    className="w-4 h-4"
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
const ErrorIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const InfoIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const WarningIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const CloseIcon = () => (
  <svg
    className="w-3 h-3"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ── Type config ─────────────────────────────
const TYPE_CONFIG = {
  success: {
    icon: <SuccessIcon />,
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
    border: "border-emerald-500/25",
    bar: "bg-gradient-to-r from-emerald-500 to-emerald-400",
    glow: "shadow-[0_0_30px_rgba(34,197,94,0.12)]",
    label: "Success",
    labelColor: "text-emerald-400",
  },
  error: {
    icon: <ErrorIcon />,
    iconBg: "bg-red-500/20",
    iconColor: "text-red-400",
    border: "border-red-500/25",
    bar: "bg-gradient-to-r from-red-500 to-red-400",
    glow: "shadow-[0_0_30px_rgba(239,68,68,0.12)]",
    label: "Error",
    labelColor: "text-red-400",
  },
  warning: {
    icon: <WarningIcon />,
    iconBg: "bg-amber-500/20",
    iconColor: "text-amber-400",
    border: "border-amber-500/25",
    bar: "bg-gradient-to-r from-amber-500 to-amber-400",
    glow: "shadow-[0_0_30px_rgba(245,158,11,0.12)]",
    label: "Warning",
    labelColor: "text-amber-400",
  },
  info: {
    icon: <InfoIcon />,
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-400",
    border: "border-blue-500/25",
    bar: "bg-gradient-to-r from-blue-500 to-blue-400",
    glow: "shadow-[0_0_30px_rgba(59,130,246,0.12)]",
    label: "Info",
    labelColor: "text-blue-400",
  },
};

const DURATION = 3000; // ms — matches original

export default function Toast() {
  const [toast, setToast] = useState(null);
  const [visible, setVisible] = useState(false); // controls slide-in
  const [leaving, setLeaving] = useState(false); // controls slide-out
  const [progress, setProgress] = useState(100); // progress bar 100→0

  // ── Original logic: read from localStorage ──
  useEffect(() => {
    const stored = localStorage.getItem("toast");
    if (stored) {
      const data = JSON.parse(stored);
      setToast(data);
      localStorage.removeItem("toast"); // original: remove after reading

      // Trigger entrance
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });

      // Progress bar countdown
      const startTime = Date.now();
      const tick = () => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / DURATION) * 100);
        setProgress(remaining);
        if (remaining > 0) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);

      // Original: auto-hide after 3000ms
      const hideTimer = setTimeout(() => dismiss(), DURATION);
      return () => clearTimeout(hideTimer);
    }
  }, []);

  const dismiss = () => {
    setLeaving(true);
    setTimeout(() => {
      setToast(null);
      setVisible(false);
      setLeaving(false);
    }, 420);
  };

  if (!toast) return null;

  const cfg = TYPE_CONFIG[toast.type] || TYPE_CONFIG.info;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');

        @keyframes toastIn {
          0%   { transform: translateX(calc(100% + 24px)) scale(0.92); opacity: 0;   filter: blur(4px); }
          60%  { transform: translateX(-6px)               scale(1.01); opacity: 1;   filter: blur(0);   }
          80%  { transform: translateX(3px)                scale(0.99);               }
          100% { transform: translateX(0)                  scale(1);                  }
        }
        @keyframes toastOut {
          0%   { transform: translateX(0)                  scale(1);    opacity: 1; filter: blur(0);   }
          30%  { transform: translateX(-8px)               scale(1.01);             }
          100% { transform: translateX(calc(100% + 24px))  scale(0.92); opacity: 0; filter: blur(4px); }
        }
        @keyframes iconPop {
          0%   { transform: scale(0.5) rotate(-15deg); opacity: 0; }
          70%  { transform: scale(1.2) rotate(4deg);  opacity: 1; }
          100% { transform: scale(1)   rotate(0deg);              }
        }
        @keyframes shimmerSlide {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%);  }
        }
        @keyframes pulseRing {
          0%,100% { opacity: 0.4; transform: scale(1);    }
          50%      { opacity: 0;   transform: scale(1.5);  }
        }

        .toast-in  { animation: toastIn  0.52s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .toast-out { animation: toastOut 0.42s cubic-bezier(0.55, 0, 1, 0.45)  both; }
        .icon-pop  { animation: iconPop  0.5s  cubic-bezier(0.22, 1, 0.36, 1) 0.12s both; }
        .shimmer-once {
          position: relative; overflow: hidden;
        }
        .shimmer-once::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.07) 50%, transparent 65%);
          animation: shimmerSlide 1.2s ease 0.3s 1 both;
        }
        .pulse-ring {
          animation: pulseRing 1.8s ease-out 0.2s 2;
        }
      `}</style>

      {/* ── Toast wrapper ── */}
      <div
        className={`fixed top-5 right-5 z-[9999] ${visible && !leaving ? "toast-in" : leaving ? "toast-out" : "opacity-0"}`}
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {/* ── Card ── */}
        <div
          className={`
          relative w-[300px] overflow-hidden
          bg-[#0d1424]/95 backdrop-blur-2xl
          border ${cfg.border}
          rounded-2xl
          ${cfg.glow}
          shimmer-once
        `}
        >
          {/* Top accent line */}
          <div
            className={`absolute top-0 left-6 right-6 h-px ${cfg.bar} opacity-60`}
          />

          {/* Inner content */}
          <div className="flex items-start gap-3 px-4 pt-4 pb-3.5">
            {/* Icon with pulse ring */}
            <div className="relative shrink-0 mt-0.5">
              {/* Pulse ring */}
              <div
                className={`pulse-ring absolute inset-0 rounded-full ${cfg.iconBg}`}
              />
              {/* Icon circle */}
              <div
                className={`icon-pop relative w-8 h-8 rounded-full ${cfg.iconBg} ${cfg.iconColor} flex items-center justify-center`}
              >
                {cfg.icon}
              </div>
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0 pt-0.5">
              <p
                className={`text-[11px] font-semibold uppercase tracking-widest mb-0.5 ${cfg.labelColor}`}
              >
                {toast.label || cfg.label}
              </p>
              <p className="text-[13px] text-slate-200 font-medium leading-snug break-words">
                {toast.message}
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={dismiss}
              className="shrink-0 mt-0.5 w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 text-slate-500 hover:text-slate-300 flex items-center justify-center transition-all duration-150 hover:scale-110 active:scale-95"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Progress bar */}
          <div className="px-4 pb-3.5">
            <div className="h-[3px] w-full rounded-full bg-white/5 overflow-hidden">
              <div
                className={`h-full rounded-full ${cfg.bar} transition-none`}
                style={{
                  width: `${progress}%`,
                  transition:
                    progress < 100 ? `width ${DURATION}ms linear` : "none",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
