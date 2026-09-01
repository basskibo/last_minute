import Link from "next/link";
import { Compass } from "lucide-react";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-slate-950/75 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-slate-100 transition hover:text-white"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 shadow-lg shadow-sky-950/40">
            <Compass size={16} className="text-white" strokeWidth={2.25} />
          </span>
          <span className="text-sm font-semibold tracking-tight sm:text-base">
            Last Minute Finder
          </span>
        </Link>
      </div>
    </header>
  );
}
