import SearchForm from "@/components/SearchForm";
import { Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-[500px] bg-gradient-to-b from-sky-950/40 via-indigo-950/30 to-transparent"
      />
      <div
        aria-hidden
        className="absolute -top-24 right-1/4 -z-10 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -top-10 left-1/4 -z-10 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl"
      />

      <main className="flex flex-1 flex-col items-center px-4 sm:px-6 py-16 sm:py-24 gap-10">
        <div className="text-center max-w-2xl flex flex-col gap-3">
          <span className="inline-flex items-center gap-1.5 self-center text-xs font-semibold tracking-wide uppercase text-sky-300 bg-slate-900/80 backdrop-blur-sm border border-sky-800/60 rounded-full px-3 py-1.5 shadow-sm">
            <Sparkles size={13} />
            Last minute
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-100">
            Sve last minute ponude{" "}
            <span className="bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
              na jednom mestu
            </span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg">
            Unesi destinaciju, period i broj osoba — prikupljamo dostupne ponude
            smeštaja i paket aranžmana umesto tebe.
          </p>
        </div>

        <SearchForm />

        <p className="text-xs text-slate-500 max-w-xl text-center">
          Ponude se prikupljaju sa spoljnih sajtova i mogu povremeno kasniti ili
          nedostajati ako izvor privremeno nije dostupan. Rezervacija se uvek
          obavlja na sajtu agencije/izvora, ne ovde.
        </p>
      </main>
    </div>
  );
}
