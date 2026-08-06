import type { RoomOption } from "./providers/types";

/**
 * Izvlači kapacitet sobe iz oznaka tipa "1/2 STD" (2 osobe) ili
 * "1/2+1 STD" (2+1 pomoćni ležaj = 3 osobe). Vraća null ako oznaka ne prati
 * ovaj obrazac (npr. generički "od X€" izvori bez sobnosti).
 */
export function parseRoomCapacity(label: string): number | null {
  const match = label.match(/1\/(\d+)(?:\+(\d+))?/);
  if (!match) return null;
  const base = parseInt(match[1], 10);
  const extra = match[2] ? parseInt(match[2], 10) : 0;
  return base + extra;
}

export interface BestRoom {
  room: RoomOption;
  capacity: number | null;
  /** Da li kapacitet sobe pokriva traženi broj osoba */
  fits: boolean;
}

/**
 * Bira najjeftiniju sobu čiji kapacitet pokriva traženi broj osoba; ako
 * nijedna ne odgovara (npr. grupa je veća od najveće ponuđene sobe), vraća
 * najveću dostupnu sobu kao najbliže rešenje i označava fits=false.
 */
export function pickBestRoom(roomOptions: RoomOption[], people: number): BestRoom | null {
  if (roomOptions.length === 0) return null;

  const withCapacity = roomOptions.map((room) => ({
    room,
    capacity: parseRoomCapacity(room.label),
  }));

  const fitting = withCapacity.filter((r) => r.capacity != null && r.capacity >= people);
  if (fitting.length > 0) {
    fitting.sort((a, b) => a.room.price * (a.capacity ?? 1) - b.room.price * (b.capacity ?? 1));
    return { ...fitting[0], fits: true };
  }

  const withKnownCapacity = withCapacity.filter((r) => r.capacity != null);
  if (withKnownCapacity.length > 0) {
    withKnownCapacity.sort((a, b) => (b.capacity ?? 0) - (a.capacity ?? 0));
    return { ...withKnownCapacity[0], fits: false };
  }

  // Nijedna oznaka nije prepoznata — vrati najjeftiniju kao razuman fallback
  const cheapest = [...roomOptions].sort((a, b) => a.price - b.price)[0];
  return { room: cheapest, capacity: null, fits: false };
}
