import { useEffect, useState, useCallback } from "react";
import { getDocuments, deleteDocument } from "../components/api";
import { useNavigate } from "react-router-dom";

// ─── File-type icon ───────────────────────────────────────────────
function FileIcon({ filename = "" }) {
  const ext = filename.split(".").pop()?.toLowerCase();
  const map = {
    pdf: { bg: "#ef4444", label: "PDF" },
    doc: { bg: "#2563eb", label: "DOC" },
    docx: { bg: "#2563eb", label: "DOC" },
    txt: { bg: "#64748b", label: "TXT" },
    md: { bg: "#8b5cf6", label: "MD" },
  };
  const { bg, label } = map[ext] || {
    bg: "#475569",
    label: ext?.toUpperCase() || "FILE",
  };
  return (
    <div
      className="flex items-center justify-center rounded-xl font-bold text-white text-[10px] tracking-widest shrink-0"
      style={{
        width: 48,
        height: 58,
        background: `linear-gradient(145deg, ${bg}dd, ${bg}88)`,
        boxShadow: `0 4px 16px ${bg}44`,
        position: "relative",
        clipPath: "polygon(0 0, 75% 0, 100% 15%, 100% 100%, 0 100%)",
      }}
    >
      {/* dog-ear fold */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 14,
          height: 14,
          background: "rgba(255,255,255,0.18)",
          clipPath: "polygon(100% 0, 100% 100%, 0 100%)",
        }}
      />
      <span style={{ marginTop: 4 }}>{label}</span>
    </div>
  );
}

// ─── Confirm dialog ───────────────────────────────────────────────
function ConfirmModal({ docName, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#0a0f1e]/80 backdrop-blur-md"
        onClick={onCancel}
      />
      <div
        className="relative z-10 bg-[#131c2e] border border-[#1e3a5f] rounded-2xl p-6 max-w-sm w-full shadow-2xl"
        style={{ animation: "popIn 0.22s cubic-bezier(.34,1.56,.64,1) both" }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 text-lg">
            🗑️
          </div>
          <div>
            <p className="font-semibold text-white text-sm">Delete document?</p>
            <p className="text-xs text-slate-400 mt-0.5">
              This action cannot be undone
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-400 bg-[#0f172a] rounded-lg px-3 py-2 mb-5 truncate border border-[#1e293b]">
          📄 {docName}
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl text-sm text-slate-400 border border-[#1e3a5f] hover:border-slate-500 hover:text-white transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-400 transition-all"
            style={{ boxShadow: "0 4px 14px rgba(239,68,68,0.35)" }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PDF / Doc preview modal ──────────────────────────────────────
function PreviewModal({ doc, onClose }) {
  const ext = doc.filename?.split(".").pop()?.toLowerCase();
  const isPdf = ext === "pdf";
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  // Build preview URL — adjust to match your API's document-serve endpoint

  const previewUrl = `${import.meta.env.VITE_API_URL}/documents/preview/${doc.doc_id}?token=${token}`;
  console.log(previewUrl);

  return (
    <div className="fixed inset-0 z-[998] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#0a0f1e]/90 backdrop-blur-lg"
        onClick={onClose}
      />
      <div
        className="relative z-10 flex flex-col bg-[#0f172a] border border-[#1e3a5f] rounded-2xl shadow-2xl overflow-hidden w-full max-w-4xl"
        style={{
          height: "88vh",
          animation: "slideUp 0.3s cubic-bezier(.22,.68,0,1.1) both",
        }}
      >
        {/* Modal header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#1e3a5f] shrink-0 bg-[#131c2e]">
          <FileIcon filename={doc.filename} />
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">
              {doc.filename}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {doc.chunks} chunks indexed
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Download */}
            <a
              href={previewUrl}
              download={doc.filename}
              className="w-8 h-8 rounded-lg border border-[#1e3a5f] hover:border-blue-500/50 hover:bg-blue-500/10 flex items-center justify-center text-slate-400 hover:text-blue-400 transition-all"
              title="Download"
            >
              <svg
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M7 1v8M3 6l4 4 4-4M1 11v1a1 1 0 001 1h10a1 1 0 001-1v-1" />
              </svg>
            </a>
            {/* Close */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg border border-[#1e3a5f] hover:border-red-500/40 hover:bg-red-500/10 flex items-center justify-center text-slate-400 hover:text-red-400 transition-all text-base"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Preview area */}
        <div className="flex-1 relative overflow-hidden">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0f172a] z-10">
              <div
                className="w-10 h-10 rounded-full border-2 border-blue-500/30 border-t-blue-400"
                style={{ animation: "spin 0.9s linear infinite" }}
              />
              <p className="text-sm text-slate-500">Loading preview…</p>
            </div>
          )}

          {isPdf ? (
            <iframe
              src={`${previewUrl}#toolbar=1&navpanes=1&scrollbar=1`}
              className="w-full h-full border-0"
              title={doc.filename}
              onLoad={() => setLoading(false)}
              onError={() => setLoading(false)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-5 p-8">
              <FileIcon filename={doc.filename} />
              <div className="text-center">
                <p className="text-white font-semibold mb-1">
                  Preview not available
                </p>
                <p className="text-sm text-slate-500 mb-4">
                  This file type cannot be previewed directly in the browser.
                </p>
                <a
                  href={previewUrl}
                  download={doc.filename}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                  style={{
                    background: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
                    boxShadow: "0 4px 16px rgba(59,130,246,0.35)",
                  }}
                  onMouseOver={(e) => {
                    setLoading(false);
                  }}
                >
                  ⬇ Download to view
                </a>
              </div>
            </div>
          )}
          {isPdf && !loading ? null : (
            <div style={{ display: "none" }} onLoad={() => setLoading(false)} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────
function EmptyState({ onBack }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-24 gap-5"
      style={{ animation: "fadeUp 0.5s ease both" }}
    >
      <div
        className="w-24 h-24 rounded-3xl flex items-center justify-center text-4xl"
        style={{
          background: "linear-gradient(145deg, #1e293b, #0f1e35)",
          border: "1px solid #1e3a5f",
          boxShadow: "0 0 40px rgba(30,58,95,0.4)",
        }}
      >
        📭
      </div>
      <div className="text-center">
        <p className="text-white font-semibold text-lg mb-1">
          No documents yet
        </p>
        <p className="text-slate-500 text-sm max-w-xs">
          Upload your first document from the chat screen to get started with
          RAG.
        </p>
      </div>
      <button
        onClick={onBack}
        className="mt-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
        style={{
          background: "linear-gradient(135deg, #1d4ed8, #3b82f6)",
          boxShadow: "0 4px 16px rgba(59,130,246,0.3)",
        }}
      >
        ← Go to Chat
      </button>
    </div>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      className="rounded-2xl border border-[#1e293b] p-5 flex items-center gap-4"
      style={{
        background: "#0f1e35",
        animation: "pulse 1.8s ease-in-out infinite",
      }}
    >
      <div className="w-12 h-14 rounded-xl bg-[#1e293b]" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-[#1e293b] rounded-full w-3/5" />
        <div className="h-2.5 bg-[#1e293b] rounded-full w-2/5" />
        <div className="h-2 bg-[#1e293b] rounded-full w-1/4" />
      </div>
      <div className="w-20 h-8 bg-[#1e293b] rounded-lg" />
    </div>
  );
}

// ─── Document card ────────────────────────────────────────────────
function DocCard({ doc, index, onDelete, onPreview }) {
  const [hovered, setHovered] = useState(false);

  const formatDate = (ts) => {
    if (!ts) return null;
    try {
      return new Date(ts).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return null;
    }
  };

  const ext = doc.filename?.split(".").pop()?.toLowerCase();
  const canPreview = ["pdf", "txt", "md"].includes(ext);

  return (
    <div
      className="group relative rounded-2xl border transition-all duration-300 overflow-hidden cursor-default"
      style={{
        background: hovered ? "#111e33" : "#0c1829",
        borderColor: hovered ? "#2d5a9e" : "#1a2e4a",
        boxShadow: hovered
          ? "0 8px 32px rgba(30,90,200,0.18), 0 0 0 1px rgba(59,130,246,0.12)"
          : "0 2px 8px rgba(0,0,0,0.2)",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        animation: `fadeUp 0.45s ${index * 0.07}s cubic-bezier(.22,.68,0,1.1) both`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Accent left bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full transition-all duration-300"
        style={{
          background: "linear-gradient(180deg, #3b82f6, #8b5cf6)",
          opacity: hovered ? 1 : 0,
        }}
      />

      <div className="flex items-center gap-4 px-5 py-4">
        {/* File icon */}
        <FileIcon filename={doc.filename} />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate mb-1">
            {doc.filename}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {/* Chunks badge */}
            <span
              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: "rgba(59,130,246,0.12)",
                border: "1px solid rgba(59,130,246,0.25)",
                color: "#60a5fa",
              }}
            >
              <svg width="9" height="9" viewBox="0 0 12 12" fill="currentColor">
                <path d="M6 1L1 3.5v5L6 11l5-2.5v-5z" opacity=".5" />
                <path d="M6 1v10M1 3.5L6 6l5-2.5M6 6v5" />
              </svg>
              {doc.chunks} chunks
            </span>
            {/* Date badge */}
            {formatDate(doc.created_at || doc.uploaded_at) && (
              <span className="text-[10px] text-slate-500">
                {formatDate(doc.created_at || doc.uploaded_at)}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onDelete(doc)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: hovered ? "rgba(239,68,68,0.12)" : "transparent",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#f87171",
            }}
            title="Delete document"
          >
            <svg
              width="11"
              height="11"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <polyline points="2 3 9 3" />
              <path d="M3.5 3V9.5a.5.5 0 00.5.5h3a.5.5 0 00.5-.5V3" />
              <path d="M4 3V2h3v1" />
            </svg>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────
export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null); // doc object
  const [previewDoc, setPreviewDoc] = useState(null); // doc object
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getDocuments();
      setDocs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await deleteDocument(deleteTarget.doc_id);
      setDocs((prev) => prev.filter((d) => d.doc_id !== deleteTarget.doc_id));
    } catch {
      // keep modal open, show nothing (could add inline error)
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const filtered = docs.filter((d) =>
    d.filename?.toLowerCase().includes(searchQ.toLowerCase()),
  );

  const totalChunks = docs.reduce((s, d) => s + (d.chunks || 0), 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; font-family: 'DM Sans', sans-serif; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(.92); }
          to   { opacity: 1; transform: scale(1);   }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px) scale(.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1);   }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%,100% { opacity: 1; }
          50%      { opacity: .45; }
        }
        @keyframes shimmer {
          from { background-position: -200% 0; }
          to   { background-position:  200% 0; }
        }
        @keyframes gradMove {
          0%,100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }

        .search-input::placeholder { color: #475569; }
        .search-input:focus { outline: none; }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1e3a5f; border-radius: 4px; }
      `}</style>

      {/* Confirm modal */}
      {deleteTarget && (
        <ConfirmModal
          docName={deleteTarget.filename}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Preview modal */}
      {previewDoc && (
        <PreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}

      {/* Page */}
      <div
        className="min-h-screen text-white"
        style={{
          background:
            "linear-gradient(160deg, #060c18 0%, #0a1628 50%, #060c18 100%)",
          backgroundSize: "200% 200%",
        }}
      >
        {/* Subtle grid backdrop */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(30,58,95,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(30,58,95,0.04) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            zIndex: 0,
          }}
        />

        {/* Glow blobs */}
        <div
          className="fixed pointer-events-none"
          style={{
            zIndex: 0,
            top: "-10%",
            left: "20%",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(29,78,216,0.09) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <div
          className="fixed pointer-events-none"
          style={{
            zIndex: 0,
            bottom: "0%",
            right: "10%",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-8">
          {/* ── HEADER ── */}
          <div className="mb-8" style={{ animation: "fadeUp 0.5s ease both" }}>
            {/* Back link */}
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-400 transition-colors mb-5 group"
            >
              <svg
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="transition-transform group-hover:-translate-x-0.5"
              >
                <polyline points="10 4 4 8 10 12" />
              </svg>
              Back to Chat
            </button>

            {/* Title row */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1
                  className="text-2xl sm:text-3xl font-black tracking-tight"
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    background:
                      "linear-gradient(135deg, #e2e8f0 30%, #60a5fa 80%, #a78bfa 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  My Documents
                </h1>
                <p className="text-slate-500 text-sm mt-1">
                  Manage your uploaded knowledge base
                </p>
              </div>

              {/* Stats pills */}
              {!loading && docs.length > 0 && (
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="text-[11px] font-semibold px-3 py-1.5 rounded-full"
                    style={{
                      background: "rgba(59,130,246,0.12)",
                      border: "1px solid rgba(59,130,246,0.25)",
                      color: "#60a5fa",
                    }}
                  >
                    {docs.length} {docs.length === 1 ? "file" : "files"}
                  </span>
                  <span
                    className="text-[11px] font-semibold px-3 py-1.5 rounded-full"
                    style={{
                      background: "rgba(139,92,246,0.12)",
                      border: "1px solid rgba(139,92,246,0.25)",
                      color: "#a78bfa",
                    }}
                  >
                    {totalChunks.toLocaleString()} chunks
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── SEARCH ── */}
          {!loading && docs.length > 0 && (
            <div
              className="relative mb-5"
              style={{ animation: "fadeUp 0.5s 0.1s ease both" }}
            >
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                <svg
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <circle cx="6" cy="6" r="5" />
                  <path d="M11 11l2.5 2.5" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search documents…"
                className="search-input w-full text-sm text-white rounded-xl pl-9 pr-4 py-2.5 border transition-all"
                style={{
                  background: "#0c1829",
                  borderColor: searchQ ? "#2d5a9e" : "#1a2e4a",
                  boxShadow: searchQ
                    ? "0 0 0 3px rgba(59,130,246,0.1)"
                    : "none",
                }}
              />
              {searchQ && (
                <button
                  onClick={() => setSearchQ("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors text-sm"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* ── CONTENT ── */}
          {loading ? (
            <div className="flex flex-col gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    animationDelay: `${i * 0.08}s`,
                    animation: "fadeUp 0.4s ease both",
                  }}
                >
                  <SkeletonCard />
                </div>
              ))}
            </div>
          ) : docs.length === 0 ? (
            <EmptyState onBack={() => navigate("/")} />
          ) : filtered.length === 0 ? (
            <div
              className="flex flex-col items-center gap-3 py-16 text-center"
              style={{ animation: "fadeUp 0.4s ease both" }}
            >
              <span className="text-3xl">🔍</span>
              <p className="text-white font-medium">
                No results for "{searchQ}"
              </p>
              <p className="text-slate-500 text-sm">Try a different filename</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((doc, i) => (
                <DocCard
                  key={doc.doc_id}
                  doc={doc}
                  index={i}
                  onDelete={(d) => setDeleteTarget(d)}
                  onPreview={(d) => setPreviewDoc(d)}
                />
              ))}
            </div>
          )}

          {/* ── FOOTER ── */}
          {!loading && docs.length > 0 && (
            <p
              className="text-center text-[11px] text-slate-600 mt-10"
              style={{ animation: "fadeUp 0.5s 0.5s ease both" }}
            >
              Documents are used as context in RAG mode · Delete to remove from
              index
            </p>
          )}
        </div>
      </div>
    </>
  );
}
