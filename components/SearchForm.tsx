"use client";

import { LMP_COUNTRIES, LMP_POPULAR_DESTINATIONS } from "@/lib/providers/lmp-countries";
import { upcomingMonths } from "@/lib/months";
import { useAppPreferences } from "@/components/providers/AppProviders";
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
  const { locale, t } = useAppPreferences();
  const allDestinations = Object.keys(LMP_COUNTRIES).sort((a, b) =>
    a.localeCompare(b, locale === "en" ? "en" : "sr")
  );
  const months = upcomingMonths(8, new Date(), locale);
  const destinations = allDestinations;

  const destinationSelect = (
    id: string,
    triggerClass?: string,
    placeholder?: string
  ) => (
    <Select.Root
      name="destination"
      defaultValue={defaultDestination || undefined}
      required
      size="3"
    >
      <Select.Trigger
        id={id}
        placeholder={placeholder ?? t("search.destinationPlaceholder")}
        className={triggerClass ?? "w-full"}
      />
      <Select.Content>
        {destinations.map((name) => (
          <Select.Item key={name} value={name}>
            {name}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );

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
              {t("search.destination")}
            </Text>
            {destinationSelect("destination")}
          </Flex>

          <Flex direction="column" gap="1" className="min-w-[170px]">
            <Text
              as="label"
              size="2"
              weight="medium"
              className="flex items-center gap-1.5 text-[--gray-11]"
            >
              <CalendarDays size={14} className="text-[--accent-9]" />
              {t("search.period")}
            </Text>
            <Select.Root name="month" defaultValue={defaultMonth || "any"} size="3">
              <Select.Trigger className="w-full" />
              <Select.Content>
                <Select.Item value="any">{t("search.monthAny")}</Select.Item>
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
              {t("search.adults")}
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
              {t("search.children")}
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
          <Button type="submit" size="3" className="!cursor-pointer btn-brand">
            <Search size={16} />
            {t("search.submitHero")}
          </Button>
          <Text size="2" color="gray">
            {t("search.orTry")}
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

  const fieldClass = "field-theme";
  const formClass = embedded
    ? "w-full"
    : "surface-card w-full rounded-2xl p-4 sm:p-5";

  return (
    <form action="/search" method="get" className={formClass}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto_auto_auto] sm:items-end">
        <div className="space-y-1.5">
          <label
            htmlFor="destination-bar"
            className="flex items-center gap-1.5 label-caps"
          >
            <MapPin size={13} className="text-primary" />
            {t("search.destination")}
          </label>
          {destinationSelect("destination-bar", `w-full ${fieldClass}`)}
        </div>

        <div className="space-y-1.5 sm:w-36">
          <span className="label-caps">{t("search.periodShort")}</span>
          <Select.Root name="month" defaultValue={defaultMonth || "any"} size="3">
            <Select.Trigger className={`w-full ${fieldClass}`} />
            <Select.Content>
              <Select.Item value="any">{t("search.monthAny")}</Select.Item>
              {months.map((m) => (
                <Select.Item key={m.value} value={m.value}>
                  {m.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </div>

        <div className="space-y-1.5 sm:w-20">
          <label htmlFor="adults-bar" className="label-caps">
            {t("search.adults")}
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
              <Users size={15} className="text-primary" />
            </TextField.Slot>
          </TextField.Root>
        </div>

        <div className="space-y-1.5 sm:w-20">
          <label htmlFor="children-bar" className="label-caps">
            {t("search.children")}
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
              <Baby size={15} className="text-primary" />
            </TextField.Slot>
          </TextField.Root>
        </div>

        <Button
          type="submit"
          size="3"
          className="!w-full btn-brand-solid sm:!w-auto sm:min-w-[7.5rem]"
        >
          <Search size={16} />
          {t("search.submit")}
        </Button>
      </div>

      {showQuickPicks && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--border-muted)] pt-3">
          <span className="label-caps">{t("search.quick")}</span>
          {LMP_POPULAR_DESTINATIONS.map((d) => (
            <a
              key={d}
              href={`/search?destination=${encodeURIComponent(d)}&adults=${defaultAdults}&children=${defaultChildren}`}
              className="chip-inactive !py-1 !px-2.5 hover:!text-theme-muted"
            >
              {d}
            </a>
          ))}
        </div>
      )}
    </form>
  );
}
