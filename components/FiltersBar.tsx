"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown, ListChecks } from "lucide-react";
import { Flex, Select, Text } from "@radix-ui/themes";

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "price-asc", label: "Cena: najniža prvo" },
  { value: "price-desc", label: "Cena: najviša prvo" },
  { value: "discount", label: "Najveći popust" },
];

export default function FiltersBar({ resultCount }: { resultCount: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") || "price-asc";

  function handleSortChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <Flex align="center" justify="between" gap="4" mb="4">
      <Text size="2" color="gray" className="flex items-center gap-1.5">
        <ListChecks size={15} className="text-[--accent-9]" />
        {resultCount} pronađenih ponuda
      </Text>
      <Flex align="center" gap="2">
        <Text size="2" color="gray" className="flex items-center gap-1.5">
          <ArrowUpDown size={14} />
          Sortiraj:
        </Text>
        <Select.Root value={currentSort} onValueChange={handleSortChange} size="2">
          <Select.Trigger />
          <Select.Content>
            {SORT_OPTIONS.map((opt) => (
              <Select.Item key={opt.value} value={opt.value}>
                {opt.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      </Flex>
    </Flex>
  );
}
