import SearchForm from "@/components/SearchForm";
import { Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-gradient-to-b from-sky-950/40 via-indigo-950/30 to-transparent"
      />
      <div
        aria-hidden
        className="absolute -top-24 right-1/4 -z-10 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -top-10 left-1/4 -z-10 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl"
      />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-10 px-4 py-16 sm:px-6 sm:py-24">
        <div className="flex max-w-2xl flex-col gap-3 text-center">
          <span className="inline-flex items-center gap-1.5 self-center rounded-full border border-sky-800/60 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-sky-300 shadow-sm backdrop-blur-sm">
            <Sparkles size={13} />
            Last minute
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-slate-100 sm:text-5xl">
            Sve last minute ponude{" "}
            <span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
              na jednom mestu
            </span>
          </h1>
          <p className="text-base text-slate-400 sm:text-lg">
            Unesi destinaciju, period i broj osoba — prikupljamo dostupne ponude
            smeštaja i paket aranžmana umesto tebe.
          </p>
        </div>

        <SearchForm variant="hero" />

        <p className="max-w-xl text-center text-xs text-slate-500">
          Ponude se prikupljaju sa spoljnih sajtova i mogu povremeno kasniti ili
          nedostajati ako izvor privremeno nije dostupan. Rezervacija se uvek
          obavlja na sajtu agencije/izvora, ne ovde.
        </p>
      </main>
    </div>
  );
}
