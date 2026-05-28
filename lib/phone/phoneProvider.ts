import "server-only";

import { callEmployeeWithMock } from "@/lib/phone/mockPhoneProvider";
import {
  callEmployeeWithThreeCx,
  endThreeCxPhoneCall,
  getThreeCxPhoneCallStatus,
  type PhoneCallStatus,
} from "@/lib/phone/threeCxPhoneProvider";
import type { Employee } from "@/types";

export type PhoneProvider = "mock" | "3cx";

export function getPhoneProvider(): PhoneProvider {
  return process.env.PHONE_PROVIDER?.trim().toLowerCase() === "3cx"
    ? "3cx"
    : "mock";
}

export async function callEmployee(employee: Employee) {
  const provider = getPhoneProvider();

  if (provider === "3cx") {
    await callEmployeeWithThreeCx(employee);
    return { provider };
  }

  await callEmployeeWithMock(employee);
  return { provider };
}

export async function getPhoneCallStatus(
  employee: Employee
): Promise<PhoneCallStatus | null> {
  if (getPhoneProvider() !== "3cx") {
    return null;
  }

  return getThreeCxPhoneCallStatus(employee);
}

export async function endPhoneCall() {
  const provider = getPhoneProvider();

  if (provider === "3cx") {
    await endThreeCxPhoneCall();
    return { provider };
  }

  return { provider };
}
