import HomeHero from "@/components/HomeHero";

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-[var(--gradient-hero)]"
      />
      <div
        aria-hidden
        className="absolute -top-24 right-1/4 -z-10 h-72 w-72 rounded-full blur-3xl hero-glow-primary"
      />
      <div
        aria-hidden
        className="absolute -top-10 left-1/4 -z-10 h-72 w-72 rounded-full blur-3xl hero-glow-accent"
      />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-10 px-4 py-16 sm:px-6 sm:py-24">
        <HomeHero />
      </main>
    </div>
  );
}
