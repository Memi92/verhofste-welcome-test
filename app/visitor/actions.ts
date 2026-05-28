"use server";

import { logEvent } from "@/lib/eventLogs";
import {
  callEmployee,
  endPhoneCall,
  getPhoneCallStatus,
} from "@/lib/phone/phoneProvider";
import { getActiveEmployees } from "@/lib/supabaseEmployees";
import type { Employee } from "@/types";

type MockCallEventType =
  | "call_employee_mock"
  | "call_employee_3cx"
  | "call_connected_3cx"
  | "call_ended_3cx"
  | "call_cancelled_3cx"
  | "call_failed_3cx"
  | "call_reception_mock"
  | "call_no_answer_timeout_mock"
  | "call_connected_mock"
  | "call_ended_mock"
  | "call_cancelled_mock";

const mockCallEventMessages: Record<MockCallEventType, string> = {
  call_employee_mock: "Mock employee call requested.",
  call_employee_3cx: "3CX call requested.",
  call_connected_3cx: "3CX call connected.",
  call_ended_3cx: "3CX call ended.",
  call_cancelled_3cx: "3CX call cancelled.",
  call_failed_3cx: "3CX call failed.",
  call_reception_mock: "Mock reception call requested.",
  call_no_answer_timeout_mock: "No answer popup timed out; returning to start.",
  call_connected_mock: "Mock employee call connected.",
  call_ended_mock: "Mock employee call ended.",
  call_cancelled_mock: "Mock employee call cancelled.",
};

export async function logMockCallEventAction(
  eventType: MockCallEventType,
  employeeId: Employee["id"] | null
) {
  await logEvent(eventType, mockCallEventMessages[eventType], employeeId);
}

export async function callEmployeeAction(employeeId: Employee["id"]) {
  const { employees } = await getActiveEmployees();
  const employee = employees.find((entry) => entry.id === employeeId);

  if (!employee) {
    return {
      ok: false,
      message:
        "We could not notify your host. Please try again or contact reception.",
    };
  }

  try {
    const { provider } = await callEmployee(employee);

    await logEvent(
      provider === "3cx" ? "call_employee_3cx" : "call_employee_mock",
      provider === "3cx"
        ? "3CX call requested."
        : "Mock employee call requested.",
      employee.id
    );

    return { ok: true, provider };
  } catch (error) {
    console.error("[phone] Employee call failed", {
      employeeId: employee.id,
      phoneExtension: employee.phone_extension,
      provider: process.env.PHONE_PROVIDER?.trim() || "mock",
      error,
    });

    if (process.env.PHONE_PROVIDER?.trim().toLowerCase() === "3cx") {
      await logEvent("call_failed_3cx", "3CX call failed.", employee.id);
    }

    return {
      ok: false,
      message:
        "We could not notify your host. Please try again or contact reception.",
    };
  }
}

export async function getPhoneCallStatusAction(employeeId: Employee["id"]) {
  const { employees } = await getActiveEmployees();
  const employee = employees.find((entry) => entry.id === employeeId);

  if (!employee) {
    return { ok: false, status: "failed" as const };
  }

  try {
    const status = await getPhoneCallStatus(employee);

    return { ok: true, status };
  } catch (error) {
    console.error("[phone] Employee call status lookup failed", {
      employeeId: employee.id,
      phoneExtension: employee.phone_extension,
      provider: process.env.PHONE_PROVIDER?.trim() || "mock",
      error,
    });

    if (process.env.PHONE_PROVIDER?.trim().toLowerCase() === "3cx") {
      await logEvent("call_failed_3cx", "3CX call failed.", employee.id);
    }

    return { ok: false, status: "failed" as const };
  }
}

export async function logThreeCxCallStatusEventAction(
  eventType:
    | "call_connected_3cx"
    | "call_ended_3cx"
    | "call_cancelled_3cx",
  employeeId: Employee["id"]
) {
  await logEvent(eventType, mockCallEventMessages[eventType], employeeId);
}

export async function endPhoneCallAction(employeeId: Employee["id"]) {
  try {
    const { provider } = await endPhoneCall();

    return { ok: true, provider };
  } catch (error) {
    console.error("[phone] End call failed", {
      employeeId,
      provider: process.env.PHONE_PROVIDER?.trim() || "mock",
      error,
    });

    if (process.env.PHONE_PROVIDER?.trim().toLowerCase() === "3cx") {
      await logEvent("call_failed_3cx", "3CX call failed.", employeeId);
    }

    return {
      ok: false,
      message:
        "We could not end the call. Please try again or contact reception.",
    };
  }
}

export async function cancelPhoneCallAction(employeeId: Employee["id"]) {
  try {
    const { provider } = await endPhoneCall();

    if (provider === "3cx") {
      await logEvent("call_cancelled_3cx", "3CX call cancelled.", employeeId);
    }

    return { ok: true, provider };
  } catch (error) {
    console.error("[phone] Cancel call failed", {
      employeeId,
      provider: process.env.PHONE_PROVIDER?.trim() || "mock",
      error,
    });

    if (process.env.PHONE_PROVIDER?.trim().toLowerCase() === "3cx") {
      await logEvent("call_failed_3cx", "3CX call failed.", employeeId);
    }

    return {
      ok: false,
      message:
        "We could not end the call. Please try again or contact reception.",
    };
  }
}
