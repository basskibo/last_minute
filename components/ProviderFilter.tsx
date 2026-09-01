"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { ProviderStatus } from "@/lib/search";

export default function ProviderFilter({
  providerStatus,
}: {
  providerStatus: ProviderStatus[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeRaw = searchParams.get("providers");
  const active = activeRaw ? activeRaw.split(",") : null;

  function toggle(id: string) {
    const current = active ?? providerStatus.map((p) => p.id);
    const next = current.includes(id)
      ? current.filter((p) => p !== id)
      : [...current, id];

    const params = new URLSearchParams(searchParams.toString());
    if (next.length === 0 || next.length === providerStatus.length) {
      params.delete("providers");
    } else {
      params.set("providers", next.join(","));
    }
    router.push(`/search?${params.toString()}`);
  }

  if (providerStatus.length === 0) return null;

  const activeCount = active ? active.length : providerStatus.length;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <p className="label-caps">Izvori ponuda</p>
        <span className="text-[11px] tabular-nums text-theme-subtle">
          {activeCount}/{providerStatus.length} aktivno
        </span>
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {providerStatus.map((p) => {
          const isActive = active ? active.includes(p.id) : true;
          const isEmpty = p.count === 0;

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p.id)}
              title={p.note}
              className={[
                "shrink-0 transition-all",
                isActive ? "chip-active" : "chip-inactive",
                isEmpty && isActive ? "opacity-60" : "",
              ].join(" ")}
            >
              {p.label}
              <span
                className={`ml-1.5 tabular-nums ${isActive ? "text-primary" : "text-theme-subtle"}`}
              >
                {p.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
