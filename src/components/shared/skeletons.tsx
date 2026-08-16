import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Page-shaped placeholders, used by the `loading.tsx` of each route.
 *
 * Next renders these while a route's server component is still fetching. That
 * wait is real here: every page calls `getSiteContent()`, which talks to Django
 * with a 4s timeout, so a cold navigation can sit on a blank screen.
 *
 * Shaped like the page each one stands in for — same gutters, same rhythm, same
 * heading size — so the arriving content lands where the placeholder was
 * instead of shunting it aside.
 *
 * Marked `aria-hidden` with a live-region label above them: a screen reader
 * should hear "loading", not a description of forty grey rectangles.
 */

function Line({ className }: { className?: string }) {
  return <Skeleton className={cn("h-4", className)} />;
}

/** Announces the wait once, for assistive tech, without drawing anything. */
export function LoadingLabel({ what }: { what: string }) {
  return (
    <span role="status" aria-live="polite" className="sr-only">
      Loading {what}…
    </span>
  );
}

/** The band every inner page opens with: back button, title, standfirst. */
export function PageHeaderSkeleton() {
  return (
    <div aria-hidden>
      <Skeleton className="h-10 w-10 rounded-full" />
      <Skeleton className="mt-6 h-12 w-[min(420px,70%)]" />
      <div className="mt-5 space-y-2">
        <Line className="w-[min(520px,90%)]" />
        <Line className="w-[min(380px,70%)]" />
      </div>
    </div>
  );
}

/** A full-viewport opening band, like the home page's hero. */
export function HeroSkeleton() {
  return (
    <section
      aria-hidden
      className="flex min-h-svh w-full items-center bg-[#0a0a0a]"
    >
      <div className="mx-auto w-full max-w-[1440px] px-6 sm:px-10 xl:px-16">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <Line className="w-40" />
            <Skeleton className="mt-6 h-14 w-[min(460px,95%)]" />
            <Skeleton className="mt-3 h-14 w-[min(360px,80%)]" />
            <div className="mt-6 space-y-2">
              <Line className="w-[min(380px,90%)]" />
              <Line className="w-[min(300px,70%)]" />
            </div>
            <div className="mt-10 flex flex-wrap gap-6">
              <Skeleton className="h-[52px] w-[182px] max-w-full" />
              <Skeleton className="h-[52px] w-[182px] max-w-full" />
            </div>
          </div>
          <Skeleton className="ml-auto aspect-[720/625] w-full max-w-[420px] md:max-w-none" />
        </div>
      </div>
    </section>
  );
}

/** A generic content band, for the stack of sections below a hero. */
export function BandSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <section
      aria-hidden
      className={cn("bg-[#0a0a0a]", tall ? "py-24" : "py-16")}
    >
      <div className="mx-auto w-full max-w-[1440px] px-6 sm:px-10 xl:px-16">
        <Skeleton className="h-10 w-[min(360px,70%)]" />
        <div className="mt-6 space-y-2">
          <Line className="w-[min(560px,90%)]" />
          <Line className="w-[min(440px,75%)]" />
        </div>
        {tall ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] w-full" />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

/** A stack of labelled fields, for form-led pages. */
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div aria-hidden className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i}>
          <Line className="mb-2 w-28" />
          <Skeleton className="h-12 w-full" />
        </div>
      ))}
      <Skeleton className="h-12 w-44" />
    </div>
  );
}
