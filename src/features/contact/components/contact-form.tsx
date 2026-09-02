"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

import { readApiError } from "@/lib/api/api-error";
import { useAuthConfigured } from "@/features/auth/components/auth-provider";
import { authHeader } from "@/lib/api/session-token";
import { SIGN_IN_PATH } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * The message form, ported from the devis-gym demo's contact page.
 *
 * Geometry and styling are the demo's: square fields (`rounded-none`) on the
 * elevated surface, a zinc hairline that turns accent on focus, uppercase
 * labels in the display face, and a square accent button with an arrow.
 *
 * One thing is not the demo's. Its handler does
 * `console.log(formData); alert("Thank you...")` — it never sends anything, so
 * every message written into it was lost. This posts to the backend's existing
 * `/api/v1/contact-messages/` endpoint, which stores it against
 * `bookings.ContactMessage` for the admin to read.
 */

/** What the form needs from the session, so the fields never import it. */
type AuthBits = {
  fullName: string;
  email: string;
} | null;

/**
 * Shown to a signed-out visitor in place of the fields.
 *
 * Only the *form* is behind an account, never the page: the address, opening
 * hours, phone number and map above it are how a customer finds the salon, and
 * putting those behind a sign-in would hide them from people looking for the
 * shop -- and from search engines. This is about who can send a message, not
 * who can read the contact details.
 */
function SignInToMessage() {
  return (
    <div className="border border-zinc-700 bg-background-elevated p-8 text-center">
      <p className="font-display text-2xl font-bold tracking-tight text-white uppercase">
        Sign in to send a message
      </p>
      <p className="text-muted mt-3">
        So we can reply to you and keep your enquiry with your account. Our
        phone number and email are on this page — no account needed for those.
      </p>
      <Link
        href={`${SIGN_IN_PATH}?redirect_url=/contact`}
        className="bg-accent mt-6 inline-block rounded-none px-8 py-3 text-sm font-bold text-black uppercase tracking-wide"
      >
        Sign in
      </Link>
    </div>
  );
}

/**
 * Reads the session and decides whether the fields are shown.
 *
 * Split from the fields below for the same reason `BookingFlow` is: the hook
 * lives here, so the form itself takes plain values and knows nothing of auth.
 */
function ContactFormWithAuth({ endpoint }: { endpoint: string }) {
  const { data: session, status } = useSession();

  // The session resolves after hydration. Showing the sign-in prompt during
  // that moment would flash it at someone who is in fact signed in.
  if (status === "loading") {
    return (
      <div className="space-y-6" aria-hidden>
        <Skeleton className="h-12 w-full rounded-none" />
        <Skeleton className="h-12 w-full rounded-none" />
        <Skeleton className="h-32 w-full rounded-none" />
      </div>
    );
  }

  if (status !== "authenticated") return <SignInToMessage />;

  return (
    <ContactFormFields
      endpoint={endpoint}
      auth={{
        fullName: session.user?.name ?? "",
        email: session.user?.email ?? "",
      }}
    />
  );
}

export function ContactForm({ endpoint }: { endpoint: string }) {
  /*
    With sign-in unconfigured the site still has to work: gating the form on an
    auth system that is not set up would silently lose every enquiry. Same
    guard as the booking flow.
  */
  const configured = useAuthConfigured();
  return configured ? (
    <ContactFormWithAuth endpoint={endpoint} />
  ) : (
    <ContactFormFields endpoint={endpoint} auth={null} />
  );
}

function ContactFormFields({
  endpoint,
  auth,
}: {
  endpoint: string;
  auth: AuthBits;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [error, setError] = useState("");

  /*
    Fill the name and email from the account once, and only into fields the
    visitor has not touched -- so it never overwrites something they typed.
    Both stay editable: this address is where a reply should go, which is not
    necessarily the one they signed up with.
  */
  const prefilled = useRef(false);
  const accountName = auth?.fullName ?? "";
  const accountEmail = auth?.email ?? "";
  useEffect(() => {
    if (prefilled.current || (!accountName && !accountEmail)) return;
    prefilled.current = true;
    setForm((current) => ({
      ...current,
      name: current.name || accountName,
      email: current.email || accountEmail,
    }));
  }, [accountName, accountEmail]);

  const field =
    "w-full rounded-none border border-zinc-700 bg-background-elevated px-4 py-3 text-white transition-colors outline-none focus:border-accent placeholder:text-white/25";
  const label =
    "font-display mb-2 block text-sm font-bold tracking-wide text-white uppercase";

  const change = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm({ ...form, [event.target.name]: event.target.value });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setState("sending");
    setError("");

    try {
      /*
        The token identifies the sender to the backend, which stamps the
        message with the verified Google id -- the body is never trusted for
        that. Empty when signed out or unconfigured, and the endpoint still
        accepts the message in that case rather than losing a real enquiry.
      */
      const headers = auth ? await authHeader() : {};

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          // The model has no phone column, so it rides along in the subject
          // rather than being dropped on the floor.
          subject: form.phone.trim() ? `Phone: ${form.phone.trim()}` : "Website enquiry",
          message: form.message.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      setState("sent");
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (caught) {
      setState("error");
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    }
  };

  if (state === "sent") {
    return (
      <div className="border border-accent/40 bg-accent/5 p-8 text-center">
        <p className="font-display text-2xl font-bold tracking-tight text-white uppercase">
          Message sent
        </p>
        <p className="text-muted mt-3">
          Thank you — we have it, and we will get back to you shortly.
        </p>
        <button
          type="button"
          onClick={() => setState("idle")}
          className="text-accent mt-6 text-sm font-semibold underline-offset-4 hover:underline"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <label htmlFor="contact-name" className={label}>
          Your Name *
        </label>
        <input
          type="text"
          id="contact-name"
          name="name"
          value={form.name}
          onChange={change}
          required
          autoComplete="name"
          className={field}
          placeholder="Sita Sharma"
        />
      </div>

      <div>
        <label htmlFor="contact-email" className={label}>
          Email Address *
        </label>
        <input
          type="email"
          id="contact-email"
          name="email"
          value={form.email}
          onChange={change}
          required
          autoComplete="email"
          className={field}
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="contact-phone" className={label}>
          Phone Number
        </label>
        <input
          type="tel"
          id="contact-phone"
          name="phone"
          value={form.phone}
          onChange={change}
          autoComplete="tel"
          className={field}
          placeholder="+977 98-1234567"
        />
      </div>

      <div>
        <label htmlFor="contact-message" className={label}>
          Your Message *
        </label>
        <textarea
          id="contact-message"
          name="message"
          value={form.message}
          onChange={change}
          required
          rows={6}
          className={`${field} resize-none`}
          placeholder="Tell us how we can help…"
        />
      </div>

      {state === "error" ? (
        <p className="border border-red-400/40 bg-red-400/10 p-4 text-sm text-red-200">
          {error || "Could not send your message."} Please try again.
        </p>
      ) : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={state === "sending"}
          className="bg-accent inline-flex items-center gap-2.5 rounded-none px-8 py-4 text-sm font-semibold tracking-[0.08em] text-black uppercase transition-all duration-300 ease-out hover:opacity-90 focus-visible:outline-offset-4 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span>{state === "sending" ? "Sending…" : "Send Message"}</span>
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
        </button>
      </div>
    </form>
  );
}
