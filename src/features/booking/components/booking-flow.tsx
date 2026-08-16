"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAuth, useUser } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { readApiError } from "@/lib/api/api-error";
import { CLERK_ENABLED } from "@/lib/auth";
import { barberStepProblem, depositFor, isBookable } from "@/lib/api/booking";
import { cn } from "@/lib/utils";
import { useBookingStore } from "@/stores/booking-store";
import type { BookingConfig } from "@/lib/types/content-types";
/**
 * The booking flow: service -> barber -> details -> payment.
 *
 * One client component rather than four routes. The whole thing is a single
 * submission — nothing is written until the last step — so putting the steps
 * in the URL would invite someone to land on step 4 with no service chosen and
 * nothing to post.
 *
 * The payment step is not a payment *integration*. The customer scans the
 * salon's eSewa QR, pays in their own app, and uploads a screenshot; a human
 * checks it in the admin before confirming. Nothing here verifies a transfer,
 * and the UI is written to say so rather than to imply the booking is paid.
 *
 * Posted as `multipart/form-data` to `/api/v1/appointments/` because of that
 * screenshot — `AppointmentCreateView` accepts multipart and JSON both.
 */

/** Matches the backend's ImageField guard; stops a 2MB-limit surprise at submit. */
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

function StepBar({ current, steps }: { current: number; steps: string[] }) {
  return (
    <ol className="mb-10 flex flex-wrap items-center gap-x-2 gap-y-3 sm:gap-x-3">
      {steps.map((label, i) => {
        const state = i === current ? "current" : i < current ? "done" : "todo";
        return (
          <li key={label} className="flex items-center gap-2 sm:gap-3">
            <span
              aria-current={state === "current" ? "step" : undefined}
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold transition-colors",
                state === "todo"
                  ? "border-border text-muted-foreground border"
                  : "bg-primary text-primary-foreground"
              )}
            >
              {state === "done" ? "✓" : i + 1}
            </span>
            <span
              className={cn(
                "text-[13px] font-medium sm:text-sm",
                state === "todo" ? "text-muted-foreground" : "text-foreground"
              )}
            >
              {label}
            </span>
            {i < steps.length - 1 ? (
              <span aria-hidden className="bg-border hidden h-px w-6 sm:block" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function ChoiceCard({
  selected,
  onClick,
  disabled = false,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      // A real `disabled` button, not a click handler that quietly does
      // nothing: it takes the card out of the tab order and tells a screen
      // reader why, which a styled-grey div would not.
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "focus-visible:ring-ring/60 flex w-full flex-col items-center gap-3 rounded-xl border p-4 text-center transition-colors outline-none focus-visible:ring-2",
        disabled
          ? "border-border cursor-not-allowed opacity-50"
          : "cursor-pointer",
        selected
          ? "border-primary bg-primary/10"
          : !disabled &&
              "border-border hover:border-foreground/40 hover:bg-foreground/3"
      )}
    >
      {children}
    </button>
  );
}

/** What the form needs from Clerk; null when accounts are switched off. */
type AuthBits = {
  getToken: () => Promise<string | null>;
  fullName: string;
  /** The address they signed up with. Shown, never edited, never posted. */
  email: string;
} | null;

/**
 * Clerk's hooks throw outside <ClerkProvider>, so they cannot sit in a
 * component that also has to render without one. This wrapper is mounted only
 * when Clerk is enabled and hands the results down as plain props.
 */
function BookingFlowWithAuth(props: {
  config: BookingConfig;
  endpoint: string;
}) {
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();
  return (
    <BookingForm
      {...props}
      auth={{
        getToken: () => getToken(),
        fullName: isLoaded ? (user?.fullName ?? "") : "",
        email: isLoaded
          ? (user?.primaryEmailAddress?.emailAddress ?? "")
          : "",
      }}
    />
  );
}

export function BookingFlow(props: {
  config: BookingConfig;
  endpoint: string;
}) {
  return CLERK_ENABLED ? (
    <BookingFlowWithAuth {...props} />
  ) : (
    <BookingForm {...props} auth={null} />
  );
}

function BookingForm({
  config,
  endpoint,
  auth,
}: {
  config: BookingConfig;
  endpoint: string;
  auth: AuthBits;
}) {
  /*
    Selected field by field rather than as one object. Each of these is a
    primitive or a stable reference, so a component that reads only `step`
    re-renders only when `step` changes -- which is what makes splitting the
    four steps into separate components a safe change later. Selecting the whole
    state object would hand every consumer a new reference on every write and
    undo that.
  */
  const step = useBookingStore((s) => s.step);
  const service = useBookingStore((s) => s.service);
  const barber = useBookingStore((s) => s.barber);
  const name = useBookingStore((s) => s.name);
  const address = useBookingStore((s) => s.address);
  const phone = useBookingStore((s) => s.phone);
  const description = useBookingStore((s) => s.description);
  const file = useBookingStore((s) => s.file);
  const fileError = useBookingStore((s) => s.fileError);
  const status = useBookingStore((s) => s.status);
  const errorMessage = useBookingStore((s) => s.errorMessage);
  const reference = useBookingStore((s) => s.reference);

  // Actions never change identity, so one grouped select is fine -- `useShallow`
  // is what stops the fresh object literal from re-rendering on every write.
  const {
    setStep,
    setService,
    setBarber,
    setField,
    setFile,
    setFileError,
    setStatus,
    setErrorMessage,
    setReference,
  } = useBookingStore(
    useShallow((s) => ({
      setStep: s.setStep,
      setService: s.setService,
      setBarber: s.setBarber,
      setField: s.setField,
      setFile: s.setFile,
      setFileError: s.setFileError,
      setStatus: s.setStatus,
      setErrorMessage: s.setErrorMessage,
      setReference: s.setReference,
    }))
  );
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Prefill the name once, and only into an untouched field, so it never
  // overwrites something the customer has already typed.
  const prefilled = useRef(false);
  const accountName = auth?.fullName ?? "";
  // Displayed only. Never posted — the API takes the email from the verified
  // token, and `email` is read-only on the serializer, so a value sent from
  // here would be discarded anyway.
  const accountEmail = auth?.email ?? "";
  /*
    A store is a module singleton, so it outlives this component in a way
    `useState` did not. Without this, walking away from a finished booking and
    returning to /services would show the success screen again instead of an
    empty form -- and a half-filled form would come back holding a service that
    may have been unpublished in the admin since.

    Cleared on unmount rather than on mount so that a remount for any other
    reason cannot wipe a booking in progress.
  */
  useEffect(() => {
    return () => {
      useBookingStore.getState().reset();
    };
  }, []);

  useEffect(() => {
    if (!accountName || prefilled.current) return;
    // Read through `getState()` rather than the subscribed `name` above, so
    // this effect does not need `name` as a dependency and cannot re-run on
    // every keystroke. The `prefilled` ref still guarantees it happens once.
    if (!useBookingStore.getState().name) setField("name", accountName);
    prefilled.current = true;
  }, [accountName, setField]);

  // All wording comes from `bookings.BookingSection` in the admin. The order
  // of the four steps is structural and stays in code.
  const copy = config.copy;
  const steps = [copy.serviceStep, copy.barberStep, copy.detailsStep, copy.paymentStep];
  const headings = [
    copy.serviceHeading,
    copy.barberHeading,
    copy.detailsHeading,
    copy.paymentHeading,
  ];

  // Nothing to book with. Better to say so than to render a form whose submit
  // could only ever fail.
  if (config.services.length === 0 && config.barbers.length === 0) {
    return (
      <div className="border-border rounded-xl border p-8 text-center">
        <p className="text-lg font-semibold">
          Online booking is unavailable right now.
        </p>
        <p className="text-muted-foreground mt-2">
          Please call us and we will book you in by phone.
        </p>
      </div>
    );
  }

  const go = (next: number) => {
    setStep(next);
    // The step bar is above the fold but the form is long; move focus so a
    // keyboard or screen-reader user lands on the new step, not back at the top.
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  const pickFile = (chosen: File | null) => {
    if (chosen && chosen.size > MAX_UPLOAD_BYTES) {
      setFile(null);
      setFileError("That image is over 5MB — please upload a smaller one.");
      return;
    }
    setFileError("");
    setFile(chosen);
  };

  const submit = async () => {
    setStatus("sending");
    setErrorMessage("");

    const body = new FormData();
    body.append("name", name.trim());
    body.append("address", address.trim());
    body.append("phone", phone.trim());
    body.append("notes", description.trim());
    // No email. It comes from the verified Clerk token server-side, which is
    // the only source that cannot be edited by whoever is posting.
    // No date or time is sent. The salon sets the visit time in the admin and
    // the customer is told it on approval — see the Handling section there.
    if (service) body.append("service", String(service.id));
    if (barber) body.append("barber", String(barber.id));
    if (file) body.append("paymentScreenshot", file);

    try {
      /*
        Sent as a bearer token rather than a cookie: the API is on a different
        origin (Django on 8001), so a session cookie would not be attached.
        A missing token is not an error — the booking is simply recorded
        without an account, which is what happens before Clerk is configured.
      */
      const headers: HeadersInit = {};
      if (auth) {
        const token = await auth.getToken().catch(() => null);
        if (token) headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        body,
        headers,
      });
      if (!response.ok) {
        // Surfaces the specific field message when there is one, so a
        // validation problem is actionable rather than "400 Bad Request".
        throw new Error(await readApiError(response));
      }
      const created = await response.json().catch(() => null);
      setReference(created?.reference ?? "");
      setStatus("sent");
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    }
  };

  if (status === "sent") {
    const amount = depositFor(service, config.esewa.depositPercent);
    /*
      `note` is the bit at the side. The customer does not choose a time — the
      salon sets it when it approves the booking — so the Time row says where
      the time will come from rather than leaving a blank the customer reads
      as something they forgot to fill in.
    */
    type Row = { label: string; value: string; note?: string };
    const rows: Row[] = [
      { label: "Service", value: service?.label ?? "—" },
      { label: "Barber", value: barber?.name ?? "—" },
      { label: "Name", value: name.trim() || "—" },
      { label: "Address", value: address.trim() || "—" },
      { label: "Phone", value: phone.trim() || "—" },
      // Omitted when the account has none — there is nothing to confirm back.
      ...(accountEmail ? [{ label: "Email", value: accountEmail }] : []),
      {
        label: "Time",
        value: "We will set this",
        note: "You get your time when we approve your booking",
      },
      { label: "Description", value: description.trim() || "—" },
      {
        label: "Paid",
        value: amount ? `Rs ${amount.due}` : "To be confirmed",
      },
      { label: "Payment proof", value: file ? file.name : "—" },
    ];

    return (
      <div className="text-center">
        <h2 className="text-[clamp(26px,5vw,40px)] leading-tight font-bold">
          Thank you for your booking
        </h2>

        {/*
          The reference, not the order ID. The order ID only exists once the
          salon has approved the booking — promising one here would be a
          number the customer could not be given yet.
        */}
        {reference ? (
          <p className="text-muted-foreground mt-3 text-sm">
            Your reference
            <span className="text-primary ml-2 font-mono text-base font-bold tracking-wider">
              {reference}
            </span>
          </p>
        ) : null}

        <div className="border-border mt-8 overflow-hidden rounded-xl border text-left">
          <p className="border-border bg-foreground/[0.04] text-muted-foreground border-b px-5 py-3 text-xs font-semibold tracking-wider uppercase">
            What you booked
          </p>
          <dl className="divide-border divide-y">
            {rows.map(({ label, value, note }) => (
              <div
                key={label}
                className="flex items-start justify-between gap-6 px-5 py-3 text-sm"
              >
                <dt className="text-muted-foreground shrink-0">{label}</dt>
                <dd className="text-right wrap-break-word">
                  {value}
                  {note ? (
                    <span className="text-muted-foreground mt-0.5 block text-xs">
                      {note}
                    </span>
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Where the booking is, and what happens next. */}
        <ol className="text-muted-foreground mt-8 grid gap-3 text-left text-sm sm:grid-cols-3">
          <li className="border-primary bg-primary/5 rounded-lg border p-3">
            <span className="text-primary block font-semibold">1. Pending</span>
            We have your request.
          </li>
          <li className="border-border rounded-lg border p-3">
            <span className="text-foreground block font-semibold">
              2. Approved
            </span>
            We check your payment and send you an order ID.
          </li>
          <li className="border-border rounded-lg border p-3">
            <span className="text-foreground block font-semibold">
              3. Completed
            </span>
            After your visit.
          </li>
        </ol>

        {/*
          The one instruction that has to survive the customer skimming this
          screen: they are not booked yet. Pulled out of the paragraph and
          given the primary colour so it reads before the sentence around it.
        */}
        <p className="border-primary/40 bg-primary/5 mt-8 rounded-lg border px-4 py-3 text-sm">
          <span className="text-primary font-semibold">
            Please wait for our confirmation.
          </span>{" "}
          Your seat is not held until we approve your payment and give you a
          time to come in.
        </p>

        <p className="text-muted-foreground mt-4 text-sm">
          Keep your reference — quote it if you need to reach us about this
          booking. Nothing is charged here; your payment is checked by a person.
        </p>
      </div>
    );
  }

  const barberProblem = barberStepProblem(config.barbers);
  const canContinue =
    step === 0
      ? Boolean(service)
      : step === 1
        // Bookable as well as picked: the config is fetched with a revalidate
        // window, so a barber can go unavailable between the page being
        // rendered and the customer choosing them.
        ? Boolean(barber && isBookable(barber))
        : true;
  // Email is deliberately absent: it is the one optional field. Everything
  // else here is required by the API too, so a form that let them through
  // would only produce a 400 two steps later.
  const missingDetails = [
    ["name", name],
    ["address", address],
    ["phone", phone],
    ["description", description],
  ]
    .filter(([, value]) => !value.trim())
    .map(([label]) => label);

  const detailsValid = missingDetails.length === 0;

  return (
    <div>
      <StepBar current={step} steps={steps} />

      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mb-6 text-2xl font-bold outline-none sm:text-3xl"
      >
        {headings[step]}
      </h2>

      {step === 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {config.services.map((item) => (
            <ChoiceCard
              key={item.id}
              selected={service?.id === item.id}
              onClick={() => setService(item)}
            >
              {/* Photo leads the card — picking what to book reads faster off a
                  picture of the result than off a name. Falls back to no image
                  rather than a placeholder, so a service added in the admin
                  without one still renders as a normal card. */}
              {item.image ? (
                <span className="relative block aspect-[4/3] w-full overflow-hidden rounded-lg">
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 200px"
                    className="object-cover"
                  />
                </span>
              ) : null}

              <span className="text-base font-semibold text-white">
                {item.label}
              </span>

              {item.description ? (
                <span className="text-xs leading-relaxed text-muted-foreground">
                  {item.description}
                </span>
              ) : null}

              {/* DRF serialises DecimalField as a string, so "800.00" arrives
                  verbatim; trimmed to whole rupees for the card. */}
              {item.priceFrom ? (
                <span className="text-primary text-sm font-semibold">
                  from Rs {item.priceFrom.replace(/\.00$/, "")}
                </span>
              ) : null}
            </ChoiceCard>
          ))}
        </div>
      ) : null}

      {/*
        Two failures that look the same from here and are not: nobody could be
        loaded, versus everybody is away. Telling a customer the salon has
        stopped taking bookings when the API simply timed out is the worse of
        the two, so they get separate messages.
      */}
      {step === 1 && barberProblem ? (
        <p className="border-destructive/40 bg-destructive/10 mb-5 rounded-lg border px-4 py-3 text-sm">
          {barberProblem === "unloadable"
            ? "We cannot load the team right now. Please refresh the page, or contact us and we will book you in directly."
            : "Nobody is taking bookings at the moment. Please try again later, or contact us and we will arrange something."}
        </p>
      ) : null}

      {step === 1 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {config.barbers.map((item) => (
            <ChoiceCard
              key={item.id}
              selected={barber?.id === item.id}
              disabled={!isBookable(item)}
              onClick={() => setBarber(item)}
            >
              {/* No photo yet is normal — the admin can add one later, and
                  initials keep the card the same shape meanwhile. */}
              {item.photo ? (
                <span className="relative h-24 w-24 overflow-hidden rounded-full sm:h-28 sm:w-28">
                  <Image
                    src={item.photo}
                    alt=""
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                </span>
              ) : (
                <span className="flex h-24 w-24 items-center justify-center rounded-full bg-foreground/10 text-2xl font-bold text-muted-foreground sm:h-28 sm:w-28">
                  {item.initials}
                </span>
              )}
              <span className="text-base font-semibold text-white">
                {item.name}
              </span>
              {item.role ? (
                <span className="text-sm text-muted-foreground">{item.role}</span>
              ) : null}
              {/* Set per barber in the admin; empty until someone fills it in. */}
              {item.schedule ? (
                <span className="text-primary text-xs">{item.schedule}</span>
              ) : null}

              {/*
                Always shown, both ways round. A badge that only appears when
                something is wrong leaves the customer guessing whether the
                other cards are fine or just unlabelled.
              */}
              <span
                className={cn(
                  "mt-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                  isBookable(item)
                    ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                    : "border-destructive/40 bg-destructive/10 text-destructive"
                )}
              >
                {/* Falls back rather than rendering an empty pill when the
                    payload predates the field. */}
                {item.availabilityLabel ||
                  (isBookable(item) ? "Available" : "Not available")}
              </span>
            </ChoiceCard>
          ))}
        </div>
      ) : null}

      {step === 2 ? (
        <div className="grid gap-5 sm:max-w-xl">
          <div className="grid gap-2">
            <Label htmlFor="booking-name">Name <span className="text-primary">*</span></Label>
            <Input
              id="booking-name"
              value={name}
              onChange={(e) => setField("name", e.target.value)}
              required
              autoComplete="name"
              placeholder="Your full name"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="booking-address">
              Address <span className="text-primary">*</span>
            </Label>
            <Input
              id="booking-address"
              value={address}
              onChange={(e) => setField("address", e.target.value)}
              required
              autoComplete="street-address"
              placeholder="Where you are coming from"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="booking-phone">
                Phone <span className="text-primary">*</span>
              </Label>
              <Input
                id="booking-phone"
                type="tel"
                value={phone}
                onChange={(e) => setField("phone", e.target.value)}
                required
                autoComplete="tel"
                inputMode="tel"
                placeholder="98XXXXXXXX"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="booking-email">Email</Label>
              {/*
                Read-only, not disabled: a disabled input cannot be focused or
                copied and is skipped by a screen reader, and this is the one
                field a customer might want to read back to check which account
                they are booking under.
              */}
              <Input
                id="booking-email"
                type="email"
                value={accountEmail}
                readOnly
                tabIndex={-1}
                aria-describedby="booking-email-hint"
                className="text-muted-foreground cursor-default focus-visible:ring-0"
              />
              <p id="booking-email-hint" className="text-muted-foreground text-xs">
                {accountEmail
                  ? "From the account you signed in with."
                  : "Your account has no email address — we will use your phone."}
              </p>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="booking-notes">
              Description <span className="text-primary">*</span>
            </Label>
            <Textarea
              id="booking-notes"
              value={description}
              onChange={(e) => setField("description", e.target.value)}
              required
              rows={4}
              placeholder="Tell us what you would like done"
            />
          </div>

          {missingDetails.length > 0 ? (
            // Names what is actually missing. "Please fill in all fields" makes
            // the customer hunt for it, and the starred labels have already
            // failed them by the time they are reading this.
            <p className="text-muted-foreground text-sm">
              Still needed: {missingDetails.join(", ")}.
            </p>
          ) : null}
        </div>
      ) : null}

      {step === 3 ? (
        <div className="grid gap-8 sm:max-w-xl">
          <div className="border-border rounded-xl border p-5">
            {/* What to send, worked out from the chosen service. */}
            {(() => {
              const amount = depositFor(service, config.esewa.depositPercent);
              if (!amount) {
                return (
                  <p className="text-muted-foreground mb-4 text-center text-sm">
                    We will confirm the amount with you before your visit.
                  </p>
                );
              }
              const partial = config.esewa.depositPercent < 100;
              return (
                <div className="mb-5 text-center">
                  <p className="text-primary text-2xl font-bold">
                    Send Rs {amount.due}
                  </p>
                  {/*
                    Kept only when this is a part payment. At 100% the amount
                    above is the whole story and a "Full amount" caption just
                    repeats it — but when the customer is sending less than the
                    price, not saying so would leave them thinking the booking
                    is settled.
                  */}
                  {partial ? (
                    <p className="text-muted-foreground mt-1 text-sm">
                      {config.esewa.depositPercent}% deposit — Rs{" "}
                      {amount.full - amount.due} due at the salon
                    </p>
                  ) : null}
                </div>
              );
            })()}

            {config.esewa.qr ? (
              <span className="mx-auto block w-fit rounded-lg bg-white p-3">
                <Image
                  src={config.esewa.qr}
                  alt="The salon's eSewa payment QR code"
                  width={220}
                  height={220}
                  className="h-auto w-[220px]"
                />
              </span>
            ) : (
              <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No eSewa QR has been uploaded yet. Ask the salon how to pay, or
                upload one in the admin under Booking form &rarr; Payment.
              </p>
            )}
            {config.esewa.note ? (
              <p className="mt-4 text-center text-sm text-muted-foreground">
                {config.esewa.note}
              </p>
            ) : null}
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-medium">
              Upload your payment screenshot{" "}
              <span className="text-primary">*</span>
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              className="border-input bg-foreground/[0.04] file:bg-primary file:text-primary-foreground hover:border-foreground/40 rounded-lg border px-4 py-3 text-sm transition-colors file:mr-4 file:rounded-md file:border-0 file:px-4 file:py-2 file:text-sm file:font-semibold"
            />
            {fileError ? (
              <span className="text-destructive text-sm">{fileError}</span>
            ) : file ? (
              <span className="text-primary text-sm">
                Attached: {file.name}
              </span>
            ) : (
              <span className="text-muted-foreground text-sm">
                Required — we confirm your seat against this.
              </span>
            )}
          </label>

          <dl className="border-border bg-foreground/[0.03] grid gap-1 rounded-xl border p-5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Service</dt>
              <dd className="capitalize">
                {service?.label ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Barber</dt>
              <dd>{barber?.name ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Name</dt>
              <dd>{name.trim() || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">To pay now</dt>
              <dd className="text-primary font-semibold">
                {(() => {
                  const a = depositFor(service, config.esewa.depositPercent);
                  return a ? `Rs ${a.due}` : "To be confirmed";
                })()}
              </dd>
            </div>
          </dl>

          {status === "error" ? (
            <p className="border-destructive/40 bg-destructive/10 text-destructive rounded-lg border p-4 text-sm">
              {errorMessage || "Could not send your booking."} Please try again.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-10 flex flex-wrap items-center gap-4">
        {step > 0 ? (
          <Button type="button" variant="outline" size="lg" onClick={() => go(step - 1)}>
            Back
          </Button>
        ) : null}

        {step < steps.length - 1 ? (
          <Button
            type="button"
            size="lg"
            disabled={!canContinue || (step === 2 && !detailsValid)}
            onClick={() => go(step + 1)}
          >
            Continue
          </Button>
        ) : (
          <Button
            type="button"
            size="lg"
            // The screenshot is what the salon checks before confirming, so a
            // booking without one cannot be submitted. The backend enforces
            // the same rule, so this is a courtesy rather than the guard.
            disabled={status === "sending" || !detailsValid || !file}
            onClick={submit}
          >
            {status === "sending" ? "Sending…" : copy.submitLabel}
          </Button>
        )}
      </div>

      {step === steps.length - 1 && !file ? (
        <p className="text-muted-foreground mt-4 text-sm">
          Attach your payment screenshot above to submit.
        </p>
      ) : null}
    </div>
  );
}
