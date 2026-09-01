"use client";

import { LMP_COUNTRIES, LMP_POPULAR_DESTINATIONS } from "@/lib/providers/lmp-countries";
import { upcomingMonths } from "@/lib/months";
import { Baby, CalendarDays, MapPin, Search, Users } from "lucide-react";
import { Badge, Button, Flex, Select, Text, TextField } from "@radix-ui/themes";

interface SearchFormProps {
  defaultDestination?: string;
  defaultMonth?: string;
  defaultAdults?: number;
  defaultChildren?: number;
  variant?: "hero" | "bar";
  embedded?: boolean;
  showQuickPicks?: boolean;
}

export default function SearchForm({
  defaultDestination = "",
  defaultMonth = "",
  defaultAdults = 2,
  defaultChildren = 0,
  variant = "bar",
  embedded = false,
  showQuickPicks = false,
}: SearchFormProps) {
  const allDestinations = Object.keys(LMP_COUNTRIES).sort((a, b) =>
    a.localeCompare(b, "sr")
  );
  const months = upcomingMonths();

  if (variant === "hero") {
    return (
      <form
        action="/search"
        method="get"
        className="w-full max-w-3xl rounded-2xl border border-[--gray-a5] bg-[--color-panel-solid] p-5 shadow-xl shadow-black/30 sm:p-6"
      >
        <Flex direction={{ initial: "column", sm: "row" }} gap="4" wrap="wrap">
          <Flex direction="column" gap="1" className="min-w-[160px] flex-1">
            <Text
              as="label"
              size="2"
              weight="medium"
              htmlFor="destination"
              className="flex items-center gap-1.5 text-[--gray-11]"
            >
              <MapPin size={14} className="text-[--accent-9]" />
              Destinacija
            </Text>
            <TextField.Root
              id="destination"
              name="destination"
              list="destination-options"
              defaultValue={defaultDestination}
              placeholder="npr. Grčka"
              required
              size="3"
            />
            <datalist id="destination-options">
              {allDestinations.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </Flex>

          <Flex direction="column" gap="1" className="min-w-[170px]">
            <Text
              as="label"
              size="2"
              weight="medium"
              className="flex items-center gap-1.5 text-[--gray-11]"
            >
              <CalendarDays size={14} className="text-[--accent-9]" />
              Period (mesec)
            </Text>
            <Select.Root name="month" defaultValue={defaultMonth || "any"} size="3">
              <Select.Trigger className="w-full" />
              <Select.Content>
                <Select.Item value="any">Svejedno</Select.Item>
                {months.map((m) => (
                  <Select.Item key={m.value} value={m.value}>
                    {m.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Flex>

          <Flex direction="column" gap="1" className="w-24">
            <Text
              as="label"
              size="2"
              weight="medium"
              htmlFor="adults"
              className="flex items-center gap-1.5 text-[--gray-11]"
            >
              <Users size={14} className="text-[--accent-9]" />
              Odrasli
            </Text>
            <TextField.Root
              id="adults"
              name="adults"
              type="number"
              min={1}
              max={20}
              defaultValue={defaultAdults}
              size="3"
            />
          </Flex>

          <Flex direction="column" gap="1" className="w-24">
            <Text
              as="label"
              size="2"
              weight="medium"
              htmlFor="children"
              className="flex items-center gap-1.5 text-[--gray-11]"
            >
              <Baby size={14} className="text-[--accent-9]" />
              Deca
            </Text>
            <TextField.Root
              id="children"
              name="children"
              type="number"
              min={0}
              max={10}
              defaultValue={defaultChildren}
              size="3"
            />
          </Flex>
        </Flex>

        <Flex mt="4" gap="2" align="center" wrap="wrap">
          <Button
            type="submit"
            size="3"
            className="!cursor-pointer !bg-gradient-to-r !from-sky-500 !to-indigo-600"
          >
            <Search size={16} />
            Pretraži ponude
          </Button>
          <Text size="2" color="gray">
            ili probaj:
          </Text>
          {LMP_POPULAR_DESTINATIONS.map((d) => (
            <a
              key={d}
              href={`/search?destination=${encodeURIComponent(d)}&adults=${defaultAdults}&children=${defaultChildren}`}
            >
              <Badge
                color="gray"
                variant="soft"
                radius="full"
                className="cursor-pointer transition-all hover:brightness-125"
              >
                {d}
              </Badge>
            </a>
          ))}
        </Flex>
      </form>
    );
  }

  const fieldClass = "!bg-slate-900/50 !border-white/[0.08] focus-within:!border-sky-500/40";
  const formClass = embedded
    ? "w-full"
    : "surface-card w-full rounded-2xl p-4 sm:p-5";

  return (
    <form action="/search" method="get" className={formClass}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto_auto_auto] sm:items-end">
        <div className="space-y-1.5">
          <label
            htmlFor="destination"
            className="text-[11px] font-medium uppercase tracking-wider text-slate-500"
          >
            Destinacija
          </label>
          <TextField.Root
            id="destination"
            name="destination"
            list="destination-options-bar"
            defaultValue={defaultDestination}
            placeholder="npr. Grčka"
            required
            size="3"
            className={fieldClass}
          >
            <TextField.Slot>
              <MapPin size={15} className="text-sky-400/90" />
            </TextField.Slot>
          </TextField.Root>
          <datalist id="destination-options-bar">
            {allDestinations.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>

        <div className="space-y-1.5 sm:w-36">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Period
          </span>
          <Select.Root name="month" defaultValue={defaultMonth || "any"} size="3">
            <Select.Trigger className={`w-full ${fieldClass}`} />
            <Select.Content>
              <Select.Item value="any">Svejedno</Select.Item>
              {months.map((m) => (
                <Select.Item key={m.value} value={m.value}>
                  {m.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </div>

        <div className="space-y-1.5 sm:w-20">
          <label
            htmlFor="adults-bar"
            className="text-[11px] font-medium uppercase tracking-wider text-slate-500"
          >
            Odrasli
          </label>
          <TextField.Root
            id="adults-bar"
            name="adults"
            type="number"
            min={1}
            max={20}
            defaultValue={defaultAdults}
            size="3"
            className={fieldClass}
          >
            <TextField.Slot>
              <Users size={15} className="text-sky-400/90" />
            </TextField.Slot>
          </TextField.Root>
        </div>

        <div className="space-y-1.5 sm:w-20">
          <label
            htmlFor="children-bar"
            className="text-[11px] font-medium uppercase tracking-wider text-slate-500"
          >
            Deca
          </label>
          <TextField.Root
            id="children-bar"
            name="children"
            type="number"
            min={0}
            max={10}
            defaultValue={defaultChildren}
            size="3"
            className={fieldClass}
          >
            <TextField.Slot>
              <Baby size={15} className="text-sky-400/90" />
            </TextField.Slot>
          </TextField.Root>
        </div>

        <Button
          type="submit"
          size="3"
          className="!w-full !cursor-pointer !bg-sky-500 hover:!bg-sky-400 sm:!w-auto sm:min-w-[7.5rem]"
        >
          <Search size={16} />
          Pretraži
        </Button>
      </div>

      {showQuickPicks && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-3">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
            Brzo:
          </span>
          {LMP_POPULAR_DESTINATIONS.map((d) => (
            <a
              key={d}
              href={`/search?destination=${encodeURIComponent(d)}&adults=${defaultAdults}&children=${defaultChildren}`}
              className="rounded-full bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-400 ring-1 ring-white/[0.06] transition hover:bg-slate-700 hover:text-slate-200"
            >
              {d}
            </a>
          ))}
        </div>
      )}
    </form>
  );
}
