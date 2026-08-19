/**
 * Helpers for MySQL DATE columns.
 *
 * mysql2 hands back DATE columns as JS Date objects. JSON.stringify turns those
 * into full ISO-8601 datetimes ("2026-11-01T17:00:00.000Z"), which MySQL then
 * refuses on the way back in:
 *
 *   ER_TRUNCATED_WRONG_VALUE: Incorrect date value:
 *   '2026-11-01T17:00:00.000Z' for column 'start_date'
 *
 * So editing any record that carried a date failed with a 500. The ISO string
 * is also shifted into UTC, so "2026-11-02" came back as the 1st in any
 * timezone behind UTC - a silent off-by-one-day even where the write did land.
 *
 * `toSqlDate` normalises anything the client sends back into `YYYY-MM-DD`;
 * `fromSqlDate` is used when reading so the API emits a plain date string and
 * the round-trip stays stable.
 */

/** Format a Date using its *local* components, never UTC. */
function localYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Coerce a value bound for a DATE column into `YYYY-MM-DD`, or null.
 * Accepts a Date, a `YYYY-MM-DD` string, or an ISO datetime string.
 */
export function toSqlDate(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : localYmd(value);
  }

  if (typeof value === 'string') {
    // Already a plain date - keep it exactly as-is, no timezone maths.
    const plain = /^(\d{4}-\d{2}-\d{2})$/.exec(value);
    if (plain) return plain[1];

    // ISO datetime: take the calendar date off the front rather than
    // re-parsing, so it cannot shift across a timezone boundary.
    const iso = /^(\d{4}-\d{2}-\d{2})T/.exec(value);
    if (iso) return iso[1];

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : localYmd(parsed);
  }

  return null;
}

/** Serialise a DATE column read from MySQL as `YYYY-MM-DD` (or null). */
export function fromSqlDate(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : localYmd(value);
  }
  if (typeof value === 'string') return toSqlDate(value);
  return null;
}
