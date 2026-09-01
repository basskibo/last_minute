import type { Offer } from "@/lib/providers/types";
import { getProviderLogo } from "@/lib/provider-logos";
import { pickBestRoom } from "@/lib/rooms";
import { Bus, Car, CalendarDays, MapPin, Users } from "lucide-react";
import { Badge, Box, Card, Flex, Heading, Text } from "@radix-ui/themes";

const TRANSPORT_LABEL: Record<string, string> = {
  avion: "Avion",
  autobus: "Autobus",
  sopstveni: "Sopstveni prevoz",
  nepoznato: "",
};

const ACCOMMODATION_LABEL: Record<string, string> = {
  hotel: "Hotel",
  apartman: "Apartman/Studio",
  nepoznato: "",
};

function discountPercent(offer: Offer): number | null {
  if (!offer.oldPricePerPerson || !offer.pricePerPerson) return null;
  const pct =
    ((offer.oldPricePerPerson - offer.pricePerPerson) / offer.oldPricePerPerson) * 100;
  return pct > 0 ? Math.round(pct) : null;
}

function peopleWord(n: number): string {
  if (n === 1) return "osoba";
  if (n >= 2 && n <= 4) return "osobe";
  return "osoba";
}

const euro = (n: number) => Math.round(n);

export default function OfferCard({ offer, people }: { offer: Offer; people: number }) {
  const discount = discountPercent(offer);

  const tags = [
    ...offer.transport.map((t) => TRANSPORT_LABEL[t]).filter(Boolean),
    ...offer.accommodation.map((a) => ACCOMMODATION_LABEL[a]).filter(Boolean),
  ];

  const bestRoom = offer.roomOptions?.length ? pickBestRoom(offer.roomOptions, people) : null;
  const headlinePerPerson = bestRoom ? bestRoom.room.price : offer.pricePerPerson;
  const headlineCapacity = bestRoom?.capacity ?? people;
  const headlineTotal =
    headlinePerPerson != null ? euro(headlinePerPerson * headlineCapacity) : null;

  const coverImage = offer.image ?? getProviderLogo(offer.provider);
  const isAgencyLogo = !offer.image && Boolean(coverImage);
  const showLocation =
    offer.location &&
    offer.location.trim().toLowerCase() !== offer.title.trim().toLowerCase();

  return (
    <Card
      asChild
      size="2"
      className="group !p-0 overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/40"
    >
      <a href={offer.sourceUrl} target="_blank" rel="noopener noreferrer">
        <Box className="relative aspect-[5/4] overflow-hidden bg-[--gray-3] sm:aspect-[4/3]">
          {coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImage}
              alt={isAgencyLogo ? offer.sourceLabel : offer.title}
              className={
                isAgencyLogo
                  ? "h-full w-full bg-slate-100 object-contain p-6 dark:bg-slate-200"
                  : "h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              }
            />
          ) : (
            <Flex
              align="center"
              justify="center"
              className="h-full w-full bg-gradient-to-br from-[--gray-a3] to-[--accent-a3]"
            >
              <Text size="2" weight="medium" color="gray" className="px-4 text-center">
                {offer.sourceLabel}
              </Text>
            </Flex>
          )}

          {discount != null && (
            <Badge
              color="ruby"
              variant="solid"
              radius="full"
              className="absolute left-2.5 top-2.5 shadow-sm"
            >
              -{discount}%
            </Badge>
          )}

          <Badge
            color="gray"
            variant="solid"
            highContrast
            radius="full"
            className="absolute right-2.5 top-2.5 shadow-sm"
          >
            {offer.sourceLabel}
          </Badge>
        </Box>

        <Box p="4">
          <Heading size="3" className="line-clamp-2 leading-snug">
            {offer.title}
          </Heading>

          {(showLocation || offer.dateRange) && (
            <Flex direction="column" gap="1" mt="1.5">
              {showLocation && (
                <Flex align="center" gap="2">
                  <MapPin size={13} className="shrink-0 text-[--accent-9]" />
                  <Text size="2" color="gray" className="line-clamp-1">
                    {offer.location}
                  </Text>
                </Flex>
              )}
              {offer.dateRange && (
                <Flex align="center" gap="2">
                  <CalendarDays size={13} className="shrink-0 text-[--accent-9]" />
                  <Text size="2" color="gray">
                    {offer.dateRange}
                    {offer.nights ? ` · ${offer.nights}` : ""}
                  </Text>
                </Flex>
              )}
            </Flex>
          )}

          {tags.length > 0 && (
            <Flex gap="1" wrap="wrap" mt="2">
              {tags.map((t) => (
                <Badge key={t} color="gray" variant="soft" radius="full">
                  {t}
                </Badge>
              ))}
            </Flex>
          )}

          {offer.description && (
            <Text as="p" size="2" color="gray" mt="2" className="line-clamp-2">
              {offer.description}
            </Text>
          )}

          {offer.roomOptions && offer.roomOptions.length > 0 && (
            <Box mt="2" className="overflow-hidden rounded-lg bg-[--gray-a3]">
              {offer.roomOptions.map((r, i) => (
                <Flex
                  key={r.label}
                  align="center"
                  justify="between"
                  px="3"
                  py="2"
                  className={i !== 0 ? "border-t border-[--gray-a5]" : ""}
                >
                  <Text size="2" color="gray" className="line-clamp-1 flex-1">
                    {r.label}
                  </Text>
                  <Flex align="center" gap="2" className="shrink-0">
                    {r.transportIncluded === true && (
                      <Bus size={13} className="text-[--accent-9]" aria-label="Prevoz uključen" />
                    )}
                    {r.transportIncluded === false && (
                      <Car size={13} className="text-[--gray-9]" aria-label="Sopstveni prevoz" />
                    )}
                    <Text size="2" weight="medium">
                      {euro(r.price)} €
                    </Text>
                  </Flex>
                </Flex>
              ))}
            </Box>
          )}

          <Box mt="3">
            {headlineTotal != null ? (
              <Flex
                align="center"
                justify="between"
                gap="2"
                p="3"
                className="rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-950/25"
              >
                <Box>
                  <Text
                    as="p"
                    size="1"
                    weight="bold"
                    className="uppercase tracking-wide text-sky-100/90"
                  >
                    Ukupno za grupu
                  </Text>
                  <Text as="p" size="6" weight="bold" className="tabular-nums">
                    {headlineTotal} €
                  </Text>
                </Box>
                <Box className="text-right">
                  <Flex align="center" gap="1" justify="end">
                    <Users size={12} />
                    <Text size="1">
                      {headlineCapacity} {peopleWord(headlineCapacity)}
                    </Text>
                  </Flex>
                  <Text as="p" size="1" className="tabular-nums">
                    {offer.oldPricePerPerson && (
                      <span className="mr-1 line-through opacity-60">
                        {euro(offer.oldPricePerPerson)} €
                      </span>
                    )}
                    {headlinePerPerson != null ? euro(headlinePerPerson) : "?"} €/osobi
                  </Text>
                </Box>
              </Flex>
            ) : (
              <Text size="2" color="gray">
                Cena na upit
              </Text>
            )}

            {bestRoom && !bestRoom.fits && bestRoom.capacity != null && (
              <Text as="p" size="1" color="amber" mt="1">
                Najveća dostupna soba je za {bestRoom.capacity}{" "}
                {peopleWord(bestRoom.capacity)} — manje od traženog broja.
              </Text>
            )}
          </Box>
        </Box>
      </a>
    </Card>
  );
}
