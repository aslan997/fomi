import { ratioToNumber } from "@/lib/generation-options";

export { describeLook } from "./options";

/** CSS aspect-ratio value for a "W:H" string. */
export function ratioOf(ratio) {
  return ratioToNumber(ratio);
}

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const absolute = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

/** "5 minutes ago" within a day, otherwise "Oct 23, 10:12 AM". */
export function formatTime(iso, now = Date.now()) {
  const diff = (new Date(iso).getTime() - now) / 1000;
  if (Math.abs(diff) < 60) return "just now";
  if (Math.abs(diff) < 3600) return relative.format(Math.round(diff / 60), "minute");
  if (Math.abs(diff) < 86400) return relative.format(Math.round(diff / 3600), "hour");
  return absolute.format(new Date(iso));
}
