"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Badge, Flex, Text } from "@radix-ui/themes";
import { Check } from "lucide-react";
import type { ProviderStatus } from "@/lib/search";

export default function ProviderFilter({
  providerStatus,
}: {
  providerStatus: ProviderStatus[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeRaw = searchParams.get("providers");
  const active = activeRaw ? activeRaw.split(",") : null; // null = svi izvori

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

  return (
    <Flex gap="2" wrap="wrap" align="center">
      <Text size="2" color="gray">
        Izvor:
      </Text>
      {providerStatus.map((p) => {
        const isActive = active ? active.includes(p.id) : true;
        return (
          <Badge
            key={p.id}
            asChild
            size="2"
            radius="full"
            color={isActive ? "sky" : "gray"}
            variant={isActive ? "solid" : "soft"}
            className="cursor-pointer select-none"
          >
            <button type="button" onClick={() => toggle(p.id)} title={p.note}>
              <Flex align="center" gap="1">
                {isActive && <Check size={12} />}
                {p.label} ({p.count})
              </Flex>
            </button>
          </Badge>
        );
      })}
    </Flex>
  );
}
