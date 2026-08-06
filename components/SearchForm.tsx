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
}

export default function SearchForm({
  defaultDestination = "",
  defaultMonth = "",
  defaultAdults = 2,
  defaultChildren = 0,
}: SearchFormProps) {
  const allDestinations = Object.keys(LMP_COUNTRIES).sort((a, b) =>
    a.localeCompare(b, "sr")
  );
  const months = upcomingMonths();

  return (
    <form
      action="/search"
      method="get"
      className="w-full max-w-3xl rounded-2xl border border-[--gray-a5] bg-[--color-panel-solid] shadow-xl shadow-black/30 p-5 sm:p-6"
    >
      <Flex direction={{ initial: "column", sm: "row" }} gap="4" wrap="wrap">
        <Flex direction="column" gap="1" className="flex-1 min-w-[160px]">
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
          className="!bg-gradient-to-r from-sky-500 to-indigo-600 cursor-pointer"
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
              className="cursor-pointer hover:brightness-125 transition-all"
            >
              {d}
            </Badge>
          </a>
        ))}
      </Flex>
    </form>
  );
}
