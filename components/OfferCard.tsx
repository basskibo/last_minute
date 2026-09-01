"use client";

import type { Offer } from "@/lib/providers/types";
import { getProviderLogo } from "@/lib/provider-logos";
import { pickBestRoom } from "@/lib/rooms";
import { useAppPreferences } from "@/components/providers/AppProviders";
import { peopleWord, type MessageKey } from "@/lib/i18n/messages";
import { Bus, CalendarDays, Car, MapPin } from "lucide-react";

const TRANSPORT_KEYS: Record<string, MessageKey> = {
  avion: "offer.transport.avion",
  autobus: "offer.transport.autobus",
  sopstveni: "offer.transport.sopstveni",
};

const ACCOMMODATION_KEYS: Record<string, MessageKey> = {
  hotel: "offer.accommodation.hotel",
  apartman: "offer.accommodation.apartman",
};

const MAX_ROOM_ROWS = 3;

function discountPercent(offer: Offer): number | null {
  if (!offer.oldPricePerPerson || !offer.pricePerPerson) return null;
  const pct =
    ((offer.oldPricePerPerson - offer.pricePerPerson) / offer.oldPricePerPerson) * 100;
  return pct > 0 ? Math.round(pct) : null;
}

const euro = (n: number) => Math.round(n);

export default function OfferCard({ offer, people }: { offer: Offer; people: number }) {
  const { locale, t } = useAppPreferences();
  const discount = discountPercent(offer);

  const tags = [
    ...offer.transport.map((tr) => TRANSPORT_KEYS[tr] && t(TRANSPORT_KEYS[tr])).filter(Boolean),
    ...offer.accommodation
      .map((a) => ACCOMMODATION_KEYS[a] && t(ACCOMMODATION_KEYS[a]))
      .filter(Boolean),
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

  const roomOptions = offer.roomOptions ?? [];
  const visibleRooms = roomOptions.slice(0, MAX_ROOM_ROWS);
  const hiddenRoomCount = roomOptions.length - visibleRooms.length;

  return (
    <article className="offer-card group">
      <a
        href={offer.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="offer-card-link"
      >
        <div className="relative h-44 shrink-0 overflow-hidden surface-muted">
          {coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImage}
              alt={isAgencyLogo ? offer.sourceLabel : offer.title}
              className={
                isAgencyLogo
                  ? "h-full w-full bg-zinc-100 object-contain p-7"
                  : "h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
              }
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-sm text-theme-muted">{offer.sourceLabel}</span>
            </div>
          )}

          {!isAgencyLogo && (
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#09090b]/75 via-transparent to-transparent" />
          )}

          {discount != null && (
            <span className="absolute left-3 top-3 rounded-md bg-[color-mix(in_srgb,var(--success)_85%,#166534)] px-2 py-0.5 text-[11px] font-bold text-[var(--primary-fg)]">
              −{discount}%
            </span>
          )}

          <span className="absolute bottom-3 left-3 max-w-[70%] truncate rounded-md border border-[var(--border)] bg-[var(--surface-overlay)] px-2 py-0.5 text-[11px] font-medium text-theme backdrop-blur-sm">
            {offer.sourceLabel}
          </span>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
          <div className="min-h-[5.5rem] space-y-2">
            <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug tracking-tight text-theme">
              {offer.title}
            </h3>

            <div className="space-y-1.5">
              {showLocation && (
                <p className="flex items-center gap-1.5 text-xs text-theme-muted">
                  <MapPin size={12} className="shrink-0 text-primary" />
                  <span className="line-clamp-1">{offer.location}</span>
                </p>
              )}
              {offer.dateRange && (
                <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-theme-muted">
                  <CalendarDays size={12} className="shrink-0 text-primary" />
                  <span>{offer.dateRange}</span>
                  {offer.nights && (
                    <span className="nights-badge">{offer.nights}</span>
                  )}
                </p>
              )}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {tags.map((tag) => (
                    <span key={tag} className="tag-brand">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {offer.description && (
            <p className="line-clamp-2 text-xs leading-relaxed text-theme-subtle">
              {offer.description}
            </p>
          )}

          {visibleRooms.length > 0 && (
            <div className="divide-y divide-[var(--border-muted)] overflow-hidden rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface-muted)_40%,transparent)]">
              {visibleRooms.map((r) => (
                <div
                  key={r.label}
                  className="flex items-center justify-between gap-2 px-3 py-2"
                >
                  <span className="line-clamp-1 flex-1 text-xs text-theme-muted">{r.label}</span>
                  <div className="flex shrink-0 items-center gap-2">
                    {r.transportIncluded === true && (
                      <Bus
                        size={12}
                        className="text-primary"
                        aria-label={t("offer.transportIncluded")}
                      />
                    )}
                    {r.transportIncluded === false && (
                      <Car
                        size={12}
                        className="text-theme-subtle"
                        aria-label={t("offer.ownTransport")}
                      />
                    )}
                    <span className="text-xs font-semibold tabular-nums text-theme">
                      {euro(r.price)} €
                    </span>
                  </div>
                </div>
              ))}
              {hiddenRoomCount > 0 && (
                <p className="px-3 py-1.5 text-[11px] text-theme-subtle">
                  {t("offer.moreRooms", { count: hiddenRoomCount })}
                </p>
              )}
            </div>
          )}

          <div className="mt-auto border-t border-[var(--border)] pt-3">
            {headlineTotal != null ? (
              <div className="flex items-end justify-between gap-3">
                <div>
                  {offer.oldPricePerPerson && headlinePerPerson != null && (
                    <p className="text-xs tabular-nums text-theme-subtle line-through">
                      {euro(offer.oldPricePerPerson)} € {t("offer.perPerson")}
                    </p>
                  )}
                  <p className="text-sm font-medium tabular-nums text-theme-muted">
                    {headlinePerPerson != null ? euro(headlinePerPerson) : "?"} €
                    <span className="font-normal text-theme-subtle"> {t("offer.perPerson")}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-theme-subtle">
                    {t("offer.totalFor", {
                      count: headlineCapacity,
                      people: peopleWord(headlineCapacity, locale),
                    })}
                  </p>
                </div>
                <p className="text-2xl font-bold tabular-nums tracking-tight text-gradient-price">
                  {headlineTotal} €
                </p>
              </div>
            ) : (
              <p className="text-sm text-theme-muted">{t("offer.priceOnRequest")}</p>
            )}

            {bestRoom && !bestRoom.fits && bestRoom.capacity != null && (
              <p className="mt-2 text-xs leading-snug text-warning">
                {t("offer.roomTooSmall", {
                  capacity: bestRoom.capacity,
                  people: peopleWord(bestRoom.capacity, locale),
                })}
              </p>
            )}
          </div>
        </div>
      </a>
    </article>
  );
}
