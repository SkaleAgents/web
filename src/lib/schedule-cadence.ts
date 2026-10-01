export const scheduleTimezones = ["UTC", "America/Los_Angeles", "America/New_York", "Europe/London", "Europe/Berlin", "Asia/Dhaka", "Asia/Kolkata", "Asia/Singapore", "Asia/Tokyo", "Australia/Sydney"];

export const scheduleCadencePresets = [
  { label: "Hourly", cron: "0 * * * *", description: "Every hour, at minute 0" },
  { label: "Daily", cron: "0 9 * * *", description: "Every day at 09:00" },
  { label: "Weekdays", cron: "0 9 * * 1-5", description: "Monday through Friday at 09:00" },
  { label: "Weekly", cron: "0 9 * * 1", description: "Every Monday at 09:00" },
];

export function scheduleCadenceLabel(cronExpression: string): string {
  return scheduleCadencePresets.find((preset) => preset.cron === cronExpression)?.label ?? cronExpression;
}
