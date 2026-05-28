import "server-only";

import {
  callEmployeeWithMock,
  callReceptionWithMock,
} from "@/lib/phone/mockPhoneProvider";
import {
  callDestinationWithThreeCx,
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

export function getReceptionExtension() {
  return process.env.RECEPTION_EXTENSION?.trim() || "801";
}

export async function callEmployee(employee: Employee) {
  const provider = getPhoneProvider();

  if (provider === "3cx") {
    await callDestinationWithThreeCx(employee.phone_extension);
    return { provider };
  }

  await callEmployeeWithMock(employee);
  return { provider };
}

export async function callReception() {
  const provider = getPhoneProvider();

  if (provider === "3cx") {
    await callDestinationWithThreeCx(getReceptionExtension());
    return { provider };
  }

  await callReceptionWithMock();
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

export async function getReceptionCallStatus(): Promise<PhoneCallStatus | null> {
  if (getPhoneProvider() !== "3cx") {
    return null;
  }

  return getThreeCxPhoneCallStatus({
    phone_extension: getReceptionExtension(),
  });
}

export async function endPhoneCall() {
  const provider = getPhoneProvider();

  if (provider === "3cx") {
    await endThreeCxPhoneCall();
    return { provider };
  }

  return { provider };
}
