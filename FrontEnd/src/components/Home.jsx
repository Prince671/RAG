/**
 * AIRagAssistant.jsx — Complete Fixed Version
 *
 * ═══════════════════════════════════════════════════════════════
 *  CHANGES & FIXES LOG
 * ═══════════════════════════════════════════════════════════════
 *
 * [1] OUT-OF-CONTEXT WARNING BANNER
 *     When the AI answer indicates the info isn't in the document,
 *     a yellow ⚠ banner appears at the bottom of the bot bubble.
 *     Detects phrases: "not found in", "no information", "don't know",
 *     "not mentioned", "cannot find", "no context", "not available",
 *     "outside the scope", "not in the document", etc.
 *
 * [2] COPY BUTTON ON EVERY MESSAGE
 *     Each bubble (user + bot) shows a copy icon in the top-right
 *     corner on hover. Turns green ✓ for 2s after copying.
 *
 * [3] VOICE TYPING BUTTON
 *     Microphone button added between file-attach and textarea.
 *     Uses Web Speech API (Chrome/Edge). Red pulsing ring while
 *     recording. Appends transcript to current input. Shows a
 *     toast if browser doesn't support speech recognition.
 *
 * [4] TYPING EFFECT BUG FIX
 *     setTyping(false) was called in `finally` BEFORE the interval
 *     finished — this cut off the streaming effect. Fixed: only
 *     setTyping(false) inside the interval callback when i >= fullText.length.
 *
 * [5] TOKEN KEY CONSISTENCY FIX
 *     api.js uses `access_token` but the component checked `token`.
 *     Now both consistently use `access_token`.
 *
 * [6] DUPLICATE handleUpload REMOVED
 *     Old unused `handleUpload` function removed. Only `handleFile`
 *     drives uploads (with animated overlay).
 *
 * [7] IMPORT CLEANUP
 *     Removed unused `getDocuments` and `deleteAllDocument` imports.
 *
 * [8] INTERVAL CLEANUP ON UNMOUNT
 *     typingIntervalRef and progressIntervalRef are cleared in a
 *     useEffect cleanup so no state updates happen after unmount.
 * ═══════════════════════════════════════════════════════════════
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { logout, uploadDocument, askQuestion, getMe } from "./api";
import { useNavigate } from "react-router-dom";

// ─────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────
function emailInitial(email = "") {
  return (email[0] || "?").toUpperCase();
}
function timestamp() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// [1] Phrases that signal the answer is outside the document's context
const OUT_OF_CONTEXT_PATTERNS = [
  "not found in",
  "not mentioned",
  "no information",
  "i don't have information",
  "i don't know",
  "cannot find",
  "could not find",
  "couldn't find",
  "no context",
  "not available in",
  "outside the scope",
  "not in the document",
  "not provided in",
  "document does not",
  "not covered",
  "no relevant",
  "doesn't contain",
  "does not contain",
  "not specified",
  "not discussed",
  "based on the provided",
  "not present in",
  "unable to find",
];
function isOutOfContext(text = "") {
  const lower = text.toLowerCase();
  return OUT_OF_CONTEXT_PATTERNS.some((p) => lower.includes(p));
}

// ─────────────────────────────────────────────────────────────────
//  [2] COPY BUTTON  (shown on hover on every bubble)
// ─────────────────────────────────────────────────────────────────
function CopyButton({ text, isDark, isUser }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Safari / insecure context fallback
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      title={copied ? "Copied!" : "Copy"}
      className={`
        copy-btn opacity-0 group-hover:opacity-100
        transition-all duration-150 w-6 h-6 rounded-md
        flex items-center justify-center shrink-0
        ${
          copied
            ? "bg-emerald-500/20 text-emerald-400"
            : isUser
              ? "bg-white/15 hover:bg-white/25 text-white/60 hover:text-white"
              : isDark
                ? "bg-white/5 hover:bg-white/10 text-slate-500 hover:text-slate-200"
                : "bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700"
        }
      `}
    >
      {copied ? (
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────
//  [1] OUT-OF-CONTEXT WARNING BANNER
// ─────────────────────────────────────────────────────────────────
function OutOfContextBanner({ isDark }) {
  return (
    <div
      className={`flex items-start gap-2.5 mt-3 px-3 py-2.5 rounded-xl border text-[12px] leading-snug ${
        isDark
          ? "bg-amber-500/10 border-amber-500/25 text-amber-300"
          : "bg-amber-50 border-amber-200 text-amber-700"
      }`}
    >
      <svg
        className="w-4 h-4 shrink-0 mt-px"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <span>
        <strong className="font-semibold">
          Context not found in document.
        </strong>{" "}
        This information may not be present in the uploaded file. Try rephrasing
        your question or upload a more relevant document.
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  FORMATTED MESSAGE  (markdown renderer)
// ─────────────────────────────────────────────────────────────────
function FormattedMessage({ text, isDark, isUser }) {
  const [copiedIdx, setCopiedIdx] = useState(null);

  const handleCopyCode = (code, idx) => {
    navigator.clipboard.writeText(code);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const codeBlockRe = /```(\w*)\n?([\s\S]*?)```/g;
  const parts = [];
  let last = 0,
    codeIdx = 0,
    match;
  while ((match = codeBlockRe.exec(text)) !== null) {
    if (match.index > last)
      parts.push({ type: "text", content: text.slice(last, match.index) });
    parts.push({
      type: "code",
      lang: match[1] || "plaintext",
      content: match[2].trim(),
      idx: codeIdx++,
    });
    last = match.index + match[0].length;
  }
  if (last < text.length)
    parts.push({ type: "text", content: text.slice(last) });

  const renderInline = (str) => {
    const tokenRe = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
    const tokens = [];
    let li = 0,
      tm;
    while ((tm = tokenRe.exec(str)) !== null) {
      if (tm.index > li)
        tokens.push(<span key={`t${li}`}>{str.slice(li, tm.index)}</span>);
      const t = tm[0];
      if (t.startsWith("**"))
        tokens.push(
          <strong key={`b${tm.index}`} className="font-bold">
            {t.slice(2, -2)}
          </strong>,
        );
      else if (t.startsWith("`"))
        tokens.push(
          <code
            key={`c${tm.index}`}
            className={`px-1.5 py-0.5 rounded text-[12px] font-mono ${isUser ? "bg-white/20 text-white" : isDark ? "bg-black/30 text-emerald-300" : "bg-slate-200 text-rose-600"}`}
          >
            {t.slice(1, -1)}
          </code>,
        );
      else
        tokens.push(
          <em key={`i${tm.index}`} className="italic">
            {t.slice(1, -1)}
          </em>,
        );
      li = tm.index + t.length;
    }
    if (li < str.length)
      tokens.push(<span key={`e${li}`}>{str.slice(li)}</span>);
    return tokens;
  };

  const renderTextBlock = (content, key) => {
    const lines = content.split("\n");
    const elements = [];
    let i = 0;
    while (i < lines.length) {
      const trimmed = lines[i].trim();
      if (/^#{1,3}\s/.test(trimmed)) {
        const level = trimmed.match(/^(#{1,3})/)[1].length;
        const txt = trimmed.replace(/^#{1,3}\s+/, "");
        const cls =
          level === 1
            ? "text-[15px] font-extrabold mt-3 mb-1"
            : level === 2
              ? "text-[13px] font-bold mt-2.5 mb-0.5"
              : `text-[12px] font-semibold mt-2 mb-0.5 uppercase tracking-wide ${isUser ? "text-white/70" : "text-slate-400"}`;
        elements.push(
          <div key={`h${i}`} className={cls}>
            {renderInline(txt)}
          </div>,
        );
        i++;
        continue;
      }
      if (/^[-•*]\s/.test(trimmed)) {
        const items = [];
        while (i < lines.length && /^[-•*]\s/.test(lines[i].trim())) {
          items.push(lines[i].trim().replace(/^[-•*]\s+/, ""));
          i++;
        }
        elements.push(
          <ul key={`ul${i}`} className="mt-1.5 mb-1.5 space-y-1.5 list-none">
            {items.map((item, ii) => (
              <li key={ii} className="flex items-start gap-2">
                <span
                  className="mt-[6px] w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{
                    background: isUser ? "rgba(255,255,255,0.7)" : "#3b82f6",
                  }}
                />
                <span>{renderInline(item)}</span>
              </li>
            ))}
          </ul>,
        );
        continue;
      }
      if (/^\d+\.\s/.test(trimmed)) {
        const items = [];
        let num = 1;
        while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
          items.push({
            n: num++,
            text: lines[i].trim().replace(/^\d+\.\s+/, ""),
          });
          i++;
        }
        elements.push(
          <ol key={`ol${i}`} className="mt-1.5 mb-1.5 space-y-1.5">
            {items.map((item, ii) => (
              <li key={ii} className="flex items-start gap-2">
                <span
                  className={`text-[11px] font-bold min-w-[18px] mt-0.5 ${isUser ? "text-white/80" : "text-blue-400"}`}
                >
                  {item.n}.
                </span>
                <span>{renderInline(item.text)}</span>
              </li>
            ))}
          </ol>,
        );
        continue;
      }
      if (/^---+$/.test(trimmed)) {
        elements.push(
          <hr
            key={`hr${i}`}
            className={`my-2 border-t ${isUser ? "border-white/20" : isDark ? "border-white/10" : "border-black/10"}`}
          />,
        );
        i++;
        continue;
      }
      if (trimmed === "") {
        elements.push(<div key={`sp${i}`} className="h-1.5" />);
        i++;
        continue;
      }
      elements.push(
        <p key={`p${i}`} className="leading-relaxed">
          {renderInline(trimmed)}
        </p>,
      );
      i++;
    }
    return (
      <div key={key} className="space-y-0.5 text-[13px]">
        {elements}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {parts.map((part, i) =>
        part.type === "code" ? (
          <div
            key={i}
            className={`rounded-xl overflow-hidden border ${isUser ? "border-white/20 bg-black/30" : isDark ? "border-white/10 bg-[#0d1117]" : "border-black/10 bg-[#1e1e2e]"}`}
          >
            <div
              className={`flex items-center justify-between px-3 py-1.5 border-b ${isUser ? "border-white/20 bg-white/5" : isDark ? "border-white/10 bg-white/5" : "border-black/10 bg-black/5"}`}
            >
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                {part.lang}
              </span>
              <button
                onClick={() => handleCopyCode(part.content, part.idx)}
                className={`text-[10px] flex items-center gap-1 px-2 py-0.5 rounded transition-all ${copiedIdx === part.idx ? "text-green-400 bg-green-400/10" : "text-slate-400 hover:text-white hover:bg-white/10"}`}
              >
                {copiedIdx === part.idx ? "✓ Copied" : "⎘ Copy"}
              </button>
            </div>
            <pre className="px-4 py-3 overflow-x-auto text-[12px] font-mono text-slate-300 leading-relaxed whitespace-pre">
              <code>{part.content}</code>
            </pre>
          </div>
        ) : (
          renderTextBlock(part.content, i)
        ),
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  TOAST
// ─────────────────────────────────────────────────────────────────
function Toast({ toasts, remove, isDark }) {
  const icons = { success: "✅", error: "❌", info: "ℹ️", warning: "⚠️" };
  const borders = {
    success: "border-l-green-400",
    error: "border-l-red-400",
    info: "border-l-blue-400",
    warning: "border-l-yellow-400",
  };
  return (
    <div className="fixed top-4 right-4 flex flex-col gap-2 z-[9999] max-w-[calc(100vw-2rem)]">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast-slide flex items-start gap-3 min-w-[220px] max-w-xs border ${borders[t.type]} border-l-4 rounded-xl px-4 py-3 shadow-2xl ${isDark ? "bg-[#1e293b] border-[#334155]" : "bg-white border-slate-200"}`}
        >
          <span className="text-base shrink-0">{icons[t.type]}</span>
          <div className="flex-1 min-w-0">
            <p
              className={`font-semibold text-[13px] ${isDark ? "text-white" : "text-slate-800"}`}
            >
              {t.title}
            </p>
            {t.msg && (
              <p className="text-[12px] text-slate-400 mt-0.5 break-words">
                {t.msg}
              </p>
            )}
          </div>
          <button
            onClick={() => remove(t.id)}
            className="text-slate-400 hover:text-red-400 text-xs ml-1 shrink-0"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  UPLOAD OVERLAY
// ─────────────────────────────────────────────────────────────────
function UploadOverlay({
  stage,
  simulatedPercent,
  fileName,
  onCancel,
  isDark,
}) {
  if (!stage) return null;
  const stages = {
    uploading: {
      icon: "📤",
      label: "Uploading Document",
      sub: fileName || "Sending file…",
      color: "#3b82f6",
      ring: "#60a5fa",
    },
    processing: {
      icon: "⚙️",
      label: "Processing Document",
      sub: "Extracting & indexing content…",
      color: "#8b5cf6",
      ring: "#a78bfa",
    },
    ready: {
      icon: "✅",
      label: "Ready to use!",
      sub: "You can now ask questions about your file",
      color: "#10b981",
      ring: "#34d399",
    },
  };
  const s = stages[stage];
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0f172a]/85 backdrop-blur-md" />
      <div
        className={`relative z-10 flex flex-col items-center gap-5 rounded-2xl px-6 sm:px-10 py-9 shadow-2xl w-full max-w-sm border ${isDark ? "bg-[#1e293b] border-[#334155]" : "bg-white border-slate-200"}`}
      >
        <div className="relative flex items-center justify-center w-20 h-20">
          {stage !== "ready" && (
            <div
              className="absolute inset-0 rounded-full animate-ping opacity-15"
              style={{ background: s.color }}
            />
          )}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-3xl z-10"
            style={{
              background: s.color + "22",
              border: `2px solid ${s.color}55`,
            }}
          >
            {s.icon}
          </div>
        </div>
        <div className="text-center">
          <p
            className={`font-bold text-[17px] ${isDark ? "text-white" : "text-slate-800"}`}
          >
            {s.label}
          </p>
          <p className="text-slate-400 text-sm mt-1">{s.sub}</p>
        </div>
        <div className="w-full">
          <div
            className={`w-full h-2.5 rounded-full overflow-hidden ${isDark ? "bg-[#334155]" : "bg-slate-200"}`}
          >
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${simulatedPercent}%`,
                background: `linear-gradient(90deg, ${s.color}, ${s.ring})`,
                boxShadow: `0 0 10px ${s.color}88`,
              }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[11px] text-slate-500 capitalize">
              {stage}…
            </span>
            <span
              className="text-[11px] font-semibold"
              style={{ color: s.color }}
            >
              {Math.round(simulatedPercent)}%
            </span>
          </div>
        </div>
        {stage === "processing" && (
          <div className="flex gap-2">
            {[0, 150, 300, 450].map((d) => (
              <span
                key={d}
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ background: s.color, animationDelay: `${d}ms` }}
              />
            ))}
          </div>
        )}
        {stage === "uploading" && (
          <button
            onClick={onCancel}
            className="text-xs text-slate-500 hover:text-red-400 border border-[#334155] hover:border-red-400 px-5 py-1.5 rounded-lg transition-all"
          >
            Cancel Upload
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  PROFILE DROPDOWN & BUTTON
// ─────────────────────────────────────────────────────────────────
function ProfileDropdown({ user, onClose, onSignOut, isDark, navigate }) {
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className={`absolute right-0 top-12 w-56 rounded-2xl shadow-2xl z-50 overflow-hidden animate-drop-in border ${isDark ? "bg-[#1e293b] border-[#334155]" : "bg-white border-slate-200"}`}
    >
      <div
        className={`px-4 py-4 border-b flex items-center gap-3 ${isDark ? "border-[#334155]" : "border-slate-100"}`}
      >
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shrink-0 ring-2 ring-white/10">
          {emailInitial(user.email)}
        </div>
        <div className="min-w-0">
          <p
            className={`font-semibold text-sm truncate ${isDark ? "text-white" : "text-slate-800"}`}
          >
            {user.name}
          </p>
          <p className="text-xs text-slate-400 truncate">{user.email}</p>
          {user.role && (
            <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">
              {user.role}
            </span>
          )}
        </div>
      </div>
      <div className="py-1.5">
        <button
          onClick={() => {
            navigate("/documents");
            onClose();
          }}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-colors text-left"
        >
          <span className="text-base w-5 text-center">📄</span>My Documents
        </button>
      </div>
      <div className="py-1.5">
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left"
        >
          <span className="text-base w-5 text-center">🚪</span>Sign Out
        </button>
      </div>
    </div>
  );
}

function ProfileButton({ user, onSignOut, isDark, navigate }) {
  const [open, setOpen] = useState(false);
  const displayName = user.email ? user.email.split("@")[0] : user.name;
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 rounded-full border transition-all p-0.5 pr-2 sm:pr-3 group ${isDark ? "border-[#334155] hover:border-slate-500" : "border-slate-300 hover:border-slate-400"}`}
        title={user.email}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
          {emailInitial(user.email)}
        </div>
        <span
          className={`text-[13px] transition-colors hidden sm:block max-w-[80px] lg:max-w-[110px] truncate ${isDark ? "text-slate-300 group-hover:text-white" : "text-slate-600 group-hover:text-slate-900"}`}
        >
          {displayName}
        </span>
        <svg
          className="w-3.5 h-3.5 text-slate-500 hidden sm:block"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {open && (
        <ProfileDropdown
          user={user}
          onClose={() => setOpen(false)}
          onSignOut={onSignOut}
          isDark={isDark}
          navigate={navigate}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  TYPING INDICATOR
// ─────────────────────────────────────────────────────────────────
function TypingIndicator({ isDark }) {
  return (
    <div className="self-start">
      <div
        className={`flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-bl-sm w-fit border ${isDark ? "bg-[#263348] border-[#334155]" : "bg-white border-slate-200 shadow-sm"}`}
      >
        {[0, 200, 400].map((delay) => (
          <span
            key={delay}
            className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  [2] MESSAGE BUBBLE  — with copy button + [1] out-of-context warning
// ─────────────────────────────────────────────────────────────────
function Message({ msg, isDark }) {
  const isUser = msg.role === "user";
  // Only show warning for RAG mode bot messages that indicate missing context
  const showWarning =
    !isUser &&
    msg.mode === "rag" &&
    msg.text.length > 10 &&
    isOutOfContext(msg.text);

  return (
    <div
      className={`flex flex-col max-w-[90%] sm:max-w-[80%] md:max-w-[75%] animate-fade-up group ${isUser ? "self-end items-end" : "self-start items-start"}`}
    >
      <div
        className={`relative px-4 py-3 rounded-2xl text-sm leading-relaxed break-words w-full ${
          isUser
            ? "bg-blue-500 text-white rounded-br-sm"
            : msg.mode === "smart"
              ? isDark
                ? "bg-[#1e1b3a] text-slate-100 rounded-bl-sm border border-[#4c3f88]"
                : "bg-violet-50 text-slate-800 rounded-bl-sm border border-violet-200"
              : isDark
                ? "bg-[#263348] text-slate-100 rounded-bl-sm border border-[#334155]"
                : "bg-white text-slate-800 rounded-bl-sm border border-slate-200 shadow-sm"
        }`}
      >
        {/* ── Copy button top-right ── */}
        <div className="absolute top-2 right-2">
          <CopyButton text={msg.text} isDark={isDark} isUser={isUser} />
        </div>

        {/* Padding so text clears the copy button */}
        <div className="pr-8">
          <FormattedMessage text={msg.text} isDark={isDark} isUser={isUser} />
        </div>

        {/* ── [1] Out-of-context warning ── */}
        {showWarning && <OutOfContextBanner isDark={isDark} />}
      </div>

      <div className="flex items-center gap-1.5 mt-1 px-1">
        <span className="text-[10px] text-slate-500">{msg.time}</span>
        {!isUser && (
          <span
            className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${msg.mode === "rag" ? "bg-blue-900/50 text-blue-400" : "bg-violet-900/50 text-violet-400"}`}
          >
            {msg.mode}
          </span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  HISTORY ITEM
// ─────────────────────────────────────────────────────────────────
function HistoryItem({ item, isDark }) {
  return (
    <div
      className={`px-3 py-2.5 mb-1.5 rounded-lg cursor-pointer border transition-all ${isDark ? "bg-[#263348] border-transparent hover:border-[#334155] hover:bg-[#2d3d55]" : "bg-slate-100 border-transparent hover:border-slate-300 hover:bg-slate-200"}`}
    >
      <div
        className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${item.mode === "rag" ? "text-blue-400" : "text-violet-400"}`}
      >
        {item.mode}
      </div>
      <div className="text-xs text-slate-400 truncate">{item.text}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
//  MOBILE SIDEBAR DRAWER
// ─────────────────────────────────────────────────────────────────
function MobileSidebar({ open, onClose, history, onClearHistory, isDark }) {
  const border = isDark ? "border-[#334155]" : "border-slate-200";
  const surface = isDark ? "bg-[#1e293b]" : "bg-white";
  const textSub = isDark ? "text-slate-400" : "text-slate-500";
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <div
        className={`fixed top-0 left-0 h-full w-72 z-[201] flex flex-col ${surface} border-r ${border} shadow-2xl transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div
          className={`flex items-center justify-between px-4 py-4 border-b ${border}`}
        >
          <span
            className={`text-xs font-semibold uppercase tracking-widest ${textSub}`}
          >
            History
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClearHistory}
              className={`text-[11px] border px-2 py-1 rounded-md transition-all ${isDark ? "text-slate-500 border-[#334155] hover:text-red-400 hover:border-red-400" : "text-slate-400 border-slate-200 hover:text-red-500 hover:border-red-400"}`}
            >
              Clear
            </button>
            <button
              onClick={onClose}
              className={`w-7 h-7 flex items-center justify-center rounded-lg ${isDark ? "text-slate-400 hover:text-white hover:bg-[#334155]" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"}`}
            >
              ✕
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2.5">
          {history.length === 0 ? (
            <p className={`text-xs text-center mt-8 ${textSub}`}>
              No history yet
            </p>
          ) : (
            history.map((item) => (
              <HistoryItem key={item.id} item={item} isDark={isDark} />
            ))
          )}
        </div>
        <div className={`px-4 py-3 border-t ${border} text-center`}>
          <span className="inline-block bg-green-900/30 text-green-400 border border-green-500/20 rounded-md px-2.5 py-1 text-[11px]">
            ✦ Session Active
          </span>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
//  [3] VOICE INPUT BUTTON
// ─────────────────────────────────────────────────────────────────
function VoiceButton({ onTranscript, isDark, addToast }) {
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);

  const toggle = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      addToast(
        "warning",
        "Not supported",
        "Voice input requires Chrome or Edge browser.",
      );
      return;
    }
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.onstart = () => setListening(true);
    rec.onresult = (e) => {
      onTranscript(e.results[0][0].transcript);
    };
    rec.onerror = (e) => {
      if (e.error !== "aborted")
        addToast(
          "error",
          "Voice error",
          e.error === "not-allowed"
            ? "Microphone permission denied."
            : "Voice input failed.",
        );
      setListening(false);
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    rec.start();
  };

  return (
    <button
      onClick={toggle}
      title={listening ? "Stop recording" : "Voice input"}
      className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center transition-all shrink-0 ${
        listening
          ? "border-red-500/60 bg-red-500/10 text-red-400"
          : isDark
            ? "border-[#334155] text-slate-400 hover:text-white hover:bg-[#334155]"
            : "border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
      }`}
    >
      {/* Pulse ring while recording */}
      {listening && (
        <span className="absolute inset-0 rounded-xl border-2 border-red-500 animate-ping opacity-40 pointer-events-none" />
      )}
      {listening ? (
        // Square = stop
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="6" width="12" height="12" rx="2" />
        </svg>
      ) : (
        // Mic icon
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────
//  MAIN
// ─────────────────────────────────────────────────────────────────
export default function AIRagAssistant() {
  const [mode, setMode] = useState(
    () => localStorage.getItem("chat_mode") || "rag",
  );
  const [isDark, setIsDark] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("chat_messages") || "[]");
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState(
    () => localStorage.getItem("chat_input") || "",
  );
  const [typing, setTyping] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [fileName, setFileName] = useState(null);
  const [uploadStage, setUploadStage] = useState(null);
  const [simulatedPercent, setSimulatedPercent] = useState(0);

  const navigate = useNavigate();
  const cancelRef = useRef(false);
  const stageTimersRef = useRef([]);
  const progressIntervalRef = useRef(null);
  const typingIntervalRef = useRef(null); // [4] FIX: track interval

  const [user, setUser] = useState({
    name: "Loading…",
    email: "",
    role: "",
    avatar: null,
  });
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("chat_history") || "[]");
    } catch {
      return [];
    }
  });

  const chatRef = useRef(null);
  const fileInputRef = useRef(null);
  const accentColor = mode === "rag" ? "#3b82f6" : "#8b5cf6";

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // [5] FIX: use access_token (same key as api.js interceptor)
  useEffect(() => {
    if (!localStorage.getItem("token")) navigate("/login");
  }, [navigate]);

  useEffect(() => {
    localStorage.setItem("chat_messages", JSON.stringify(messages));
  }, [messages]);
  useEffect(() => {
    localStorage.setItem("chat_input", input);
  }, [input]);
  useEffect(() => {
    localStorage.setItem("chat_history", JSON.stringify(history));
  }, [history]);
  useEffect(() => {
    localStorage.setItem("chat_mode", mode);
  }, [mode]);

  // [8] Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
      if (progressIntervalRef.current)
        clearInterval(progressIntervalRef.current);
      stageTimersRef.current.forEach(clearTimeout);
    };
  }, []);

  const addToast = useCallback((type, title, msg) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, title, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);
  const removeToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  useEffect(() => {
    const toast = localStorage.getItem("toast");
    if (toast === "login")
      addToast("success", "Login Successful", "Welcome back!");
    if (toast === "register")
      addToast("success", "Registered", "Account created successfully");
    if (toast === "logout")
      addToast("info", "Logged out", "You have been signed out");
    if (toast) localStorage.removeItem("toast");
  }, [addToast]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getMe();
        setUser({
          name: data.name,
          email: data.email,
          role: data.role,
          avatar: data.avatar || null,
        });
      } catch {
        setUser({ name: "Guest", email: "", role: "Free", avatar: null });
      }
    })();
  }, []);

  useEffect(() => {
    if (chatRef.current)
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, typing]);

  // [5] FIX: access_token
  const handleSignOut = async () => {
    try {
      await logout();
    } catch {}
    localStorage.removeItem("access_token");
    localStorage.setItem("toast", "logout");
    localStorage.removeItem("chat_messages");
    localStorage.removeItem("chat_input");
    localStorage.removeItem("chat_history");
    localStorage.removeItem("chat_mode");
    localStorage.removeItem("user_id");
    localStorage.removeItem("toast");
    localStorage.removeItem("rag_theme");
    navigate("/login");
  };

  const startProgress = useCallback((from, to, durationMs, onDone) => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    setSimulatedPercent(from);
    const stepMs = 1000 / 30;
    const totalSteps = Math.max(1, durationMs / stepMs);
    const baseInc = (to - from) / totalSteps;
    let current = from;
    progressIntervalRef.current = setInterval(() => {
      if (cancelRef.current) {
        clearInterval(progressIntervalRef.current);
        return;
      }
      const jitter = (Math.random() - 0.3) * baseInc * 0.4;
      const step =
        baseInc * 0.7 +
        ((to - current) / (to - from + 1)) * baseInc * 0.3 +
        jitter;
      current = Math.min(current + Math.max(step, 0.1), to);
      setSimulatedPercent(current);
      if (current >= to) {
        clearInterval(progressIntervalRef.current);
        if (onDone) onDone();
      }
    }, stepMs);
  }, []);

  const handleCancelUpload = () => {
    cancelRef.current = true;
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    stageTimersRef.current.forEach(clearTimeout);
    stageTimersRef.current = [];
    setUploadStage(null);
    setSimulatedPercent(0);
    setFileName(null);
    addToast("info", "Upload cancelled", "Document upload was cancelled");
  };

  const handleFile = async (file) => {
    if (!file) return;
    cancelRef.current = false;
    stageTimersRef.current.forEach(clearTimeout);
    stageTimersRef.current = [];
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    setFileName(file.name);
    setSimulatedPercent(0);
    setUploadStage("uploading");
    startProgress(0, 90, 6000);

    try {
      await uploadDocument(file, () => {});
      if (cancelRef.current) return;

      startProgress(90, 100, 500, () => {
        if (cancelRef.current) return;
        setUploadStage("processing");
        startProgress(0, 100, 8000, () => {
          if (cancelRef.current) return;
          setUploadStage("ready");
          const t = setTimeout(() => {
            if (cancelRef.current) return;
            setUploadStage(null);
            setFileName(null);
            setSimulatedPercent(0);
            addToast(
              "success",
              "Upload Complete",
              "Document ready for questions",
            );
          }, 2500);
          stageTimersRef.current.push(t);
        });
      });
    } catch (err) {
      if (cancelRef.current) return;
      if (progressIntervalRef.current)
        clearInterval(progressIntervalRef.current);
      addToast(
        "error",
        "Upload failed",
        err.response?.data?.error || err.message || "Upload failed",
      );
      setFileName(null);
      setUploadStage(null);
      setSimulatedPercent(0);
    }
  };

  // [4] FIX: typing effect — removed finally{setTyping(false)}
  const handleSend = async () => {
    const text = input.trim();
    if (!text || typing) return;

    const userMsg = {
      id: Date.now(),
      role: "user",
      text,
      time: timestamp(),
      mode,
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setHistory((h) => [{ id: Date.now(), mode, text }, ...h.slice(0, 19)]);
    setTyping(true);

    try {
      const { data } = await askQuestion(
        text,
        mode === "rag" ? "strict" : "smart",
      );
      const botId = Date.now() + 1;
      const fullText = data.answer;

      setMessages((m) => [
        ...m,
        { id: botId, role: "bot", text: "", time: timestamp(), mode },
      ]);

      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
      let i = 0;
      typingIntervalRef.current = setInterval(() => {
        i++;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botId ? { ...msg, text: fullText.slice(0, i) } : msg,
          ),
        );
        if (i >= fullText.length) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
          setTyping(false); // [4] FIX: only here, NOT in finally
        }
      }, 3);
    } catch (err) {
      setTyping(false); // still stop typing on error
      addToast("error", "Chat error", err.response?.data?.error || err.message);
    }
    // [4] FIX: NO finally { setTyping(false) } — it was killing the animation
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !typing) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    addToast("success", "History cleared", "All previous chats removed");
  };

  // [3] Append voice transcript
  const handleVoiceTranscript = (transcript) => {
    setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    addToast(
      "info",
      "Voice captured",
      transcript.slice(0, 60) + (transcript.length > 60 ? "…" : ""),
    );
  };

  const bg = isDark ? "bg-[#0f172a]" : "bg-slate-100";
  const surface = isDark ? "bg-[#1e293b]" : "bg-white";
  const border = isDark ? "border-[#334155]" : "border-slate-200";
  const textMain = isDark ? "text-slate-200" : "text-slate-800";
  const textSub = isDark ? "text-slate-400" : "text-slate-500";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500&display=swap');

        *, *::before, *::after { font-family: 'DM Sans', sans-serif; box-sizing: border-box; }
        code, pre, .font-mono  { font-family: 'JetBrains Mono', monospace !important; }

        @keyframes fadeUp     { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes dropIn     { from { opacity:0; transform:translateY(-8px) scale(.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes toastSlide { from { opacity:0; transform:translateX(110%); } to { opacity:1; transform:translateX(0); } }

        .animate-fade-up { animation: fadeUp  0.3s ease both; }
        .animate-drop-in { animation: dropIn  0.2s ease both; }
        .toast-slide     { animation: toastSlide 0.4s cubic-bezier(.22,.68,0,1.2) both; }
        .copy-btn        { transition: opacity 0.15s ease; }

        textarea::-webkit-scrollbar, pre::-webkit-scrollbar { width:4px; height:4px; }
        textarea::-webkit-scrollbar-thumb, pre::-webkit-scrollbar-thumb { background:#334155; border-radius:4px; }
        .chat-scroll::-webkit-scrollbar       { width:4px; }
        .chat-scroll::-webkit-scrollbar-thumb { background:#334155; border-radius:4px; }
        .sidebar-scroll::-webkit-scrollbar       { width:4px; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background:#334155; border-radius:4px; }

        textarea { font-size: 16px !important; }

        .theme-toggle { position:relative; width:50px; height:26px; cursor:pointer; display:inline-block; flex-shrink:0; }
        .theme-toggle input { opacity:0; width:0; height:0; position:absolute; }
        .toggle-track { position:absolute; inset:0; border-radius:13px; transition: background 0.3s; display:flex; align-items:center; }
        .toggle-thumb {
          position:absolute; top:3px; left:3px;
          width:20px; height:20px; border-radius:50%;
          background:white; transition: transform 0.35s cubic-bezier(.34,1.56,.64,1);
          display:flex; align-items:center; justify-content:center;
          font-size:11px; box-shadow:0 1px 4px rgba(0,0,0,.25);
        }
        .theme-toggle input:checked ~ .toggle-track .toggle-thumb { transform: translateX(24px); }
        .safe-bottom { padding-bottom: env(safe-area-inset-bottom, 0px); }
      `}</style>

      {isMobile && (
        <MobileSidebar
          open={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          history={history}
          onClearHistory={handleClearHistory}
          isDark={isDark}
        />
      )}
      <UploadOverlay
        stage={uploadStage}
        simulatedPercent={simulatedPercent}
        fileName={fileName}
        onCancel={handleCancelUpload}
        isDark={isDark}
      />
      <Toast toasts={toasts} remove={removeToast} isDark={isDark} />

      <div
        className={`flex h-screen h-[100dvh] ${bg} ${textMain} overflow-hidden`}
      >
        {/* ══ DESKTOP SIDEBAR ══ */}
        {!isMobile && (
          <aside
            className={`flex flex-col ${surface} border-r ${border} transition-all duration-300 overflow-hidden flex-shrink-0 ${sidebarOpen ? "w-64" : "w-0 opacity-0"}`}
          >
            <div
              className={`flex items-center justify-between px-4 py-4 border-b ${border}`}
            >
              <span
                className={`text-xs font-semibold uppercase tracking-widest ${textSub}`}
              >
                History
              </span>
              <button
                onClick={handleClearHistory}
                className={`text-[11px] border px-2 py-1 rounded-md transition-all ${isDark ? "text-slate-500 border-[#334155] hover:text-red-400 hover:border-red-400" : "text-slate-400 border-slate-200 hover:text-red-500 hover:border-red-400"}`}
              >
                Clear
              </button>
            </div>
            <div className="flex-1 overflow-y-auto sidebar-scroll p-2.5">
              {history.length === 0 ? (
                <p className={`text-xs text-center mt-8 ${textSub}`}>
                  No history yet
                </p>
              ) : (
                history.map((item) => (
                  <HistoryItem key={item.id} item={item} isDark={isDark} />
                ))
              )}
            </div>
            <div className={`px-4 py-3 border-t ${border} text-center`}>
              <span className="inline-block bg-green-900/30 text-green-400 border border-green-500/20 rounded-md px-2.5 py-1 text-[11px]">
                ✦ Session Active
              </span>
            </div>
          </aside>
        )}

        {/* ══ MAIN ══ */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* ── HEADER ── */}
          <header
            className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 sm:py-3.5 ${surface} border-b ${border} shrink-0`}
          >
            <button
              onClick={() =>
                isMobile
                  ? setMobileSidebarOpen(true)
                  : setSidebarOpen((o) => !o)
              }
              className={`w-9 h-9 rounded-lg border ${border} transition-all flex items-center justify-center text-base shrink-0 ${isDark ? "text-slate-300 hover:bg-[#334155]" : "text-slate-600 hover:bg-slate-100"}`}
            >
              ☰
            </button>

            <div className="flex items-center gap-2 font-semibold text-sm sm:text-base min-w-0">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0 transition-all duration-300"
                style={{ background: accentColor }}
              >
                ✦
              </div>
              <span className="truncate hidden xs:block sm:block">
                RAG Assistant
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3 ml-auto">
              {/* Mode toggle */}
              <div
                className={`flex items-center gap-0.5 sm:gap-1 rounded-xl p-0.5 sm:p-1 border ${isDark ? "bg-[#0f172a] border-[#334155]" : "bg-slate-100 border-slate-200"}`}
              >
                {["rag", "smart"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-semibold uppercase tracking-wider transition-all ${
                      mode === m
                        ? m === "rag"
                          ? "bg-blue-500 text-white shadow"
                          : "bg-violet-500 text-white shadow"
                        : isDark
                          ? "text-slate-400 hover:text-white"
                          : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Dark/Light toggle */}
              <label
                className="theme-toggle"
                title={isDark ? "Light mode" : "Dark mode"}
              >
                <input
                  type="checkbox"
                  checked={isDark}
                  onChange={() => setIsDark((d) => !d)}
                />
                <div
                  className="toggle-track"
                  style={{ background: isDark ? "#334155" : "#cbd5e1" }}
                >
                  <div className="toggle-thumb">{isDark ? "🌙" : "☀️"}</div>
                </div>
              </label>

              <ProfileButton
                user={user}
                onSignOut={handleSignOut}
                isDark={isDark}
                navigate={navigate}
              />
            </div>
          </header>

          {/* ── CHAT ── */}
          <div
            ref={chatRef}
            className="flex-1 overflow-y-auto chat-scroll px-3 sm:px-6 py-4 sm:py-5 flex flex-col gap-3"
          >
            {messages.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 opacity-25 select-none">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ background: accentColor + "33" }}
                >
                  ✦
                </div>
                <p className="text-sm font-medium text-center px-4">
                  Ask something to get started
                </p>
              </div>
            )}
            {messages.map((msg) => (
              <Message key={msg.id} msg={msg} isDark={isDark} />
            ))}
            {typing && <TypingIndicator isDark={isDark} />}
          </div>

          {/* ── INPUT BAR ── */}
          <div
            className={`px-3 sm:px-5 py-3 sm:py-4 ${surface} border-t ${border} shrink-0 safe-bottom`}
          >
            {fileName && !uploadStage && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] bg-blue-900/30 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5 max-w-full truncate">
                  📄{" "}
                  <span className="truncate max-w-[160px] sm:max-w-[260px]">
                    {fileName}
                  </span>
                  <button
                    onClick={() => setFileName(null)}
                    className="ml-1 text-blue-300 hover:text-white shrink-0"
                  >
                    ✕
                  </button>
                </span>
              </div>
            )}

            <div className="flex items-end gap-2">
              {/* Attach */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border ${border} transition-all flex items-center justify-center text-base shrink-0 ${isDark ? "text-slate-400 hover:text-white hover:bg-[#334155]" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"}`}
                title="Upload document"
              >
                📎
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
                onChange={(e) => {
                  handleFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />

              {/* [3] Voice button */}
              <VoiceButton
                onTranscript={handleVoiceTranscript}
                isDark={isDark}
                addToast={addToast}
              />

              {/* Textarea */}
              <div
                className={`flex-1 flex items-end rounded-xl border transition-all ${
                  dragOver
                    ? "border-blue-500 bg-blue-900/10"
                    : `${border} ${isDark ? "bg-[#0f172a] hover:border-slate-500" : "bg-slate-50 hover:border-slate-400"}`
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFile(e.dataTransfer.files?.[0]);
                }}
              >
                <textarea
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder={
                    mode === "rag"
                      ? "Ask about your document…"
                      : "Ask anything…"
                  }
                  className={`flex-1 bg-transparent resize-none px-3 sm:px-4 py-2 sm:py-2.5 outline-none max-h-32 sm:max-h-36 ${isDark ? "text-slate-200 placeholder-slate-500" : "text-slate-800 placeholder-slate-400"}`}
                  style={{ scrollbarWidth: "thin" }}
                />
              </div>

              {/* Send */}
              <button
                onClick={handleSend}
                disabled={typing || !input.trim()}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all shrink-0 text-white disabled:opacity-30"
                style={{
                  background: input.trim()
                    ? accentColor
                    : isDark
                      ? "#334155"
                      : "#cbd5e1",
                }}
                title="Send"
              >
                {typing ? (
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4 rotate-90"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
