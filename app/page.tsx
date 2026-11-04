import HomeHero from "@/components/HomeHero";
import HeroScene from "@/components/HeroScene";

export default function Home() {
  return (
    <div className="relative isolate flex flex-1 flex-col overflow-hidden">
      <HeroScene />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 pt-12 pb-40 sm:px-6 sm:pt-20 sm:pb-48">
        <HomeHero />
      </main>
    </div>
  );
}
