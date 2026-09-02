import type { DefaultSession } from "next-auth";

/**
 * The two fields this app adds to Auth.js's session and token.
 *
 * `emailVerified` rather than Google's own `email_verified` on the session:
 * the session is this app's shape, and the rest of it is camelCase. The token
 * keeps the snake_case name because that is the JWT claim Google sends and
 * Django reads.
 */
declare module "next-auth" {
  interface Session {
    user: {
      /** Google's `sub`. Stored by Django as `google_user_id`. */
      id: string;
      /**
       * Whether Google vouches for the address.
       *
       * Not `emailVerified`: Auth.js already defines that on `User` as
       * `Date | null` for database adapters, and redeclaring it as a boolean
       * is a type error rather than an override.
       */
      emailIsVerified: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    email_verified?: boolean;
  }
}
