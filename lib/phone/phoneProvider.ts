import "server-only";

import { callEmployeeWithMock } from "@/lib/phone/mockPhoneProvider";
import { callEmployeeWithThreeCx } from "@/lib/phone/threeCxPhoneProvider";
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
