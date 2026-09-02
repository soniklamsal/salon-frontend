"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollHint } from "@/components/shared/scroll-hint";
import { Skeleton } from "@/components/ui/skeleton";
import { CLERK_ENABLED } from "@/lib/auth";
import { cn } from "@/lib/utils";

/**
 * "Your status" — the signed-in customer's own bookings.
 *
 * Fetched in the browser rather than on the server, because the list is per
 * person: rendering it server-side would make the home page uncacheable for
 * everyone, to show a band most visitors never see.
 *
 * The request carries the Clerk session token and the API filters on the `sub`
 * claim it verifies, so this component never sends an id and never chooses
 * whose bookings to ask for.
 *
 * Lives on /status rather than the home page. It used to be a band there, but
 * a private list made the home page's content depend on who was reading it,
 * and buried a customer's order ID several screens into a marketing page.
 *
 * Because it now owns a page rather than sharing one, "nothing to show" has to
 * say so — a blank page would read as broken, where a missing band on the home
 * page read as nothing at all.
 */

type Booking = {
  id: number;
  reference: string;
  orderId: string | null;
  status: "pending" | "approved" | "completed" | "cancelled";
  statusLabel: string;
  service: string;
  barber: string;
  name: string;
  address: string;
  notes: string;
  paymentScreenshot: string;
  /**
   * The customer's selected time slot (their preferred date/time)
   */
  selectedTimeSlot: {
    date: string | null;
    timeLabel: string | null;
    startTime: string | null;
    endTime: string | null;
  } | null;
  /**
   * When the salon has told them to come in. The customer never picks a time;
   * this is set in the admin and appears here once the booking is approved.
   */
  scheduledDate: string | null;
  scheduledTime: string | null;
  approvedAt: string | null;
  completedAt: string | null;
  createdAt: string;
};

const STATUS_STYLES: Record<Booking["status"], string> = {
  pending: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  approved: "border-primary/50 bg-primary/10 text-primary",
  completed: "border-sky-400/40 bg-sky-400/10 text-sky-300",
  cancelled: "border-destructive/40 bg-destructive/10 text-destructive",
};

function when(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Date plus time, for the modal where there is room for the full record. */
function exactly(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** "2:30 pm" from Django's `"14:30:00"`, which is not something to show a customer. */
function clock(value: string | null) {
  if (!value) return null;
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return value;
  const at = new Date();
  at.setHours(h, m, 0, 0);
  return at.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/** "16 Aug 2026, 2:30 pm" — either half may be missing. */
function slot(date: string | null, time: string | null) {
  return [when(date), clock(time)].filter(Boolean).join(", ");
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-6 py-2.5 text-sm">
      <dt className="text-muted-foreground shrink-0">{label}</dt>
      <dd className="text-right font-medium break-words text-white">{value}</dd>
    </div>
  );
}

/** The full record, in a modal: everything the customer filled in. */
function BookingDialog({
  booking,
  onOpenChange,
}: {
  booking: Booking | null;
  onOpenChange: (open: boolean) => void;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);

  return (
    <Dialog open={booking !== null} onOpenChange={onOpenChange}>
      {/*
        The panel itself does not scroll — it stays put and its body does, so
        the heading and the close button remain reachable however long the
        record is. `p-0` moves the padding onto the scrolling child, otherwise
        the last row scrolls under a padded edge.
      */}
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        {booking ? (
          <div className="relative flex min-h-0 flex-1 flex-col">
            <div
              ref={bodyRef}
              /*
                Lenis listens for wheel events on the window and calls
                preventDefault on them — including while stopped — so with the
                page frozen behind the dialog, nothing inside it scrolled
                either. This attribute tells Lenis to ignore the subtree and
                let the browser scroll it natively.
              */
              data-lenis-prevent
              /*
                `min-h-0` is load-bearing: a flex child's default minimum size
                is its content, so without it this box refuses to shrink below
                the record's full height and the panel clips instead of
                scrolling.
              */
              className="salon-scroll grid min-h-0 flex-1 gap-4 overflow-y-auto p-6"
            >
              <DialogHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <DialogTitle className="flex flex-wrap items-center gap-3 text-left">
                      {booking.service || "Booking"}
                      <span
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-semibold",
                          STATUS_STYLES[booking.status]
                        )}
                      >
                        {booking.statusLabel}
                      </span>
                    </DialogTitle>
                    <DialogDescription className="text-left">
                      {booking.barber ? `With ${booking.barber}. ` : ""}
                      Requested {exactly(booking.createdAt)}.
                    </DialogDescription>
                  </div>

                  {/* Download and Print buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Download button - auto-triggers print dialog for PDF */}
                    <button
                      type="button"
                      onClick={() => {
                        const printWindow = window.open("", "_blank");
                        if (!printWindow) return;

                        printWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                          <title>Booking Slip - ${booking.reference}</title>
                          <style>
                            * { margin: 0; padding: 0; box-sizing: border-box; }
                            body { font-family: -apple-system, system-ui, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
                            .header { text-align: center; border-bottom: 3px solid #c7ff3d; padding-bottom: 20px; margin-bottom: 30px; }
                            .header h1 { font-size: 28px; color: #0a0a0a; margin-bottom: 5px; }
                            .header p { color: #666; font-size: 14px; }
                            .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; margin: 20px 0; ${booking.status === 'pending' ? 'background: #fef3c7; color: #92400e; border: 1px solid #fde68a;' :
                            booking.status === 'approved' ? 'background: #d4ff00; color: #0a0a0a; border: 1px solid #c7ff3d;' :
                              booking.status === 'completed' ? 'background: #dbeafe; color: #1e40af; border: 1px solid #93c5fd;' :
                                'background: #fee2e2; color: #991b1b; border: 1px solid #fecaca;'
                          } }
                            .code-box { background: #f9fafb; border: 2px dashed #d1d5db; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
                            .code-box label { display: block; font-size: 11px; text-transform: uppercase; color: #6b7280; letter-spacing: 1px; margin-bottom: 8px; }
                            .code-box .code { font-family: 'Courier New', monospace; font-size: 24px; font-weight: 700; color: ${booking.orderId ? '#000' : '#0a0a0a'}; letter-spacing: 2px; }
                            .schedule-box { background: #d4ff00; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0; }
                            .schedule-box label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; display: block; color: #0a0a0a; }
                            .schedule-box .time { font-size: 20px; font-weight: 700; color: #0a0a0a; }
                            .details { margin: 30px 0; }
                            .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
                            .detail-row:last-child { border-bottom: none; }
                            .detail-row .label { color: #6b7280; font-size: 14px; }
                            .detail-row .value { font-weight: 600; color: #0a0a0a; text-align: right; word-wrap: break-word; max-width: 400px; }
                            .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px; }
                            @media print {
                              body { padding: 20px; }
                            }
                          </style>
                          <script>
                            window.onload = function() {
                              window.print();
                            };
                          </script>
                        </head>
                        <body>
                          <div class="header">
                            <h1>SALON BOOKING SLIP</h1>
                            <p>Your appointment confirmation</p>
                          </div>
                          
                          <div style="text-align: center;">
                            <span class="status-badge">${booking.statusLabel}</span>
                          </div>
                          
                          <div class="code-box">
                            <label>${booking.orderId ? 'Order ID — Show this at the salon' : 'Reference Number'}</label>
                            <div class="code">${booking.orderId ?? booking.reference}</div>
                            ${!booking.orderId ? '<p style="color: #6b7280; font-size: 12px; margin-top: 10px;">An order ID will be assigned once payment is verified</p>' : ''}
                          </div>
                          
                          ${booking.scheduledDate || booking.scheduledTime ? `
                            <div class="schedule-box">
                              <label>Your Appointment Time</label>
                              <div class="time">${slot(booking.scheduledDate, booking.scheduledTime) || 'To be confirmed'}</div>
                            </div>
                          ` : ''}
                          
                          <div class="details">
                            <div class="detail-row">
                              <span class="label">Service</span>
                              <span class="value">${booking.service || '—'}</span>
                            </div>
                            <div class="detail-row">
                              <span class="label">Barber</span>
                              <span class="value">${booking.barber || '—'}</span>
                            </div>
                            <div class="detail-row">
                              <span class="label">Customer Name</span>
                              <span class="value">${booking.name || '—'}</span>
                            </div>
                            <div class="detail-row">
                              <span class="label">Address</span>
                              <span class="value">${booking.address || '—'}</span>
                            </div>
                            ${booking.notes ? `
                              <div class="detail-row">
                                <span class="label">Notes</span>
                                <span class="value">${booking.notes}</span>
                              </div>
                            ` : ''}
                            <div class="detail-row">
                              <span class="label">Booking Date</span>
                              <span class="value">${exactly(booking.createdAt) ?? '—'}</span>
                            </div>
                            ${booking.approvedAt ? `
                              <div class="detail-row">
                                <span class="label">Approved On</span>
                                <span class="value">${exactly(booking.approvedAt) ?? '—'}</span>
                              </div>
                            ` : ''}
                          </div>
                          
                          <div class="footer">
                            <p>Thank you for choosing our salon!</p>
                            ${booking.status === 'pending' ? `
                              <p style="margin-top: 5px;">Your booking is being reviewed. We will verify your payment and contact you soon.</p>
                            ` : booking.status === 'approved' ? `
                              <p style="margin-top: 5px;">Your booking is confirmed! Please bring your Order ID when you visit at the scheduled time.</p>
                            ` : booking.status === 'completed' ? `
                              <p style="margin-top: 5px;">This service has been completed. Thank you for visiting our salon!</p>
                            ` : `
                              <p style="margin-top: 5px;">Please contact us for any questions about your booking.</p>
                            `}
                          </div>
                        </body>
                        </html>
                      `);
                        printWindow.document.close();
                      }}
                      title="Download booking slip"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                        aria-hidden="true"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" x2="12" y1="15" y2="3" />
                      </svg>
                      <span className="sr-only">Download booking slip as PDF</span>
                    </button>

                    {/* Print button - opens with manual print button */}
                    <button
                      type="button"
                      onClick={() => {
                        const printWindow = window.open("", "_blank");
                        if (!printWindow) return;

                        printWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                          <title>Booking Slip - ${booking.reference}</title>
                          <style>
                            * { margin: 0; padding: 0; box-sizing: border-box; }
                            body { font-family: -apple-system, system-ui, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
                            .header { text-align: center; border-bottom: 3px solid #c7ff3d; padding-bottom: 20px; margin-bottom: 30px; }
                            .header h1 { font-size: 28px; color: #0a0a0a; margin-bottom: 5px; }
                            .header p { color: #666; font-size: 14px; }
                            .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; margin: 20px 0; ${booking.status === 'pending' ? 'background: #fef3c7; color: #92400e; border: 1px solid #fde68a;' :
                            booking.status === 'approved' ? 'background: #d4ff00; color: #0a0a0a; border: 1px solid #c7ff3d;' :
                              booking.status === 'completed' ? 'background: #dbeafe; color: #1e40af; border: 1px solid #93c5fd;' :
                                'background: #fee2e2; color: #991b1b; border: 1px solid #fecaca;'
                          } }
                            .code-box { background: #f9fafb; border: 2px dashed #d1d5db; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
                            .code-box label { display: block; font-size: 11px; text-transform: uppercase; color: #6b7280; letter-spacing: 1px; margin-bottom: 8px; }
                            .code-box .code { font-family: 'Courier New', monospace; font-size: 24px; font-weight: 700; color: ${booking.orderId ? '#000' : '#0a0a0a'}; letter-spacing: 2px; }
                            .schedule-box { background: #d4ff00; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0; }
                            .schedule-box label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; display: block; color: #0a0a0a; }
                            .schedule-box .time { font-size: 20px; font-weight: 700; color: #0a0a0a; }
                            .details { margin: 30px 0; }
                            .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
                            .detail-row:last-child { border-bottom: none; }
                            .detail-row .label { color: #6b7280; font-size: 14px; }
                            .detail-row .value { font-weight: 600; color: #0a0a0a; text-align: right; word-wrap: break-word; max-width: 400px; }
                            .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px; }
                            .print-btn { background: #c7ff3d; color: #0a0a0a; border: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; cursor: pointer; margin: 20px auto; display: block; font-size: 14px; }
                            .print-btn:hover { opacity: 0.9; }
                            @media print {
                              body { padding: 20px; }
                              .print-btn { display: none; }
                            }
                          </style>
                        </head>
                        <body>
                          <div class="header">
                            <h1>SALON BOOKING SLIP</h1>
                            <p>Your appointment confirmation</p>
                          </div>
                          
                          <div style="text-align: center;">
                            <span class="status-badge">${booking.statusLabel}</span>
                          </div>
                          
                          <div class="code-box">
                            <label>${booking.orderId ? 'Order ID — Show this at the salon' : 'Reference Number'}</label>
                            <div class="code">${booking.orderId ?? booking.reference}</div>
                            ${!booking.orderId ? '<p style="color: #6b7280; font-size: 12px; margin-top: 10px;">An order ID will be assigned once payment is verified</p>' : ''}
                          </div>
                          
                          ${booking.scheduledDate || booking.scheduledTime ? `
                            <div class="schedule-box">
                              <label>Your Appointment Time</label>
                              <div class="time">${slot(booking.scheduledDate, booking.scheduledTime) || 'To be confirmed'}</div>
                            </div>
                          ` : ''}
                          
                          <div class="details">
                            <div class="detail-row">
                              <span class="label">Service</span>
                              <span class="value">${booking.service || '—'}</span>
                            </div>
                            <div class="detail-row">
                              <span class="label">Barber</span>
                              <span class="value">${booking.barber || '—'}</span>
                            </div>
                            <div class="detail-row">
                              <span class="label">Customer Name</span>
                              <span class="value">${booking.name || '—'}</span>
                            </div>
                            <div class="detail-row">
                              <span class="label">Address</span>
                              <span class="value">${booking.address || '—'}</span>
                            </div>
                            ${booking.notes ? `
                              <div class="detail-row">
                                <span class="label">Notes</span>
                                <span class="value">${booking.notes}</span>
                              </div>
                            ` : ''}
                            <div class="detail-row">
                              <span class="label">Booking Date</span>
                              <span class="value">${exactly(booking.createdAt) ?? '—'}</span>
                            </div>
                            ${booking.approvedAt ? `
                              <div class="detail-row">
                                <span class="label">Approved On</span>
                                <span class="value">${exactly(booking.approvedAt) ?? '—'}</span>
                              </div>
                            ` : ''}
                          </div>
                          
                          <button class="print-btn" onclick="window.print()">Print This Slip</button>
                          
                          <div class="footer">
                            <p>Thank you for choosing our salon!</p>
                            ${booking.status === 'pending' ? `
                              <p style="margin-top: 5px;">Your booking is being reviewed. We will verify your payment and contact you soon.</p>
                            ` : booking.status === 'approved' ? `
                              <p style="margin-top: 5px;">Your booking is confirmed! Please bring your Order ID when you visit at the scheduled time.</p>
                            ` : booking.status === 'completed' ? `
                              <p style="margin-top: 5px;">This service has been completed. Thank you for visiting our salon!</p>
                            ` : `
                              <p style="margin-top: 5px;">Please contact us for any questions about your booking.</p>
                            `}
                          </div>
                        </body>
                        </html>
                      `);
                        printWindow.document.close();
                      }}
                      title="Print booking slip"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                        aria-hidden="true"
                      >
                        <polyline points="6 9 6 2 18 2 18 9" />
                        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                        <rect width="12" height="8" x="6" y="14" />
                      </svg>
                      <span className="sr-only">Print booking slip</span>
                    </button>
                  </div>
                </div>
              </DialogHeader>

              {/* The code to quote — whichever one exists yet. */}
              <div className="border-border rounded-lg border border-dashed p-4 text-center">
                <p className="text-muted-foreground text-xs tracking-wider uppercase">
                  {booking.orderId
                    ? "Order ID — show this at the salon"
                    : "Reference"}
                </p>
                <p
                  className={cn(
                    "mt-1 font-mono text-xl font-bold tracking-wider",
                    booking.orderId && "text-primary"
                  )}
                >
                  {booking.orderId ?? booking.reference}
                </p>
                {!booking.orderId ? (
                  <p className="text-muted-foreground mt-2 text-xs">
                    An order ID appears here once we have checked your payment.
                  </p>
                ) : null}
              </div>

              {/*
              The other half of what an approved customer needs: the code to
              quote and the time to be there. Sits next to the order ID rather
              than down in the details list, because "when do I come" is the
              question this page exists to answer — and the customer has no
              other source for it.
              
              Shows either:
              1. Scheduled date/time (admin set) - highest priority
              2. Selected time slot (customer chose) - if no scheduled time yet
              3. "To be confirmed" message
            */}
              {booking.orderId || booking.selectedTimeSlot ? (
                <div className="border-primary/40 bg-primary/5 rounded-lg border px-4 py-3 text-center">
                  <p className="text-muted-foreground text-xs tracking-wider uppercase">
                    {booking.scheduledDate || booking.scheduledTime ? "Come in at" : "Your selected time"}
                  </p>
                  <p className="text-primary mt-1 text-lg font-bold">
                    {booking.scheduledDate || booking.scheduledTime
                      ? slot(booking.scheduledDate, booking.scheduledTime)
                      : booking.selectedTimeSlot?.timeLabel
                        ? `${when(booking.selectedTimeSlot.date)}, ${booking.selectedTimeSlot.timeLabel}`
                        : "A time we will agree with you"}
                  </p>
                  {!booking.scheduledDate && !booking.scheduledTime ? (
                    <p className="text-muted-foreground mt-1 text-xs">
                      {booking.selectedTimeSlot?.timeLabel
                        ? "We will confirm this time after reviewing your payment."
                        : "We will call you to arrange it."}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {/* Where the request has got to. Stages reached are filled in. */}
              <ol className="grid grid-cols-3 gap-2 text-center text-[11px]">
                {(
                  [
                    ["Pending", true],
                    ["Approved", Boolean(booking.approvedAt)],
                    ["Completed", Boolean(booking.completedAt)],
                  ] as [string, boolean][]
                ).map(([label, reached]) => (
                  <li
                    key={label}
                    className={cn(
                      "rounded-md border px-2 py-2 font-semibold",
                      reached
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    {label}
                  </li>
                ))}
              </ol>

              <dl className="divide-border divide-y">
                <Row label="Reference" value={booking.reference} />
                {booking.orderId ? (
                  <Row label="Order ID" value={booking.orderId} />
                ) : null}
                <Row label="Service" value={booking.service || "—"} />
                <Row label="Barber" value={booking.barber || "—"} />
                <Row label="Name" value={booking.name || "—"} />
                <Row label="Address" value={booking.address || "—"} />
                <Row label="Notes" value={booking.notes || "—"} />
                <Row
                  label="Time to come"
                  value={
                    // Priority: 1. Admin scheduled time, 2. Customer selected slot, 3. Not set
                    booking.scheduledDate || booking.scheduledTime
                      ? slot(booking.scheduledDate, booking.scheduledTime) || "—"
                      : booking.selectedTimeSlot?.timeLabel
                        ? `${when(booking.selectedTimeSlot.date)}, ${booking.selectedTimeSlot.timeLabel} (pending confirmation)`
                        : "Not set yet"
                  }
                />
                <Row label="Requested" value={exactly(booking.createdAt) ?? "—"} />
                {booking.approvedAt ? (
                  <Row
                    label="Approved"
                    value={exactly(booking.approvedAt) ?? "—"}
                  />
                ) : null}
                {booking.completedAt ? (
                  <Row
                    label="Completed"
                    value={exactly(booking.completedAt) ?? "—"}
                  />
                ) : null}
              </dl>

              {/* Their own upload, shown back so they can see what we received. */}
              <div>
                <p className="text-muted-foreground mb-2 text-xs tracking-wider uppercase">
                  Payment proof you sent
                </p>
                {booking.paymentScreenshot ? (
                  <a
                    href={booking.paymentScreenshot}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border-border block overflow-hidden rounded-lg border"
                  >
                    <Image
                      src={booking.paymentScreenshot}
                      alt="The payment screenshot you uploaded"
                      width={480}
                      height={320}
                      className="h-auto w-full object-contain"
                    />
                  </a>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Nothing was uploaded with this booking.
                  </p>
                )}
              </div>
            </div>

            {/* Nudges only while there is more below; GSAP-animated. */}
            <ScrollHint targetRef={bodyRef} />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

const COLUMNS = ["Code", "Service", "Barber", "Status", "Booked", "Details"];

/**
 * The table's own header, shared by the loading and loaded states.
 *
 * Shared rather than duplicated so the skeleton cannot drift out of step with
 * the real table — the point of a skeleton is that nothing moves when the data
 * lands, and two copies of the same markup stop being identical the first time
 * one of them is edited.
 */
function BookingsHead() {
  return (
    <TableHeader>
      <TableRow className="hover:bg-transparent">
        {COLUMNS.map((column) => (
          <TableHead
            key={column}
            className={cn("px-5 py-4", column === "Details" && "text-right")}
          >
            {column}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}

/** Placeholder rows, sized like the real ones so the layout does not jump. */
function BookingsSkeleton({ rows = 3 }: { rows?: number }) {
  // Varied widths: a column of identical bars reads as a graphic, not as text
  // arriving.
  const widths = ["w-28", "w-24", "w-32", "w-20", "w-24", "w-12"];
  return (
    <div className="border-border text-foreground mt-10 overflow-x-auto rounded-xl border">
      <Table>
        <BookingsHead />
        <TableBody>
          {Array.from({ length: rows }).map((_, row) => (
            <TableRow key={row} className="hover:bg-transparent">
              {widths.map((width, cell) => (
                <TableCell key={cell} className="px-5 py-4">
                  <Skeleton
                    className={cn(
                      "h-4",
                      width,
                      cell === COLUMNS.length - 1 && "ml-auto"
                    )}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="text-muted-foreground border-border border-t px-5 py-3 text-sm">
        Loading your bookings…
      </p>
    </div>
  );
}

/**
 * Loaded, empty and failed are three different answers, and this page has to
 * tell them apart.
 *
 * When this list was a band on the home page, a failed fetch rendered as the
 * empty state on the grounds that a band which cannot load is a band that does
 * not appear. That reasoning went with the band. On its own page, "No bookings
 * yet" is a factual claim about the customer's account — and telling someone
 * who has bookings that they have none, because the API happened to be down,
 * is worse than admitting the failure.
 */
type LoadState =
  | { status: "loading" }
  | { status: "ready"; bookings: Booking[] }
  | { status: "error" };

function BookingsList({ endpoint }: { endpoint: string }) {
  const { getToken, isLoaded } = useAuth();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [open, setOpen] = useState<Booking | null>(null);

  // Bumped by "Try again". The fetch lives inside the effect rather than in a
  // `useCallback` the button could call directly, so there is exactly one place
  // that loads bookings and it is the one React can clean up. Retrying is
  // therefore a state change that re-runs the effect, not a second entry point.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!isLoaded) return;

    // Set when the effect is torn down — an unmount, or a retry superseding
    // this run. Without it a slow response could resolve after the component
    // has gone and set state on nothing, or an abandoned attempt could
    // overwrite a newer one.
    let cancelled = false;

    void (async () => {
      // `getToken()` resolves to null when there is no session, so it answers
      // the signed-out case too. Either way it is "no bookings to show", not a
      // failure worth reporting.
      const token = await getToken().catch(() => null);
      if (cancelled) return;

      if (!token) {
        setState({ status: "ready", bookings: [] });
        return;
      }

      try {
        // Add cache-busting timestamp to force fresh data
        const cacheBuster = `?_t=${Date.now()}`;
        const response = await fetch(endpoint + cacheBuster, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!response.ok) throw new Error(String(response.status));
        const payload = await response.json();

        // Debug log to help verify selected time slots are being received
        if (payload.bookings && payload.bookings.length > 0) {
          console.log('[My Bookings] First booking selectedTimeSlot:', payload.bookings[0].selectedTimeSlot);
        }

        if (cancelled) return;
        setState({ status: "ready", bookings: payload.bookings ?? [] });
      } catch {
        if (cancelled) return;
        setState({ status: "error" });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, getToken, endpoint, attempt]);

  // Still loading. A skeleton rather than nothing: the fetch happens in the
  // browser after the page has painted, so an empty space would read as "you
  // have no bookings" to anyone who does.
  if (state.status === "loading") return <BookingsSkeleton />;

  if (state.status === "error") {
    return (
      <div className="border-destructive/40 bg-destructive/5 mt-10 rounded-xl border p-10 text-center">
        <p className="text-lg font-semibold">We could not load your bookings</p>
        <p className="text-muted-foreground mt-2">
          This is a problem on our side, not with your account — your bookings
          are safe. Please try again in a moment.
        </p>
        <button
          type="button"
          onClick={() => {
            setState({ status: "loading" });
            setAttempt((n) => n + 1);
          }}
          className="bg-primary text-primary-foreground mt-6 inline-block rounded-full px-8 py-3 text-sm font-bold transition-opacity hover:opacity-90"
        >
          Try again
        </button>
      </div>
    );
  }

  const bookings = state.bookings;

  if (bookings.length === 0) {
    return (
      <div className="border-border mt-10 rounded-xl border border-dashed p-10 text-center">
        <p className="text-lg font-semibold">No bookings yet</p>
        <p className="text-muted-foreground mt-2">
          Once you book a seat it will appear here, with its status and order
          ID.
        </p>
        <Link
          href="/services"
          className="bg-primary text-primary-foreground mt-6 inline-block rounded-full px-8 py-3 text-sm font-bold transition-opacity hover:opacity-90"
        >
          Book a seat
        </Link>
      </div>
    );
  }

  return (
    <>
      {/*
        The table scrolls inside its own box rather than widening the page —
        six columns will not fit a phone, and a horizontally scrolling document
        breaks every other section on the way past.
      */}
      <div className="border-border text-foreground mt-10 overflow-x-auto rounded-xl border">
        <Table>
          <BookingsHead />
          <TableBody>
            {bookings.map((booking) => (
              <TableRow
                key={booking.id}
                // The whole row opens the modal, but a row is not a control:
                // the button in the last cell is what keyboards and screen
                // readers use, so the behaviour exists either way.
                onClick={() => setOpen(booking)}
                className="cursor-pointer"
              >
                <TableCell className="text-primary px-5 py-4 font-mono font-semibold tracking-wider whitespace-nowrap">
                  {booking.orderId ?? booking.reference}
                </TableCell>
                <TableCell className="text-primary px-5 py-4 font-semibold">
                  {booking.service || "—"}
                </TableCell>
                <TableCell className="px-5 py-4 font-medium text-white">
                  {booking.barber || "—"}
                </TableCell>
                <TableCell className="px-5 py-4">
                  <span
                    className={cn(
                      "inline-block rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap",
                      STATUS_STYLES[booking.status]
                    )}
                  >
                    {booking.statusLabel}
                  </span>
                </TableCell>
                <TableCell className="px-5 py-4 font-medium whitespace-nowrap text-white">
                  {when(booking.createdAt)}
                </TableCell>
                <TableCell className="px-5 py-4 text-right">
                  <button
                    type="button"
                    aria-haspopup="dialog"
                    onClick={(event) => {
                      // The row handler would fire too and open it twice.
                      event.stopPropagation();
                      setOpen(booking);
                    }}
                    className="text-primary focus-visible:ring-ring/60 rounded px-2 py-1 text-sm font-semibold underline-offset-4 outline-none hover:underline focus-visible:ring-2"
                  >
                    View
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <BookingDialog
        booking={open}
        onOpenChange={(isOpen) => !isOpen && setOpen(null)}
      />
    </>
  );
}

export function MyBookings({ endpoint }: { endpoint: string }) {
  // Clerk's hooks throw outside <ClerkProvider>, so the inner component only
  // mounts when accounts are switched on — same split as the booking form.
  if (!CLERK_ENABLED) return null;
  return <BookingsList endpoint={endpoint} />;
}
