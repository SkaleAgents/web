import { expect, it } from "vitest";
import { scheduledRunLabel } from "./audit-dispatch";

it("labels a scheduler dispatch and a legacy schedule id", () => {
  expect(scheduledRunLabel({ dispatchActor: "scheduler" })).toBe("Scheduled run");
  expect(scheduledRunLabel({ scheduleId: "schedule-1" })).toBe("Scheduled run");
  expect(scheduledRunLabel({ dispatchActor: "user", scheduleId: "schedule-1" })).toBeNull();
  expect(scheduledRunLabel({ dispatchActor: "user" })).toBeNull();
});
