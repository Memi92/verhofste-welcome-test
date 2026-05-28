import "server-only";

import { callEmployeeMock } from "@/lib/mockHardware";
import type { Employee } from "@/types";

export async function callEmployeeWithMock(employee: Employee) {
  await callEmployeeMock(employee.id);
}
