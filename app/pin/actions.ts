"use server";

import { logEvent } from "@/lib/eventLogs";
import { openDoorMock } from "@/lib/mockHardware";
import { validateEmployeePin } from "@/lib/supabaseEmployeePins";

export type PinSubmitResult =
  | {
      ok: true;
      message: string;
      employeeName: string;
    }
  | {
      ok: false;
      message: string;
    };

export async function submitPinAction(pin: string): Promise<PinSubmitResult> {
  // TODO: Add lockout after repeated failed attempts.
  // TODO: Add rate limiting by kiosk/session/IP.
  // TODO: Add admin event log review before production use.
  const validationResult = await validateEmployeePin(pin);

  if (!validationResult.ok) {
    await logEvent("pin_failed", "Invalid employee PIN attempt.");

    return {
      ok: false,
      message: validationResult.message === "Invalid PIN"
        ? "Invalid PIN"
        : "PIN validation failed.",
    };
  }

  await logEvent(
    "pin_success",
    "Employee PIN accepted.",
    validationResult.employee.id
  );

  await openDoorMock(validationResult.employee.id);

  await logEvent(
    "open_door_mock",
    "Mock door opening request sent.",
    validationResult.employee.id
  );

  return {
    ok: true,
    message: "Access granted. Door opening request sent.",
    employeeName: validationResult.employee.name,
  };
}
