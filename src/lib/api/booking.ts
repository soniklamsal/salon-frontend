import type {
  Barber,
  BookingConfig,
  BookingCopy,
  Service,
} from "@/lib/types/content-types";
import { FALLBACK_BOOKING_CONFIG } from "@/lib/fallbacks/booking-fallback";

/**
 * Server-side reader for the booking form's options.
 *
 * Mirrors `lib/content.ts`: one request serves the whole form
 * (`/api/v1/booking-config/` returns services, barbers and the eSewa QR), and
 * failure is never fatal — a stopped backend costs the ability to *book*, not
 * the ability to serve the page.
 *
 * The fallback here is deliberately empty rather than invented. Content has a
 * shipped copy to fall back on; a barber does not. Showing a made-up stylist,
 * or a QR that is not the salon's, would take a real payment to the wrong
 * place — so the page says the form is unavailable instead.
 */

const API_BASE = (
  process.env.SALON_API_URL ?? "http://127.0.0.1:8001/api/v1"
).replace(/\/$/, "");

const REVALIDATE_SECONDS = Number(process.env.SALON_API_REVALIDATE ?? 60);
const TIMEOUT_MS = Number(process.env.SALON_API_TIMEOUT_MS ?? 4000);

/**
 * Only the wording is defaulted here, not the data. If the backend is down
 * there is nothing to book, but the component still needs strings to render its
 * "unavailable" state without printing `undefined`.
 */
export const DEFAULT_BOOKING_COPY: BookingCopy = {
  pageHeading: "Book your seat",
  pageIntro:
    "Pick a service and a stylist, tell us when suits you, and we will confirm by phone.",
  serviceHeading: "Choose your service",
  barberHeading: "Choose your barber",
  detailsHeading: "Your details",
  paymentHeading: "Pay with eSewa",
  serviceStep: "Service",
  barberStep: "Barber",
  detailsStep: "Details",
  paymentStep: "Payment",
  submitLabel: "Submit booking",
  successHeading: "Booking request sent",
};

export const EMPTY_BOOKING_CONFIG: BookingConfig = {
  services: [],
  barbers: [],
  esewa: { qr: "", note: "", depositPercent: 100 },
  copy: DEFAULT_BOOKING_COPY,
};

/** The browser posts here directly, so it needs the same base the server used. */
export const BOOKING_ENDPOINT = `${API_BASE}/appointments/`;

/** Per-person, so it is fetched in the browser with the session token. */
export const MY_BOOKINGS_ENDPOINT = `${API_BASE}/my-bookings/`;

/** The contact page posts here; stored as `bookings.ContactMessage`. */
export const CONTACT_ENDPOINT = `${API_BASE}/contact-messages/`;

/**
 * What to send now for the chosen service.
 *
 * `priceFrom` is a DRF-serialised decimal, so it arrives as a string and may be
 * null — a service with no price set is a real state, not an error, and the
 * caller renders "we will confirm the amount" for it rather than "Rs NaN".
 * Rounded to whole rupees: eSewa transfers are not made in paisa, and an amount
 * the customer cannot actually type is worse than a rounded one.
 *
 * Lives here rather than in the booking component because it decides what a
 * customer is told to pay. That is business logic, and it is worth being able
 * to test it without mounting a form.
 */
export function depositFor(
  service: Pick<Service, "priceFrom"> | null,
  percent: number
): { full: number; due: number } | null {
  if (!service?.priceFrom) return null;
  const full = Number(service.priceFrom);
  if (!Number.isFinite(full)) return null;
  return { full, due: Math.round((full * percent) / 100) };
}

/**
 * Whether a barber can be picked in the booking flow.
 *
 * Only an explicit `false` blocks them. A payload without the field at all — a
 * response cached before the backend learned to send it, or an older
 * deployment — must not lock every barber out of a working booking form. The
 * API rejects an unavailable barber on submit regardless, so the safe default
 * here is to let the customer through rather than to strand them.
 */
export function isBookable(barber: Pick<Barber, "isAvailable">): boolean {
  return barber.isAvailable !== false;
}

/**
 * Why step 2 cannot be completed, or "" when it can.
 *
 * Three states that a single `barbers.every(b => !b.isAvailable)` check
 * conflated — and an empty array satisfies `every` vacuously, so a backend
 * that was merely unreachable reported that the whole team had stopped taking
 * bookings.
 */
export function barberStepProblem(barbers: Barber[]): "" | "unloadable" | "none-free" {
  if (barbers.length === 0) return "unloadable";
  if (!barbers.some(isBookable)) return "none-free";
  return "";
}

export async function getBookingConfig(): Promise<BookingConfig> {
  try {
    const response = await fetch(`${API_BASE}/booking-config/`, {
      headers: { Accept: "application/json" },
      next: { revalidate: REVALIDATE_SECONDS, tags: ["booking-config"] },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    const payload = (await response.json()) as Partial<BookingConfig>;
    return {
      services: payload.services ?? [],
      barbers: payload.barbers ?? [],
      esewa: payload.esewa ?? EMPTY_BOOKING_CONFIG.esewa,
      // Merged rather than replaced: a backend that has not learned a newer
      // field yet should not blank the heading it does not send.
      copy: { ...DEFAULT_BOOKING_COPY, ...payload.copy },
    };
  } catch (error) {
    console.warn(
      `[booking] ${API_BASE}/booking-config/ unavailable (${
        error instanceof Error ? error.message : String(error)
      }) — using fallback booking configuration.`
    );
    return FALLBACK_BOOKING_CONFIG;
  }
}
