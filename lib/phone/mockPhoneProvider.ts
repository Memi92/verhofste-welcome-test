import "server-only";

import { callEmployeeMock, callReceptionMock } from "@/lib/mockHardware";
import type { Employee } from "@/types";

export async function callEmployeeWithMock(employee: Employee) {
  await callEmployeeMock(employee.id);
}

export async function callReceptionWithMock() {
  await callReceptionMock();
}
