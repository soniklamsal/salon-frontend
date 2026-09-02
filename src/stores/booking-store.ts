import { create } from "zustand";

import type { Barber, Service, TimeSlot } from "@/lib/types/content-types";

/**
 * The booking flow's state: which service, which stylist, the customer's
 * details, and where they are in the four steps.
 *
 * ## Why this is a store, and what it is deliberately not
 *
 * The flow lives on one route in one component, so `useState` would also work.
 * Holding it here buys three things that matter as the flow grows:
 *
 *  - the steps can be split into separate components without threading twelve
 *    setters through props, which is what would otherwise happen the first time
 *    someone splits the 800-line form;
 *  - `reset()` is one call rather than twelve, so "book another" cannot leave a
 *    stale field behind — the bug that shape of code always eventually grows;
 *  - the selection logic is testable without mounting a form.
 *
 * ### No `persist` middleware. This is the important part.
 *
 * Persisting this state would be actively harmful, and the reasons are specific
 * rather than stylistic:
 *
 *  - **The payment screenshot is a `File`.** A `File` handle cannot be
 *    serialised to `localStorage`. A restored booking would come back with the
 *    screenshot silently missing — and that screenshot is the only thing the
 *    salon has to confirm a booking is real, so the customer would submit a
 *    booking that gets rejected and not know why.
 *  - **A stored service or barber goes stale.** Both can be unpublished in the
 *    admin. Restoring a selection made last week means offering a service the
 *    salon no longer performs; the API rejects it on submit, which is a
 *    confusing failure at the last step rather than an honest empty form.
 *  - **It is customer data.** Name, address and phone in `localStorage` is
 *    personal information sitting on a shared or borrowed device with no
 *    expiry and no way to clear it.
 *
 * If a resumable booking is ever wanted, the answer is a server-side draft
 * keyed to the signed-in account, not browser storage.
 *
 * ### Server data does not belong here either
 *
 * The catalogue of services and barbers is **not** in this store. It is server
 * state: fetched in `app/services/page.tsx` by `getBookingConfig()`, cached and
 * revalidated by Next, and passed down as props. Copying it into a client store
 * would give it a second, staler home and a cache with no invalidation.
 *
 * Only the customer's *choices* live here.
 */

export type SubmitStatus = "idle" | "sending" | "sent" | "error";

type BookingState = {
  // --- Step 1 & 2: what the customer picked
  step: number;
  service: Service | null;
  barber: Barber | null;

  // --- Step 2.5: time slot selection
  timeSlot: TimeSlot | null;
  selectedDate: string | null; // YYYY-MM-DD format
  availableSlots: TimeSlot[];
  loadingSlots: boolean;

  // --- Step 3: their details
  name: string;
  address: string;
  phone: string;
  description: string;

  // --- Step 4: proof of payment
  file: File | null;
  fileError: string;

  // --- Submission
  status: SubmitStatus;
  errorMessage: string;
  reference: string;
};

type BookingActions = {
  setStep: (step: number) => void;
  setService: (service: Service | null) => void;
  setBarber: (barber: Barber | null) => void;
  setTimeSlot: (timeSlot: TimeSlot | null) => void;
  setSelectedDate: (date: string | null) => void;
  setAvailableSlots: (slots: TimeSlot[]) => void;
  setLoadingSlots: (loading: boolean) => void;
  setField: (
    field: "name" | "address" | "phone" | "description",
    value: string
  ) => void;
  setFile: (file: File | null) => void;
  setFileError: (message: string) => void;
  setStatus: (status: SubmitStatus) => void;
  setErrorMessage: (message: string) => void;
  setReference: (reference: string) => void;
  /** Back to an empty form. Used by "Book another". */
  reset: () => void;
};

const INITIAL: BookingState = {
  step: 0,
  service: null,
  barber: null,
  timeSlot: null,
  selectedDate: null,
  availableSlots: [],
  loadingSlots: false,
  name: "",
  address: "",
  phone: "",
  description: "",
  file: null,
  fileError: "",
  status: "idle",
  errorMessage: "",
  reference: "",
};

export const useBookingStore = create<BookingState & BookingActions>((set) => ({
  ...INITIAL,

  setStep: (step) => set({ step }),
  setService: (service) => set({ service }),
  setBarber: (barber) => set({ barber }),
  setTimeSlot: (timeSlot) => set({ timeSlot }),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setAvailableSlots: (availableSlots) => set({ availableSlots }),
  setLoadingSlots: (loadingSlots) => set({ loadingSlots }),
  setField: (field, value) => set({ [field]: value } as Partial<BookingState>),
  setFile: (file) => set({ file }),
  setFileError: (fileError) => set({ fileError }),
  setStatus: (status) => set({ status }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
  setReference: (reference) => set({ reference }),

  // Spread of a frozen initial object rather than field-by-field assignment, so
  // a field added to the state above cannot be forgotten here — which is the
  // failure mode that leaves a previous customer's phone number in the form.
  reset: () => set({ ...INITIAL }),
}));

/**
 * Whether the customer may leave the step they are on.
 *
 * Derived, never stored. Keeping it out of the state is what stops the store
 * and the form disagreeing about whether a step is complete — the classic
 * duplicated-state bug. Steps 1 and 2 need a selection; step 3 needs the three
 * fields the API requires; step 4 needs the screenshot.
 */
export function canAdvance(state: BookingState, step: number): boolean {
  switch (step) {
    case 0:
      return state.service !== null;
    case 1:
      return state.barber !== null;
    case 2:
      return state.timeSlot !== null;
    case 3:
      return (
        state.name.trim() !== "" &&
        state.address.trim() !== "" &&
        state.phone.trim() !== "" &&
        state.description.trim() !== ""
      );
    case 4:
      return state.file !== null && state.fileError === "";
    default:
      return false;
  }
}
