/**
 * Reports whether sign-in is switched on, and what is missing if not.
 *
 * Run with `npm run check:auth`. Exists because the failure mode is silent by
 * design: with no keys the site works and /services is simply open, which
 * looks identical to "the gate is broken".
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

const front = read(path.join(root, ".env.local"));
const back = read(backendEnv);

const checks = [
  {
    label: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    where: ".env.local",
    got: value(front, "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"),
    valid: (v) => v.startsWith("pk_"),
    hint: 'Clerk dashboard -> API Keys -> "Publishable key" (starts pk_)',
  },
  {
    label: "CLERK_SECRET_KEY",
    where: ".env.local",
    got: value(front, "CLERK_SECRET_KEY"),
    valid: (v) => v.startsWith("sk_"),
    hint: 'Clerk dashboard -> API Keys -> "Secret key" (starts sk_)',
  },
  {
    label: "CLERK_ISSUER",
    where: "../backend/.env",
    got: value(back, "CLERK_ISSUER"),
    valid: (v) => v.startsWith("https://"),
    hint: 'Clerk dashboard -> API Keys -> "Frontend API URL" (https://...)',
    optional: true,
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

console.log("");
if (blocking === 0) {
  const noIssuer = !value(back, "CLERK_ISSUER");
  console.log("  Sign-in is ON. /services now requires an account.");
  if (noIssuer) {
    console.log(
      "  CLERK_ISSUER is unset, so bookings will not record WHICH account made them."
    );
  }
  console.log("  Restart `npm run dev` if it was already running.\n");
} else {
  console.log(
    `  Sign-in is OFF (${blocking} key(s) missing). The site works and /services stays open.\n`
  );
}
