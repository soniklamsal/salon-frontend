/**
 * Reports whether sign-in is switched on, and what is missing if not.
 *
 * Run with `npm run check:auth`. Exists because the failure mode is silent by
 * design: with no credentials the site works and /services is simply open,
 * which looks identical to "the gate is broken".
 *
 * It checks both sides, because the two most confusing states are the ones
 * where only half the configuration is present:
 *
 *   - Google set but SALON_AUTH_SECRET missing: people can sign in, and every
 *     booking they make is still recorded as anonymous.
 *   - SALON_AUTH_SECRET set on one side only, or set to different values: the
 *     same symptom, with nothing in the browser to suggest why.
 *
 * That second one cannot be caught by looking at one file, so this compares
 * the frontend's value against the backend's.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const backendEnv = path.resolve(root, "../backend/.env");

function read(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

function value(text, key) {
  const line = text
    .split(/\r?\n/)
    .find((l) => l.trim().startsWith(`${key}=`));
  if (!line) return "";
  return line.slice(line.indexOf("=") + 1).trim();
}

const front = read(path.join(root, ".env"));
const back = read(backendEnv);

// AUTH_SECRET is the Auth.js v5 name and the only one src/auth.ts reads.
const authSecret = value(front, "AUTH_SECRET");

const frontShared = value(front, "SALON_AUTH_SECRET");
const backShared = value(back, "SALON_AUTH_SECRET");

const checks = [
  {
    label: "GOOGLE_CLIENT_ID",
    where: ".env",
    got: value(front, "GOOGLE_CLIENT_ID"),
    valid: (v) => v.endsWith(".apps.googleusercontent.com"),
    hint: "Google Cloud console -> Credentials -> OAuth client (ends .apps.googleusercontent.com)",
  },
  {
    label: "GOOGLE_CLIENT_SECRET",
    where: ".env",
    got: value(front, "GOOGLE_CLIENT_SECRET"),
    valid: (v) => v.startsWith("GOCSPX-"),
    hint: "Google Cloud console -> Credentials -> OAuth client (starts GOCSPX-)",
  },
  {
    label: "AUTH_SECRET",
    where: ".env",
    got: authSecret,
    // 32 bytes base64 is 44 characters. Shorter than that and Auth.js will
    // run but the session cookie is weakly keyed.
    valid: (v) => v.length >= 32,
    hint: "Generate one: openssl rand -base64 32",
  },
  {
    label: "SALON_AUTH_SECRET",
    where: ".env",
    got: frontShared,
    valid: (v) => v.length >= 32,
    hint: "Generate one: openssl rand -base64 32 (the API needs the same value)",
  },
  {
    label: "SALON_AUTH_SECRET",
    where: "../backend/.env",
    got: backShared,
    valid: (v) => v.length >= 32,
    hint: "Must be the SAME value as the frontend's, character for character",
  },
];

let blocking = 0;
console.log("\nSign-in readiness\n");

for (const c of checks) {
  const ok = c.got && c.valid(c.got) && !c.got.includes("xxxx");
  if (!ok && !c.optional) blocking++;
  const mark = ok ? "OK  " : c.optional ? "--  " : "X   ";
  console.log(`  ${mark}${c.label}  (${c.where})`);
  if (!ok) console.log(`        ${c.hint}`);
}

// The check that no single file can make. Two valid-looking secrets that
// differ produce exactly the symptom people report as "login works but my
// bookings don't show up".
const mismatched = frontShared && backShared && frontShared !== backShared;
if (mismatched) {
  console.log("");
  console.log("  X   SALON_AUTH_SECRET differs between the two files.");
  console.log("        Sign-in will work, but the API will reject every token,");
  console.log("        so bookings are recorded without an account.");
}

console.log("");
if (blocking === 0 && !mismatched) {
  console.log("  Sign-in is ON. /services and /status now require an account,");
  console.log("  and bookings are recorded against the Google account that made them.");
  console.log("  Restart `npm run dev` if it was already running.\n");
} else if (blocking === 0 && mismatched) {
  console.log("  Sign-in is ON but the API cannot verify it -- fix the mismatch above.\n");
} else {
  console.log(
    `  Sign-in is OFF (${blocking} value(s) missing). The site works and /services stays open.\n`
  );
}