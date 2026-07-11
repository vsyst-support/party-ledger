export const AUTH_COOKIE = "ledger_auth";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 31; // exactly 31 days, in seconds

// Token format: "<expiresAtMs>.<signature>", where the signature is a SHA-256 hash
// of the password and the expiry. The server rejects the token once the expiry
// passes, so sessions end after one month even if the cookie itself survives.
// Uses Web Crypto so it works in both the Node runtime and Edge middleware.

async function sign(expiresAt) {
  const password = process.env.LEDGER_PASSWORD;
  if (!password) throw new Error("Missing LEDGER_PASSWORD environment variable (set it in .env.local)");
  const data = new TextEncoder().encode(`ledger-site:${password}:${expiresAt}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function createAuthToken() {
  const expiresAt = Date.now() + SESSION_MAX_AGE * 1000;
  return `${expiresAt}.${await sign(expiresAt)}`;
}

export async function verifyAuthToken(token) {
  if (typeof token !== "string" || !token.includes(".")) return false;
  const [expStr, signature] = token.split(".");
  const expiresAt = Number(expStr);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;
  return signature === (await sign(expiresAt));
}
