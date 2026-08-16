"use client";

import { useState } from "react";

import { readApiError } from "@/lib/api/api-error";

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

export function ContactForm({ endpoint }: { endpoint: string }) {
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
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
