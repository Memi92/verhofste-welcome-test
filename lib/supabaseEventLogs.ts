import { createClient } from "@/lib/supabase/server";

export type EventLogReadable = {
  id: string;
  created_at: string;
  event_type: string;
  message: string | null;
  employee_id: string | null;
  employee_name: string | null;
  employee_department: string | null;
  employee_function: string | null;
  employee_phone_extension: string | null;
};

type EventLogsLoadResult = {
  logs: EventLogReadable[];
  hasMore: boolean;
  error?: string;
};

export type EventLogsQueryOptions = {
  eventType?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
};

const DEFAULT_EVENT_LOG_LIMIT = 50;
const MAX_EVENT_LOG_LIMIT = 500;

function getQueryLimit(limit?: number) {
  if (!limit || !Number.isFinite(limit)) {
    return DEFAULT_EVENT_LOG_LIMIT;
  }

  return Math.min(Math.max(Math.trunc(limit), DEFAULT_EVENT_LOG_LIMIT), MAX_EVENT_LOG_LIMIT);
}

function getDateStart(value?: string) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00+02:00`);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function getDateEnd(value?: string) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T23:59:59.999+02:00`);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function getRecentEventLogs({
  eventType,
  fromDate,
  toDate,
  limit,
}: EventLogsQueryOptions = {}): Promise<EventLogsLoadResult> {
  const supabase = await createClient();
  const queryLimit = getQueryLimit(limit);

  if (!supabase) {
    return {
      logs: [],
      hasMore: false,
      error: "Supabase environment variables are not configured.",
    };
  }

  let query = supabase
    .from("event_logs_readable")
    .select(
      "id,created_at,event_type,message,employee_id,employee_name,employee_department,employee_function,employee_phone_extension"
    )
    .order("created_at", { ascending: false })
    .range(0, queryLimit);

  if (eventType) {
    query = query.eq("event_type", eventType);
  }

  const fromDateStart = getDateStart(fromDate);
  const toDateEnd = getDateEnd(toDate);

  if (fromDateStart) {
    query = query.gte("created_at", fromDateStart);
  }

  if (toDateEnd) {
    query = query.lte("created_at", toDateEnd);
  }

  const { data, error } = await query.returns<EventLogReadable[]>();

  if (error) {
    return {
      logs: [],
      hasMore: false,
      error: error.message,
    };
  }

  const rows = data ?? [];

  return {
    logs: rows.slice(0, queryLimit),
    hasMore: rows.length > queryLimit,
  };
}
