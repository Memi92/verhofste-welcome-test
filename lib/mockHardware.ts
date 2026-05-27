import type { Employee } from "@/types";

const MOCK_ACTION_DELAY_MS = 600;

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function callEmployeeMock(employeeId: Employee["id"]) {
  await wait(MOCK_ACTION_DELAY_MS);

  // TODO: Replace this with the selected phone system integration only after
  // that system is chosen. This function must stay mocked during phase 1.
  console.info("[mockHardware] callEmployeeMock", { employeeId });

  // TODO: When Supabase is configured, insert a server-side event_logs row for
  // this mock action instead of relying on console output.
}

export async function callReceptionMock() {
  await wait(MOCK_ACTION_DELAY_MS);

  // TODO: Future 3CX integration should route this fallback to the configured
  // reception extension instead of this mocked console event.
  console.info("[mockHardware] callReceptionMock");
}

export async function openDoorMock(employeeId?: Employee["id"]) {
  await wait(MOCK_ACTION_DELAY_MS);

  // TODO: Replace this with real door hardware integration only after that
  // system is selected and approved. This must remain mocked for now.
  console.info("[mockHardware] openDoorMock", { employeeId });
}
