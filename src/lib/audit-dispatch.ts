export function scheduledRunLabel(job: {
  dispatchActor?: "user" | "scheduler" | null;
  scheduleId?: string | null;
}): string | null {
  if (job.dispatchActor === "scheduler" || (job.dispatchActor == null && job.scheduleId)) {
    return "Scheduled run";
  }
  return null;
}
