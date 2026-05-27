"use server";

import { logEvent } from "@/lib/eventLogs";
import type { Employee } from "@/types";

type MockCallEventType =
  | "call_employee_mock"
  | "call_connected_mock"
  | "call_ended_mock"
  | "call_cancelled_mock";

const mockCallEventMessages: Record<MockCallEventType, string> = {
  call_employee_mock: "Mock employee call requested.",
  call_connected_mock: "Mock employee call connected.",
  call_ended_mock: "Mock employee call ended.",
  call_cancelled_mock: "Mock employee call cancelled.",
};

export async function logMockCallEventAction(
  eventType: MockCallEventType,
  employeeId: Employee["id"]
) {
  await logEvent(eventType, mockCallEventMessages[eventType], employeeId);
}
