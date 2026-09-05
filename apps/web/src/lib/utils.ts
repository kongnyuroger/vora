export { cn } from "cn"

/** e.g. 950 -> "950 FCFA" */
export function formatXaf(amountXaf: number): string {
  return `${amountXaf.toLocaleString("fr-FR")} FCFA`;
}

/** e.g. 850 (seconds) -> "14 min" */
export function formatDurationMin(durationS: number): string {
  return `${Math.max(1, Math.round(durationS / 60))} min`;
}
