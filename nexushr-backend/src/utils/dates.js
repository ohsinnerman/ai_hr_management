// Date helpers — attendance dates are stored at midnight UTC for stable day-keys.

export const midnightUTC = (d = new Date()) => {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
};

export const isWeekend = (d) => {
  const day = new Date(d).getUTCDay(); // 0 = Sun, 6 = Sat
  return day === 0 || day === 6;
};

/**
 * Yields a midnight-UTC Date for each working day (Mon–Fri) in [start, end] inclusive.
 */
export function* eachWorkingDay(start, end) {
  let cur = midnightUTC(start);
  const last = midnightUTC(end);
  while (cur <= last) {
    if (!isWeekend(cur)) yield new Date(cur);
    cur = new Date(cur.getTime() + 24 * 3600 * 1000);
  }
}

export const countWorkingDays = (start, end) => {
  let count = 0;
  for (const _day of eachWorkingDay(start, end)) count++;
  return count;
};

/**
 * Parse a 'HH:MM' string against a reference date, returning a Date at that
 * time on the reference day (UTC basis, matching how attendance dates are keyed).
 */
export const cutoffOn = (hhmm, ref = new Date()) => {
  const [hh, mm] = String(hhmm || '09:30').split(':').map((n) => parseInt(n, 10) || 0);
  const d = midnightUTC(ref);
  d.setUTCHours(hh, mm, 0, 0);
  return d;
};
