"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const SECTIONS = [
  { id: "resumen",    label: "Resumen" },
  { id: "validacion", label: "Inspección" },
  { id: "recientes",  label: "Recientes" },
  { id: "graficos",   label: "Gráficos" },
];

interface HeaderProps {
  active: string;
  setActive: (id: string) => void;
}

export default function Header({ active, setActive }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={"app-header " + (scrolled ? "is-scrolled" : "")}>
      <div className="app-header-inner">
        <div className="logo-wrap">
          <Image src="/la-virginia-logo.png" alt="La Virginia" height={44} width={120} style={{ height: "44px", width: "auto" }} priority />
        </div>
        <nav className="header-nav-centered">
          {SECTIONS.map(s => (
            <a
              key={s.id}
              href={"#" + s.id}
              className={active === s.id ? "active" : ""}
              onClick={() => setActive(s.id)}
            >
              {s.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
