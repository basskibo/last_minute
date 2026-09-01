import Link from "next/link";
import { Compass } from "lucide-react";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-muted)] bg-[color-mix(in_srgb,var(--bg)_75%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-theme transition hover:text-primary-hover"
        >
          <span className="logo-brand">
            <Compass size={16} className="text-[var(--primary-fg)]" strokeWidth={2.25} />
          </span>
          <span className="text-sm font-semibold tracking-tight sm:text-base">
            Last Minute Finder
          </span>
        </Link>
      </div>
    </header>
  );
}
