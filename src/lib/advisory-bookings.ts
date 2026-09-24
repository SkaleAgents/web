import type { AdvisoryBooking, ApiUser } from "./api";

export type BookingStatus = AdvisoryBooking["status"];

export const bookingStatusLabels: Record<BookingStatus, string> = {
  requested: "Requested",
  accepted: "Accepted",
  scheduled: "Scheduled",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const bookingTransitions: Record<BookingStatus, BookingStatus[]> = {
  requested: ["accepted", "cancelled"],
  accepted: ["scheduled", "cancelled"],
  scheduled: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function isStaff(user: ApiUser | null | undefined): boolean {
  return user?.staffRole === "staff" || user?.staffRole === "operator";
}

export function isClosedBooking(status: BookingStatus): boolean {
  return status === "completed" || status === "cancelled";
}
