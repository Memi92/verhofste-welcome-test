import { createClient } from "@/lib/supabase/server";
import type { Employee } from "@/types";

type EventType = "pin_success" | "pin_failed" | "open_door_mock";

export async function logEvent(
  eventType: EventType,
  message: string,
  employeeId: Employee["id"] | null = null
) {
  const supabase = await createClient();

  if (!supabase) {
    return;
  }

  // Event logging is best-effort and must not block the kiosk user flow.
  await supabase.from("event_logs").insert({
    event_type: eventType,
    employee_id: employeeId,
    message,
  });
}
