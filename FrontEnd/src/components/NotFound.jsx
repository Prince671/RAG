import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// ── Starfield canvas ──────────────────────────────────────────────
function Starfield() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let W, H;
    const STARS = 220;
    const stars = [];

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < STARS; i++) {
      stars.push({
        x: Math.random() * 2000 - 1000,
        y: Math.random() * 2000 - 1000,
        z: Math.random() * 1000,
        pz: 0,
      });
    }

    let speed = 0.5;
    const draw = () => {
      ctx.fillStyle = "rgba(10,13,20,0.25)";
      ctx.fillRect(0, 0, W, H);
      for (const s of stars) {
        s.pz = s.z;
        s.z -= speed;
        if (s.z <= 0) {
          s.x = Math.random() * 2000 - 1000;
          s.y = Math.random() * 2000 - 1000;
          s.z = 1000;
          s.pz = s.z;
        }
        const sx = (s.x / s.z) * W + W / 2;
        const sy = (s.y / s.z) * H + H / 2;
        const px = (s.x / s.pz) * W + W / 2;
        const py = (s.y / s.pz) * H + H / 2;
        const size = Math.max(0.3, (1 - s.z / 1000) * 2.5);
        const bright = Math.floor((1 - s.z / 1000) * 220 + 35);
        ctx.strokeStyle = `rgba(${bright},${bright+20},${Math.min(255,bright+60)},${(1-s.z/1000)*0.9+0.1})`;
        ctx.lineWidth = size;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(sx, sy);
        ctx.stroke();
      }
      speed = 0.4 + Math.sin(Date.now() / 4000) * 0.15;
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ background: "#0a0d14", zIndex: 0 }}
    />
  );
}

// ── 3-D Octocat SVG (CSS 3D perspective) ─────────────────────────
function OctocatScene() {
  const sceneRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const targetTilt = useRef({ x: 0, y: 0 });
  const animRef = useRef(null);

  useEffect(() => {
    const onMove = (e) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const px = (e.clientX - cx) / cx;
      const py = (e.clientY - cy) / cy;
      targetTilt.current = { x: py * -18, y: px * 22 };
    };
    window.addEventListener("mousemove", onMove);

    const lerp = (a, b, t) => a + (b - a) * t;
    let cur = { x: 0, y: 0 };
    const tick = () => {
      cur.x = lerp(cur.x, targetTilt.current.x, 0.06);
      cur.y = lerp(cur.y, targetTilt.current.y, 0.06);
      setTilt({ x: cur.x, y: cur.y });
      animRef.current = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div
      ref={sceneRef}
      style={{
        perspective: "800px",
        perspectiveOrigin: "50% 50%",
      }}
      className="relative flex items-center justify-center"
    >
      {/* Glow halo behind octocat */}
      <div
        className="absolute rounded-full"
        style={{
          width: 280,
          height: 280,
          background:
            "radial-gradient(circle, rgba(88,166,255,0.18) 0%, rgba(58,103,188,0.10) 45%, transparent 75%)",
          filter: "blur(18px)",
          transform: `rotateX(${tilt.x * 0.5}deg) rotateY(${tilt.y * 0.5}deg)`,
          transition: "transform 0.05s linear",
        }}
      />

      {/* Floating platform / shadow */}
      <div
        className="absolute bottom-0 left-1/2"
        style={{
          width: 180,
          height: 28,
          marginLeft: -90,
          background:
            "radial-gradient(ellipse, rgba(88,166,255,0.22) 0%, transparent 70%)",
          filter: "blur(10px)",
          animation: "floatShadow 3.5s ease-in-out infinite",
        }}
      />

      {/* 3D card wrapping octocat */}
      <div
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transformStyle: "preserve-3d",
          transition: "transform 0.05s linear",
          animation: "floatOcto 3.5s ease-in-out infinite",
          willChange: "transform",
        }}
      >
        {/* Octocat SVG inline */}
        <svg
          width="200"
          height="200"
          viewBox="0 0 300 300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Defs */}
          <defs>
            <radialGradient id="bodyGrad" cx="50%" cy="40%" r="55%">
              <stop offset="0%" stopColor="#c0cfe8" />
              <stop offset="100%" stopColor="#8fadd4" />
            </radialGradient>
            <radialGradient id="headGrad" cx="45%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#d6e4f7" />
              <stop offset="100%" stopColor="#9ab8de" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="eyeGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1a73e8" />
              <stop offset="100%" stopColor="#0d47a1" />
            </linearGradient>
          </defs>

          {/* Tentacle arms (back) */}
          {[
            "M 90 200 Q 50 240 30 270 Q 20 285 35 290 Q 48 293 58 278 Q 72 255 105 218",
            "M 210 200 Q 250 240 270 270 Q 280 285 265 290 Q 252 293 242 278 Q 228 255 195 218",
            "M 100 215 Q 55 260 40 295 Q 35 308 50 310 Q 62 311 68 297 Q 82 265 120 225",
            "M 200 215 Q 245 260 260 295 Q 265 308 250 310 Q 238 311 232 297 Q 218 265 180 225",
          ].map((d, i) => (
            <path
              key={i}
              d={d}
              stroke="#7a9bbf"
              strokeWidth="14"
              strokeLinecap="round"
              fill="none"
              style={{
                animation: `tentacle${i % 2 === 0 ? "L" : "R"} ${2.8 + i * 0.3}s ease-in-out infinite`,
              }}
            />
          ))}

          {/* Body */}
          <ellipse cx="150" cy="205" rx="68" ry="55" fill="url(#bodyGrad)" />

          {/* Belly patch */}
          <ellipse cx="150" cy="210" rx="42" ry="36" fill="rgba(255,255,255,0.28)" />

          {/* Head */}
          <ellipse cx="150" cy="135" rx="82" ry="78" fill="url(#headGrad)" filter="url(#glow)" />

          {/* Ears */}
          <ellipse cx="78" cy="90" rx="20" ry="16" fill="#9ab8de" transform="rotate(-15,78,90)" />
          <ellipse cx="222" cy="90" rx="20" ry="16" fill="#9ab8de" transform="rotate(15,222,90)" />
          <ellipse cx="78" cy="90" rx="11" ry="9" fill="#c8ddf5" transform="rotate(-15,78,90)" />
          <ellipse cx="222" cy="90" rx="11" ry="9" fill="#c8ddf5" transform="rotate(15,222,90)" />

          {/* Eyes */}
          <ellipse cx="120" cy="130" rx="18" ry="19" fill="url(#eyeGrad)" />
          <ellipse cx="180" cy="130" rx="18" ry="19" fill="url(#eyeGrad)" />
          <circle cx="115" cy="125" r="5" fill="white" opacity="0.7" />
          <circle cx="175" cy="125" r="5" fill="white" opacity="0.7" />
          <circle cx="120" cy="130" r="7" fill="#0a0d14" />
          <circle cx="180" cy="130" r="7" fill="#0a0d14" />

          {/* Nose */}
          <ellipse cx="150" cy="155" rx="8" ry="5" fill="#7a9bbf" />

          {/* Mouth — smile */}
          <path
            d="M 132 168 Q 150 182 168 168"
            stroke="#5a85b8"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
          />

          {/* Tail / back tentacle center */}
          <path
            d="M 150 255 Q 148 275 150 295 Q 152 310 165 314 Q 176 316 178 304 Q 179 294 168 288 Q 160 283 158 268 Q 156 258 150 255"
            fill="#8fadd4"
            style={{ animation: "tailWag 2.2s ease-in-out infinite" }}
          />
        </svg>
      </div>
    </div>
  );
}

// ── Glitchy 404 number ────────────────────────────────────────────
function GlitchNumber() {
  return (
    <div className="relative flex items-center justify-center select-none" style={{ lineHeight: 1 }}>
      {/* Shadow layers */}
      <span
        className="absolute font-display text-[clamp(100px,18vw,200px)] font-black"
        style={{
          color: "transparent",
          WebkitTextStroke: "2px rgba(88,166,255,0.15)",
          animation: "glitchR 4s infinite",
          transform: "translate(3px,-2px)",
          letterSpacing: "-0.04em",
        }}
      >
        404
      </span>
      <span
        className="absolute font-display text-[clamp(100px,18vw,200px)] font-black"
        style={{
          color: "transparent",
          WebkitTextStroke: "2px rgba(255,100,100,0.12)",
          animation: "glitchL 4s infinite",
          transform: "translate(-3px,2px)",
          letterSpacing: "-0.04em",
        }}
      >
        404
      </span>
      {/* Main */}
      <span
        className="relative font-display text-[clamp(100px,18vw,200px)] font-black"
        style={{
          background: "linear-gradient(135deg, #e6edf3 0%, #8fadd4 40%, #58a6ff 70%, #c0cfe8 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: "-0.04em",
          textShadow: "none",
          filter: "drop-shadow(0 0 30px rgba(88,166,255,0.35))",
        }}
      >
        404
      </span>
    </div>
  );
}

// ── Floating debris particles ─────────────────────────────────────
function Debris() {
  const pieces = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    size: Math.random() * 6 + 3,
    left: Math.random() * 100,
    delay: Math.random() * 8,
    dur: Math.random() * 10 + 8,
    rot: Math.random() * 360,
    opacity: Math.random() * 0.5 + 0.1,
    shape: i % 3,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {pieces.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.left}%`,
            top: "-20px",
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            borderRadius: p.shape === 0 ? "50%" : p.shape === 1 ? "2px" : "0",
            background:
              p.id % 3 === 0
                ? "#58a6ff"
                : p.id % 3 === 1
                  ? "#8fadd4"
                  : "#c0cfe8",
            transform: `rotate(${p.rot}deg)`,
            animation: `fall ${p.dur}s ${p.delay}s linear infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ── Main 404 page ─────────────────────────────────────────────────
export default function NotFound() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;600&display=swap');

        .font-display { font-family: 'Syne', sans-serif; }
        .font-body    { font-family: 'DM Sans', sans-serif; }

        @keyframes floatOcto {
          0%, 100% { transform: translateY(0px) rotateX(0deg); }
          50%       { transform: translateY(-18px) rotateX(2deg); }
        }
        @keyframes floatShadow {
          0%, 100% { transform: translateX(-50%) scale(1);   opacity: 0.8; }
          50%       { transform: translateX(-50%) scale(0.7); opacity: 0.4; }
        }
        @keyframes tentacleL {
          0%, 100% { transform: rotate(0deg) translateX(0); }
          50%       { transform: rotate(-8deg) translateX(-4px); }
        }
        @keyframes tentacleR {
          0%, 100% { transform: rotate(0deg) translateX(0); }
          50%       { transform: rotate(8deg) translateX(4px); }
        }
        @keyframes tailWag {
          0%, 100% { transform: rotate(-8deg) translateX(-2px); }
          50%       { transform: rotate(8deg) translateX(2px); }
        }
        @keyframes glitchR {
          0%,90%,100% { transform: translate(3px,-2px); opacity: 0.6; }
          91%          { transform: translate(8px, 2px) skewX(5deg); opacity: 0.8; }
          93%          { transform: translate(-4px,-1px); opacity: 0.4; }
          95%          { transform: translate(3px,-2px); opacity: 0.6; }
        }
        @keyframes glitchL {
          0%,90%,100% { transform: translate(-3px,2px); opacity: 0.5; }
          92%          { transform: translate(-10px, 3px) skewX(-6deg); opacity: 0.7; }
          94%          { transform: translate(5px,-2px); opacity: 0.3; }
          96%          { transform: translate(-3px,2px); opacity: 0.5; }
        }
        @keyframes fall {
          0%   { transform: translateY(-20px) rotate(0deg);   opacity: 0; }
          5%   { opacity: 1; }
          95%  { opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        @keyframes revealUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scanLine {
          0%   { top: -4%; opacity: 0.7; }
          100% { top: 104%; opacity: 0; }
        }
        @keyframes borderPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(88,166,255,0.3), inset 0 0 0 1px rgba(88,166,255,0.15); }
          50%       { box-shadow: 0 0 28px 4px rgba(88,166,255,0.2), inset 0 0 0 1px rgba(88,166,255,0.35); }
        }
        @keyframes gridMove {
          0%   { background-position: 0 0; }
          100% { background-position: 60px 60px; }
        }
        @keyframes orbitRing {
          from { transform: rotateZ(0deg); }
          to   { transform: rotateZ(360deg); }
        }

        .reveal-1 { animation: revealUp 0.7s 0.1s cubic-bezier(.22,.68,0,1.1) both; }
        .reveal-2 { animation: revealUp 0.7s 0.25s cubic-bezier(.22,.68,0,1.1) both; }
        .reveal-3 { animation: revealUp 0.7s 0.42s cubic-bezier(.22,.68,0,1.1) both; }
        .reveal-4 { animation: revealUp 0.7s 0.58s cubic-bezier(.22,.68,0,1.1) both; }
        .reveal-5 { animation: revealUp 0.7s 0.72s cubic-bezier(.22,.68,0,1.1) both; }

        .btn-home {
          position: relative;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn-home::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.08), transparent);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .btn-home:hover::before  { opacity: 1; }
        .btn-home:hover          { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(88,166,255,0.35); }
        .btn-home:active         { transform: translateY(0); }

        .btn-back {
          transition: color 0.2s, transform 0.2s;
        }
        .btn-back:hover { color: #58a6ff; transform: translateX(-4px); }

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { overflow: hidden; }
      `}</style>

      {/* Layer 0 – starfield */}
      <Starfield />

      {/* Layer 1 – debris */}
      <Debris />

      {/* Layer 2 – animated grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 2,
          backgroundImage:
            "linear-gradient(rgba(88,166,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(88,166,255,0.035) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          animation: "gridMove 8s linear infinite",
        }}
      />

      {/* Scan line sweep */}
      <div
        className="fixed left-0 w-full pointer-events-none"
        style={{
          height: "2px",
          background: "linear-gradient(90deg, transparent, rgba(88,166,255,0.5), transparent)",
          animation: "scanLine 6s linear infinite",
          zIndex: 3,
        }}
      />

      {/* Layer 3 – main content */}
      <div
        className="fixed inset-0 flex flex-col items-center justify-center font-body text-center px-4"
        style={{ zIndex: 10 }}
      >
        {/* Orbit ring decoration */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: 520,
            height: 520,
            borderRadius: "50%",
            border: "1px dashed rgba(88,166,255,0.12)",
            animation: "orbitRing 30s linear infinite",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -5,
              left: "50%",
              marginLeft: -5,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#58a6ff",
              boxShadow: "0 0 12px 4px rgba(88,166,255,0.6)",
            }}
          />
        </div>
        <div
          className="absolute pointer-events-none"
          style={{
            width: 380,
            height: 380,
            borderRadius: "50%",
            border: "1px dashed rgba(88,166,255,0.07)",
            animation: "orbitRing 20s linear infinite reverse",
          }}
        />

        {/* Octocat 3D */}
        <div className="reveal-1 mb-2">
          <OctocatScene />
        </div>

        {/* 404 */}
        <div className="reveal-2">
          <GlitchNumber />
        </div>

        {/* Heading */}
        <h1
          className="reveal-3 font-display font-bold text-[clamp(18px,3.5vw,32px)] mt-2 mb-3"
          style={{
            color: "#e6edf3",
            letterSpacing: "-0.02em",
            textShadow: "0 2px 20px rgba(88,166,255,0.25)",
          }}
        >
          This page has drifted into deep space
        </h1>

        {/* Subtext */}
        <p
          className="reveal-3 text-[clamp(13px,1.8vw,16px)] max-w-md leading-relaxed mb-8"
          style={{ color: "#8fadd4" }}
        >
          The page you're looking for doesn't exist, was moved, or got eaten by
          the Octocat.{" "}
          <span style={{ color: "#58a6ff" }}>Don't panic</span> — let's get you
          back to safety.
        </p>

        {/* Buttons */}
        <div className="reveal-4 flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
          <button
            className="btn-home font-body font-semibold text-sm px-7 py-3 rounded-xl text-white"
            style={{
              background: "linear-gradient(135deg, #1f6feb 0%, #388bfd 100%)",
              border: "1px solid rgba(88,166,255,0.4)",
              animation: "borderPulse 3s ease-in-out infinite",
              letterSpacing: "0.01em",
            }}
            onClick={() => navigate("/")}
          >
            🚀 &nbsp;Take me home
          </button>

          <button
            className="btn-back font-body text-sm font-medium flex items-center gap-1.5"
            style={{ color: "#8fadd4" }}
            onClick={() => navigate(-1)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Go back
          </button>
        </div>

        {/* Error details tag */}
        <div
          className="reveal-5 mt-10 flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-mono"
          style={{
            background: "rgba(88,166,255,0.06)",
            border: "1px solid rgba(88,166,255,0.15)",
            color: "#58a6ff",
            letterSpacing: "0.06em",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#58a6ff",
              display: "inline-block",
              boxShadow: "0 0 8px 2px rgba(88,166,255,0.7)",
              animation: "borderPulse 1.5s ease-in-out infinite",
            }}
          />
          HTTP_STATUS · 404 · PAGE_NOT_FOUND
        </div>
      </div>
    </>
  );
}