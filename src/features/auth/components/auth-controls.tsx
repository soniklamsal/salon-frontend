"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

import { useAuthConfigured } from "@/features/auth/components/auth-provider";
import { clearApiToken } from "@/lib/api/session-token";
import { SIGN_IN_PATH } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * The header's account control: a Sign in link, or the avatar and a way out.
 *
 * Renders nothing at all when sign-in is off — an inert "Sign in" link that led
 * to a panel saying accounts do not work yet would be worse than no link.
 *
 * `compact` matches the social icons beside it in the desktop bar; the mobile
 * menu uses the full size.
 *
 * Where Clerk supplied `<UserButton>` — an avatar that opened its own hosted
 * menu — this is the app's own markup. There is only one thing that menu did
 * that this site needs (sign out), and one Google account can only ever be one
 * account, so the dropdown had nothing else to offer.
 */
export function AuthControls({ compact = false }: { compact?: boolean }) {
  const configured = useAuthConfigured();
  const { data: session, status } = useSession();
  // "Your status" is a nav destination like any other, so it carries the same
  // active state — /status is not in the CMS nav list, so nothing else can.
  const onStatusPage = usePathname() === "/status";

  if (!configured) return null;

  // The session has not resolved yet. A placeholder the size of what is coming,
  // rather than empty space that then shoves the bar sideways — and never a
  // guess at "Sign in", which would flash at someone already signed in.
  if (status === "loading") {
    return (
      <Skeleton
        className={cn("rounded-full", compact ? "h-7 w-20" : "h-9 w-24")}
      />
    );
  }

  if (status === "authenticated") {
    const user = session.user;
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

        {user?.image ? (
          <Image
            src={user.image}
            alt=""
            width={40}
            height={40}
            // Google serves these from lh3.googleusercontent.com, which has to
            // be allowed in next.config — see the remotePatterns entry there.
            className={cn(
              "rounded-full object-cover",
              compact ? "h-7 w-7" : "h-10 w-10"
            )}
            // Decorative: the name is already beside it in the sign-out
            // button's title, so announcing the avatar too is noise.
            aria-hidden
          />
        ) : null}

        <button
          type="button"
          title={user?.name ? `Signed in as ${user.name}` : undefined}
          onClick={() => {
            // Drop the cached API token first. It stays valid until it
            // expires, so leaving it in memory would let the next person on
            // this browser post a booking as the account that just left.
            clearApiToken();
            void signOut({ callbackUrl: "/" });
          }}
          className={cn(
            "font-semibold whitespace-nowrap text-white/70 transition-opacity hover:opacity-70",
            compact ? "text-sm" : "text-[18px]"
          )}
        >
          Sign out
        </button>
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
