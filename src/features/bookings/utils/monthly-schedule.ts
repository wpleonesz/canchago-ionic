export interface TimeBlock {
  id: string;
  startsAt: string;
  endsAt: string;
}

export interface ConcreteSlot {
  startsAt: string;
  endsAt: string;
}

const parseTime = (value: string): [number, number] | null => {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours <= 23 && minutes <= 59 ? [hours, minutes] : null;
};

export const buildMonthlySlots = (month: string, weekdays: number[], blocks: TimeBlock[]): ConcreteSlot[] => {
  const monthMatch = /^(\d{4})-(\d{2})$/.exec(month);
  if (!monthMatch || weekdays.length === 0 || blocks.length === 0) return [];
  const year = Number(monthMatch[1]);
  const monthIndex = Number(monthMatch[2]) - 1;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const slots: ConcreteSlot[] = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, monthIndex, day);
    if (!weekdays.includes(date.getDay())) continue;
    for (const block of blocks) {
      const start = parseTime(block.startsAt);
      const end = parseTime(block.endsAt);
      if (!start || !end) continue;
      const startsAt = new Date(year, monthIndex, day, start[0], start[1]);
      const endsAt = new Date(year, monthIndex, day, end[0], end[1]);
      if (startsAt >= endsAt || startsAt <= new Date()) continue;
      slots.push({ startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() });
    }
  }
  return slots.sort((left, right) => left.startsAt.localeCompare(right.startsAt));
};

export const blocksOverlap = (blocks: TimeBlock[]): boolean =>
  blocks.some((block, index) =>
    blocks.some(
      (other, otherIndex) =>
        index !== otherIndex && block.startsAt < other.endsAt && block.endsAt > other.startsAt,
    ),
  );
