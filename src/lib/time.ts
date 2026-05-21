const TZ = "America/New_York";

/** Today's date in EST as YYYY-MM-DD */
export function todayEST(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ });
}

/** Start of current week (Sunday) in EST as YYYY-MM-DD */
export function weekStartEST(): string {
  const d = new Date(todayEST() + "T12:00:00");
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().split("T")[0];
}

/** Day name in EST, e.g. "Monday" */
export function dayNameEST(): string {
  return new Date().toLocaleDateString("en-US", { timeZone: TZ, weekday: "long" });
}

/** Full date label in EST, e.g. "Monday, May 19" */
export function dateLabelEST(): string {
  return new Date().toLocaleDateString("en-US", { timeZone: TZ, weekday: "long", month: "long", day: "numeric" });
}

/** Offset date from today in EST as YYYY-MM-DD (e.g. daysFromTodayEST(1) = tomorrow) */
export function daysFromTodayEST(days: number): string {
  const d = new Date(todayEST() + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}
