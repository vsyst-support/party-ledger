export const STATUSES = ["Pending", "Done"];

export function validateEntry(body) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const balance = Number(body.balance);
  const date = typeof body.date === "string" ? body.date : "";
  const category = typeof body.category === "string" ? body.category.trim() : "";
  if (!name) return { error: "Party ledger name is required" };
  if (!Number.isFinite(balance)) return { error: "Balance must be a number" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Date must be YYYY-MM-DD" };
  if (!category) return { error: "Category is required" };
  if (category.length > 40) return { error: "Category must be 40 characters or fewer" };
  if (!STATUSES.includes(body.status)) return { error: "Invalid status" };
  return { entry: { name, balance, date, category, status: body.status } };
}

export function validateSubEntry(body) {
  const date = typeof body.date === "string" ? body.date : "";
  const particulars = typeof body.particulars === "string" ? body.particulars.trim() : "";
  const remarks = typeof body.remarks === "string" ? body.remarks.trim() : "";
  const dr = Number(body.dr ?? 0);
  const cr = Number(body.cr ?? 0);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Date must be YYYY-MM-DD" };
  if (!particulars) return { error: "Particulars is required" };
  if (particulars.length > 120) return { error: "Particulars must be 120 characters or fewer" };
  if (!Number.isFinite(dr) || dr < 0) return { error: "Dr (Paid) must be a number ≥ 0" };
  if (!Number.isFinite(cr) || cr < 0) return { error: "Cr (Received) must be a number ≥ 0" };
  if (remarks.length > 200) return { error: "Remarks must be 200 characters or fewer" };
  return { entry: { date, particulars, dr, cr, remarks } };
}

const moneyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
});

export function formatMoney(value) {
  return moneyFormatter.format(value);
}

const numberFormatter = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Amount without the currency sign, e.g. "1,00,000.00"
export function formatNumber(value) {
  return numberFormatter.format(value);
}

// Balance = Dr − Cr, shown as the absolute remainder with its ledger side.
export function formatBalance(value) {
  return value === 0 ? formatMoney(0) : `${formatMoney(Math.abs(value))} ${value > 0 ? "Dr" : "Cr"}`;
}

// Dr balance (they owe you) renders red, Cr balance renders green, settled is neutral.
export function balanceClass(value) {
  return value > 0 ? "negative" : value < 0 ? "positive" : "";
}

export function formatDate(isoDate) {
  return new Date(isoDate + "T00:00:00").toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
