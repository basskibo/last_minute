"use client";

import { useSyncExternalStore } from "react";

const FLIGHT_PATH = "M80 470 C 380 150, 860 90, 1380 170";
/** Silueta aviona (nos na +x), ~1.5× veličine ikonice */
const PLANE =
  "M21 0 L-15 -13 L-9 -1.5 L-24 -1.5 L-30 -9 L-34 -9 L-30 0 L-34 9 L-30 9 L-24 1.5 L-9 1.5 L-15 13 Z";

function subscribe(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const getReduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Dekorativna pozadina početne: sunce, oblaci, ruta aviona i talasi.
 * Boje dolaze iz tokena (radi u obe teme; u tamnoj se pale zvezde).
 * Sa "prefers-reduced-motion" sve stoji (avion miruje na sredini rute).
 */
export default function HeroScene() {
  const reduced = useSyncExternalStore(subscribe, getReduced, () => true);

  return (
    <div className="lm-hero-scene" aria-hidden>
      <svg viewBox="0 0 1440 640" preserveAspectRatio="xMidYMax slice" className="h-full w-full">
        <g className="lm-hero-stars">
          {[
            [140, 90], [320, 60], [520, 130], [700, 50], [930, 110], [1080, 40], [1260, 90], [1380, 260], [60, 230], [610, 240],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 3 ? 1.6 : 2.4} />
          ))}
        </g>

        <g className="lm-hero-sun">
          <circle cx="1180" cy="190" r="128" className="lm-hero-sun__glow" />
          <circle cx="1180" cy="190" r="74" className="lm-hero-sun__disc" />
        </g>

        <g className="lm-hero-cloud lm-hero-cloud--a">
          <path d="M880 150 a34 34 0 0 1 64 -14 a44 44 0 0 1 84 10 a28 28 0 0 1 8 54 h-150 a26 26 0 0 1 -6 -50 z" />
        </g>
        <g className="lm-hero-cloud lm-hero-cloud--b">
          <path d="M1260 300 a26 26 0 0 1 50 -10 a34 34 0 0 1 64 8 a22 22 0 0 1 6 42 h-116 a20 20 0 0 1 -4 -40 z" />
        </g>
        <g className="lm-hero-cloud lm-hero-cloud--c">
          <path d="M560 90 a22 22 0 0 1 42 -8 a28 28 0 0 1 54 6 a18 18 0 0 1 4 34 h-98 a17 17 0 0 1 -2 -32 z" />
        </g>

        <path d={FLIGHT_PATH} className="lm-hero-route" />
        {reduced ? (
          <g transform="translate(730 165) rotate(-8)" className="lm-hero-plane">
            <path d={PLANE} />
          </g>
        ) : (
          <g className="lm-hero-plane">
            <path d={PLANE}>
              <animateMotion dur="16s" repeatCount="indefinite" rotate="auto" path={FLIGHT_PATH} />
            </path>
          </g>
        )}

        <g className="lm-hero-waves">
          <path className="lm-hero-wave lm-hero-wave--back" d="M0 560 q90 -26 180 0 t180 0 t180 0 t180 0 t180 0 t180 0 t180 0 t180 0 t180 0 t180 0 V640 H0 Z" />
          <path className="lm-hero-wave lm-hero-wave--mid" d="M0 588 q120 -30 240 0 t240 0 t240 0 t240 0 t240 0 t240 0 t240 0 t240 0 V640 H0 Z" />
          <path className="lm-hero-wave lm-hero-wave--front" d="M0 612 q90 -18 180 0 t180 0 t180 0 t180 0 t180 0 t180 0 t180 0 t180 0 t180 0 t180 0 V640 H0 Z" />
        </g>
      </svg>
    </div>
  );
}
