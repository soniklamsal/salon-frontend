/**
 * The salon publishes more than one number, and the CMS holds them all in a
 * single comma-separated `phone` field so staff can add or drop a line in the
 * admin without a migration.
 *
 * Splitting that string is not cosmetic. A `tel:` URI treats a comma as a dial
 * *pause*, so `tel:9705779552,9841141439` does not offer a choice of numbers —
 * it dials the first and then sends the second as touch tones into the live
 * call. Every place that renders the phone field has to split it, which is why
 * the rule lives here rather than being written out at each call site.
 */

/** The individual numbers in a CMS phone field, blanks dropped. */
export function phoneNumbers(field: string): string[] {
  return field
    .split(",")
    .map((number) => number.trim())
    .filter(Boolean);
}

/** A dialable href for one number. Spaces go so the dialler gets one token. */
export function telHref(number: string): string {
  return `tel:${number.replace(/\s+/g, "")}`;
}
