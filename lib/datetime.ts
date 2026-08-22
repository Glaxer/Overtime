// Formats a Date (or ISO string) as "YYYY-MM-DDTHH:mm" in the *browser's* local time
export function toLocalInputValue(value: string | Date) {
  const d = typeof value === "string" ? new Date(value) : value;
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}
