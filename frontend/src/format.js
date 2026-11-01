export function formatAmount(value) {
  return `Rs ${Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// "2026-10-05" -> "5 Oct 2026" (built from parts to avoid time zone shifts)
export function formatDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Today's date as "YYYY-MM-DD" in the user's own time zone
export function today() {
  return new Date().toLocaleDateString("en-CA");
}