"use client";

import { useRef, useEffect, useState, ElementType, ComponentPropsWithoutRef } from "react";

export function useReveal() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        el.classList.add("reveal-in");
        io.unobserve(el);
      }
    }, { threshold: 0.18, rootMargin: "0px 0px -60px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

type RevealProps<T extends ElementType> = {
  as?: T;
  delay?: string | number;
  className?: string;
  children?: React.ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "delay" | "className" | "children">;

export function Reveal<T extends ElementType = "div">({ as, delay, className = "", children, ...rest }: RevealProps<T>) {
  const Tag = (as ?? "div") as ElementType;
  const ref = useReveal();
  return (
    <Tag ref={ref} className={"reveal " + className} data-delay={delay} {...rest}>
      {children}
    </Tag>
  );
}

export function CountUp({ to, decimals = 0, duration = 1200 }: { to: number; decimals?: number; duration?: number }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const tick = (t: number) => {
          const p = Math.min(1, (t - start) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          setVal(to * eased);
          if (p < 1) requestAnimationFrame(tick);
          else setVal(to);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);
  const display = decimals > 0 ? val.toFixed(decimals) : Math.round(val).toLocaleString("es-AR");
  return <span ref={ref} className="tabular">{display}</span>;
}

export function Sparkline({ data, color = "#034ea2", height = 36, width = 110, fillAlpha = 0.12 }: {
  data: number[]; color?: string; height?: number; width?: number; fillAlpha?: number;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const pts = data.map((v, i) => [i * step, height - ((v - min) / range) * (height - 4) - 2]);
  const d = pts.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const dArea = d + ` L ${width} ${height} L 0 ${height} Z`;
  return (
    <svg className="kpi-sparkline" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={"spg-" + color.slice(1)} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={fillAlpha + 0.1} />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={dArea} fill={`url(#spg-${color.slice(1)})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.6" fill={color} />
    </svg>
  );
}

export function shade(hex: string, amount: number): string {
  const c = hex.replace("#", "");
  const num = parseInt(c, 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amount));
  return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
}

export function Capsule({ color = "#3b1c10", size = 160, label = "LV" }: { color?: string; size?: number; label?: string }) {
  const w = size * (130 / 160);
  return (
    <svg className="cap-body" viewBox="0 0 130 160" width={w} height={size} aria-hidden="true">
      <defs>
        <linearGradient id={"capg-" + label} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.95" />
          <stop offset="55%" stopColor={shade(color, -18)} />
          <stop offset="100%" stopColor={shade(color, -34)} />
        </linearGradient>
        <linearGradient id={"capshine-" + label} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="35%" stopColor="#ffffff" stopOpacity="0.36" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={"capfoil-" + label} cx="0.5" cy="0.4" r="0.6">
          <stop offset="0%" stopColor={shade(color, 28)} />
          <stop offset="100%" stopColor={shade(color, -8)} />
        </radialGradient>
        <filter id={"capshadow-" + label} x="-20%" y="-10%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dx="0" dy="6" />
          <feComponentTransfer><feFuncA type="linear" slope="0.32" /></feComponentTransfer>
          <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <g filter={`url(#capshadow-${label})`}>
        <ellipse cx="65" cy="22" rx="58" ry="11" fill={`url(#capfoil-${label})`} />
        <ellipse cx="65" cy="20" rx="58" ry="11" fill="none" stroke={shade(color, -22)} strokeWidth="0.6" opacity="0.5" />
        <path d="M7 22 L123 22 L92 138 Q65 152 38 138 Z" fill={`url(#capg-${label})`} />
        <path d="M7 22 L123 22 L92 138 Q65 152 38 138 Z" fill={`url(#capshine-${label})`} />
        {[0, 1, 2, 3, 4, 5].map(i => (
          <path key={i} d={`M ${20 + i * 16} 30 L ${42 + i * 8} 134`}
            stroke={shade(color, -28)} strokeWidth="0.6" opacity="0.45" fill="none" />
        ))}
        <g opacity="0.65">
          {Array.from({ length: 18 }).map((_, i) => {
            const a = (i / 18) * Math.PI * 2;
            const cx = 65 + Math.cos(a) * 50;
            const cy = 22 + Math.sin(a) * 8;
            return <circle key={i} cx={cx} cy={cy} r="0.9" fill={shade(color, -32)} />;
          })}
        </g>
        <g transform="translate(65 70)">
          <rect x="-22" y="-9" width="44" height="20" rx="3" fill="#fff" opacity="0.94" />
          <text x="0" y="5" textAnchor="middle" fontFamily="Manrope, system-ui, sans-serif"
            fontWeight="800" fontSize="12" fill="#034ea2" letterSpacing="0.5">{label}</text>
        </g>
      </g>
    </svg>
  );
}
