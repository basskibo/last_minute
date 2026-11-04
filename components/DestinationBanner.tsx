"use client";

import type { ReactNode } from "react";
import { CalendarDays, MapPin, Users } from "lucide-react";
import type { DestinationThemeId, DestinationTheme } from "@/lib/destination-themes";
import { useAppPreferences } from "@/components/providers/AppProviders";

/** Dekorativni motiv po temi — boje dolaze iz --motif-* tokena teme. */
function Motif({ id }: { id: DestinationThemeId }) {
  const common = { viewBox: "0 0 360 140", className: "lm-dest-banner__motif", "aria-hidden": true } as const;

  switch (id) {
    case "italy":
      return (
        <svg {...common}>
          <rect x="250" y="-10" width="36" height="160" className="m1" transform="skewX(-12)" />
          <rect x="286" y="-10" width="36" height="160" className="m4" transform="skewX(-12)" />
          <rect x="322" y="-10" width="36" height="160" className="m2" transform="skewX(-12)" />
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} className="m3" d={`M${20 + i * 44} 140 V88 a18 18 0 0 1 36 0 V140 Z`} />
          ))}
          <rect x="16" y="76" width="220" height="6" rx="3" className="m3" />
        </svg>
      );
    case "greece":
      return (
        <svg {...common}>
          <defs>
            <pattern id="meander" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M0 26 H26 V2 H6 V18 H18 V10 H12" fill="none" className="s1" strokeWidth="3" />
            </pattern>
          </defs>
          <rect x="0" y="108" width="360" height="28" fill="url(#meander)" />
          <rect x="190" y="52" width="70" height="56" rx="2" className="m3" />
          <rect x="216" y="76" width="18" height="32" rx="9" className="m1" />
          <path d="M190 52 a35 35 0 0 1 70 0 Z" className="m1" />
          <rect x="270" y="64" width="60" height="44" rx="2" className="m3" />
          <rect x="292" y="84" width="16" height="24" rx="8" className="m1" />
          <path d="M270 64 a30 30 0 0 1 60 0 Z" className="m1" />
          <circle cx="110" cy="46" r="22" className="m2" />
        </svg>
      );
    case "spain":
      return (
        <svg {...common}>
          <circle cx="290" cy="58" r="34" className="m2" />
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i * Math.PI) / 6;
            return (
              <line key={i} x1={290 + Math.cos(a) * 44} y1={58 + Math.sin(a) * 44} x2={290 + Math.cos(a) * 56} y2={58 + Math.sin(a) * 56} className="s2" strokeWidth="5" strokeLinecap="round" />
            );
          })}
          {Array.from({ length: 5 }).map((_, i) => (
            <g key={i} transform={`translate(${20 + i * 40} 92)`}>
              <rect width="36" height="36" rx="4" className="m4" />
              <path d="M18 4 L32 18 L18 32 L4 18 Z" className="m1" />
              <circle cx="18" cy="18" r="5" className="m2" />
            </g>
          ))}
        </svg>
      );
    case "turkey":
      return (
        <svg {...common}>
          {Array.from({ length: 4 }).map((_, row) =>
            Array.from({ length: 8 }).map((_, col) => (
              <g key={`${row}-${col}`} transform={`translate(${116 + col * 30} ${14 + row * 30})`}>
                <rect width="28" height="28" rx="4" className={(row + col) % 2 ? "m4" : "m3"} />
                <path d="M14 3 L17 11 L25 14 L17 17 L14 25 L11 17 L3 14 L11 11 Z" className={(row + col) % 3 ? "m1" : "m2"} />
              </g>
            ))
          )}
        </svg>
      );
    case "croatia":
      return (
        <svg {...common}>
          {Array.from({ length: 5 }).map((_, row) =>
            Array.from({ length: 5 }).map((_, col) => (
              <rect key={`${row}-${col}`} x={226 + col * 22} y={12 + row * 22} width="22" height="22" className={(row + col) % 2 ? "m4" : "m2"} />
            ))
          )}
          <path d="M0 112 q20 -14 40 0 t40 0 t40 0 t40 0 t40 0" className="s1" fill="none" strokeWidth="5" strokeLinecap="round" />
          <path d="M0 128 q20 -14 40 0 t40 0 t40 0 t40 0 t40 0" className="s3" fill="none" strokeWidth="5" strokeLinecap="round" />
        </svg>
      );
    case "montenegro":
      return (
        <svg {...common}>
          <path d="M60 120 L140 30 L190 84 L240 22 L330 120 Z" className="m3" />
          <path d="M140 30 L158 50 L146 48 L134 56 L124 48 Z" className="m4" />
          <path d="M240 22 L262 46 L248 44 L236 52 L224 40 Z" className="m4" />
          <rect x="0" y="112" width="360" height="28" className="m1" />
          <path d="M10 126 q15 -10 30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0 t30 0" className="s4" fill="none" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case "egypt":
      return (
        <svg {...common}>
          <circle cx="300" cy="40" r="24" className="m2" />
          <path d="M60 130 L140 40 L220 130 Z" className="m1" />
          <path d="M140 40 L220 130 L170 130 Z" className="m3" />
          <path d="M200 130 L260 68 L320 130 Z" className="m1" />
          <path d="M260 68 L320 130 L284 130 Z" className="m3" />
        </svg>
      );
    case "france":
      return (
        <svg {...common}>
          <rect x="250" y="-10" width="36" height="160" className="m1" transform="skewX(-12)" />
          <rect x="286" y="-10" width="36" height="160" className="m4" transform="skewX(-12)" />
          <rect x="322" y="-10" width="36" height="160" className="m2" transform="skewX(-12)" />
          <path d="M150 130 L170 20 L190 130 M156 96 H184 M161 64 H179" className="s3" fill="none" strokeWidth="6" strokeLinejoin="round" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="280" cy="52" r="34" className="m2" />
          <path d="M120 108 q24 -16 48 0 t48 0 t48 0 t48 0 t48 0" className="s1" fill="none" strokeWidth="6" strokeLinecap="round" />
          <path d="M96 128 q24 -16 48 0 t48 0 t48 0 t48 0 t48 0 t48 0" className="s3" fill="none" strokeWidth="6" strokeLinecap="round" />
        </svg>
      );
  }
}

export default function DestinationBanner({
  theme,
  title,
  guests,
  period,
  place,
  children,
}: {
  theme: DestinationTheme;
  title: string;
  guests: string;
  period?: string;
  place?: string;
  children?: ReactNode;
}) {
  const { locale, t } = useAppPreferences();

  return (
    <section className="lm-dest-banner" aria-labelledby="results-title">
      <div className="relative z-[1] flex min-w-0 flex-col gap-2">
        <p className="lm-label !text-primary">
          {theme.greeting ? <span lang={theme.lang}>{theme.greeting}</span> : t("search.resultsLabel")}
        </p>
        <h1
          id="results-title"
          className="font-display text-[32px] font-bold leading-[1.05] tracking-[-0.02em] text-ink sm:text-[40px]"
        >
          {title}
        </h1>
        <p className="max-w-xl text-sm text-ink-muted">{theme.tagline[locale]}</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {place && (
            <span className="lm-badge lm-badge--neutral !h-7 !px-2.5">
              <MapPin size={13} className="text-primary" aria-hidden />
              {place}
            </span>
          )}
          <span className="lm-badge lm-badge--neutral !h-7 !px-2.5">
            <Users size={13} className="text-primary" aria-hidden />
            {guests}
          </span>
          {period && (
            <span className="lm-badge lm-badge--neutral !h-7 !px-2.5">
              <CalendarDays size={13} className="text-primary" aria-hidden />
              {period}
            </span>
          )}
        </div>
        {children}
      </div>
      <Motif id={theme.id} />
    </section>
  );
}
