const brusselsDateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Brussels",
});

export function formatBrusselsDateTime(
  value: string | Date | null | undefined
) {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  // Supabase/Postgres stores timestamptz values in UTC. The UI displays them
  // in Europe/Brussels time for local readability.
  return brusselsDateTimeFormatter.format(date);
}
