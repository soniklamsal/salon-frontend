"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";

import { CLERK_ENABLED, SIGN_IN_PATH } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * The header's account control: a Sign in link, or the avatar menu.
 *
 * Renders nothing at all when Clerk is off — an inert "Sign in" link that led
 * to a panel saying accounts do not work yet would be worse than no link.
 *
 * `compact` matches the social icons beside it in the desktop bar; the mobile
 * menu uses the full size.
 */
/**
 * `useUser` throws outside <ClerkProvider> — it does not degrade. So the hook
 * lives in this inner component, which is only ever rendered when Clerk is on;
 * the exported wrapper below does the check before mounting it. Putting the
 * check inside one component would break either the rules of hooks or the
 * no-provider case.
 */
function ClerkControls({ compact }: { compact: boolean }) {
  const { isLoaded, isSignedIn } = useUser();
  // "Your status" is a nav destination like any other, so it carries the same
  // active state — /status is not in the CMS nav list, so nothing else can.
  const onStatusPage = usePathname() === "/status";

  // Clerk has not answered yet. A placeholder the size of what is coming,
  // rather than empty space that then shoves the bar sideways — and never a
  // guess at "Sign in", which would flash at someone already signed in.
  if (!isLoaded) {
    return (
      <Skeleton
        className={cn("rounded-full", compact ? "h-7 w-20" : "h-9 w-24")}
      />
    );
  }

  if (isSignedIn) {
    return (
      <>
        <Link
          href="/status"
          aria-current={onStatusPage ? "page" : undefined}
          className={cn(
            onStatusPage && "active",
            // `text-white` is not optional here. Without it the link inherits
            // `body { color: var(--color-deep) }` — #230a01, the brand's dark
            // red-brown — which on the near-black header reads as maroon. The
            // CMS nav links avoid this because `.desktop-nav-link` sets white
            // explicitly; this one is not that class.
            //
            // No hover colour here: globals.css draws a green rule under
            // header links on hover and focus, and the text itself stays put.
            "font-semibold whitespace-nowrap text-white transition-colors",
            compact ? "text-sm" : "text-[18px]"
          )}
        >
          Your status
        </Link>
        <UserButton
        // Only the size is set here; colour comes from the provider theme.
        appearance={{
          elements: { avatarBox: compact ? "h-7 w-7" : "h-10 w-10" },
        }}
        />
      </>
    );
  }

  return (
    <Link
      href={SIGN_IN_PATH}
      className={`text-accent font-semibold whitespace-nowrap transition-opacity hover:opacity-70 ${
        compact ? "text-sm" : "text-[18px]"
      }`}
    >
      Sign in
    </Link>
  );
}

export function AuthControls({ compact = false }: { compact?: boolean }) {
  if (!CLERK_ENABLED) return null;
  return <ClerkControls compact={compact} />;
}
