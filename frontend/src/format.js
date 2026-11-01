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
// Current month as "YYYY-MM"
export function currentMonth() {
  return today().slice(0, 7);
}

// "2026-10" -> "Oct 2026"
export function monthLabel(value) {
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

// "2026-10" -> "Oct"
export function shortMonth(value) {
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("en-GB", {
    month: "short",
  });
}

// The last `count` months ending at endMonth, oldest first
export function recentMonths(endMonth, count) {
  const [year, month] = endMonth.split("-").map(Number);
  const result = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1);
    result.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  }
  return result;
}