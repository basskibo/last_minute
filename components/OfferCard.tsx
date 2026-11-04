"use client";

import { useState } from "react";
import type { Offer } from "@/lib/providers/types";
import { getProviderLogo } from "@/lib/provider-logos";
import { pickBestRoom } from "@/lib/rooms";
import { useAppPreferences } from "@/components/providers/AppProviders";
import { peopleWord, type MessageKey } from "@/lib/i18n/messages";
import { AlertTriangle, Bus, CalendarDays, Car, MapPin, Sparkles, Star } from "lucide-react";
import type { AiPick } from "@/lib/ai/analyze";

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

export default function OfferCard({
  offer,
  people,
  aiPick,
}: {
  offer: Offer;
  people: number;
  aiPick?: AiPick;
}) {
  const { locale, t } = useAppPreferences();
  const discount = discountPercent(offer);
  const fmt = (n: number) => euro(n).toLocaleString(locale === "en" ? "en-GB" : "sr-Latn-RS");

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

  const [imageFailed, setImageFailed] = useState(false);
  const coverImage = imageFailed ? undefined : offer.image ?? getProviderLogo(offer.provider);
  const isAgencyLogo = !offer.image && Boolean(coverImage);
  const showLocation =
    offer.location &&
    offer.location.trim().toLowerCase() !== offer.title.trim().toLowerCase();

  const roomOptions = offer.roomOptions ?? [];
  const visibleRooms = roomOptions.slice(0, MAX_ROOM_ROWS);
  const hiddenRoomCount = roomOptions.length - visibleRooms.length;

  return (
    <a
      href={offer.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`lm-offer group ${aiPick ? "lm-offer--ai" : ""}`}
    >
      <div
        className={`relative aspect-[16/10] shrink-0 overflow-hidden ${
          coverImage ? (isAgencyLogo ? "bg-white" : "bg-surface-2") : "lm-photo-fallback"
        }`}
      >
        {coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImage}
            alt={isAgencyLogo ? offer.sourceLabel : offer.title}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className={
              isAgencyLogo
                ? "h-full w-full object-contain p-8"
                : "h-full w-full object-cover transition duration-700 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            }
          />
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {aiPick && (
            <span className="lm-badge lm-badge--ai">
              <Sparkles size={12} aria-hidden />
              {t("ai.badge", { rank: aiPick.rank })}
            </span>
          )}
          {discount != null && <span className="lm-badge lm-badge--deal">−{discount}%</span>}
        </div>

        {offer.rating != null && (
          <span className="lm-badge lm-badge--rating absolute right-3 top-3">
            <Star size={12} aria-hidden className="fill-current" />
            {offer.rating.toFixed(1)}
          </span>
        )}

        <span className="lm-badge lm-badge--source absolute bottom-3 left-3 max-w-[75%] truncate">
          {offer.sourceLabel}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2.5 p-4">
        <h3 className="line-clamp-2 text-base font-semibold leading-[22px] tracking-tight text-ink">
          {offer.title}
        </h3>

        {aiPick && (
          <p className="lm-offer__ai">
            <Sparkles size={13} className="mt-0.5 shrink-0" aria-hidden />
            <span className="line-clamp-3">{aiPick.reason}</span>
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] leading-[18px] text-ink-muted">
          {showLocation && (
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin size={14} className="shrink-0 text-primary" aria-hidden />
              <span className="line-clamp-1">{offer.location}</span>
            </span>
          )}
          {offer.dateRange && (
            <span className="inline-flex items-center gap-1">
              <CalendarDays size={14} className="shrink-0 text-primary" aria-hidden />
              {offer.dateRange}
            </span>
          )}
          {offer.nights && <span className="lm-badge lm-badge--brand">{offer.nights}</span>}
        </div>

        {offer.reviewCount != null && (
          <p className="text-xs text-ink-subtle">{t("offer.reviews", { count: offer.reviewCount })}</p>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span key={tag} className="lm-badge lm-badge--neutral">
                {tag}
              </span>
            ))}
          </div>
        )}

        {offer.description && (
          <p className="line-clamp-2 text-[13px] leading-5 text-ink-subtle">{offer.description}</p>
        )}

        {visibleRooms.length > 0 && (
          <div className="lm-rooms mt-1">
            {visibleRooms.map((r) => {
              const isBest = bestRoom?.room.label === r.label;
              return (
                <div key={r.label} className={`lm-rooms__row ${isBest ? "text-ink" : ""}`}>
                  <span className="line-clamp-1 flex-1">{r.label}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    {r.transportIncluded === true && (
                      <Bus size={13} className="text-primary" aria-label={t("offer.transportIncluded")} />
                    )}
                    {r.transportIncluded === false && (
                      <Car size={13} className="text-ink-subtle" aria-label={t("offer.ownTransport")} />
                    )}
                    <b className={`whitespace-nowrap font-semibold tabular ${isBest ? "text-primary" : "text-ink"}`}>
                      {fmt(r.price)} €
                    </b>
                  </span>
                </div>
              );
            })}
            {hiddenRoomCount > 0 && (
              <p className="border-t border-line px-3 py-1.5 text-xs text-ink-subtle">
                {t("offer.moreRooms", { count: hiddenRoomCount })}
              </p>
            )}
          </div>
        )}

        <div className="mt-auto border-t border-line pt-3">
          {headlineTotal != null ? (
            <div className="flex items-end justify-between gap-3">
              <div className="text-[13px] leading-[18px]">
                {offer.oldPricePerPerson && headlinePerPerson != null && (
                  <p className="tabular text-ink-subtle line-through">
                    {fmt(offer.oldPricePerPerson)} € {t("offer.perPerson")}
                  </p>
                )}
                <p className="font-medium tabular text-ink-muted">
                  {headlinePerPerson != null ? fmt(headlinePerPerson) : "?"} € {t("offer.perPerson")}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-[28px] font-bold leading-8 tracking-[-0.02em] tabular text-ink">
                  {headlineTotal.toLocaleString(locale === "en" ? "en-GB" : "sr-Latn-RS")} €
                </p>
                <p className="text-xs text-ink-subtle">
                  {t("offer.totalFor", {
                    count: headlineCapacity,
                    people: peopleWord(headlineCapacity, locale),
                  })}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-muted">{t("offer.priceOnRequest")}</p>
          )}

          {bestRoom && !bestRoom.fits && bestRoom.capacity != null && (
            <p className="mt-2 flex items-start gap-1.5 text-xs leading-snug text-warning">
              <AlertTriangle size={13} className="mt-px shrink-0" aria-hidden />
              {t("offer.roomTooSmall", {
                capacity: bestRoom.capacity,
                people: peopleWord(bestRoom.capacity, locale),
              })}
            </p>
          )}
        </div>
      </div>
    </a>
  );
}
