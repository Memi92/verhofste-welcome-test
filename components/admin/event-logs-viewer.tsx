import Link from "next/link";
import { RefreshCw } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBrusselsDateTime } from "@/lib/formatDate";
import type { EventLogReadable } from "@/lib/supabaseEventLogs";

type EventLogsViewerProps = {
  logs: EventLogReadable[];
  hasMore: boolean;
  error?: string;
  selectedEventType?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
};

const DEFAULT_LIMIT = 50;
const PAGE_SIZE = 50;

const eventTypeLabels: Record<string, string> = {
  pin_success: "PIN success",
  pin_failed: "PIN failed",
  open_door_mock: "Door mock",
  call_employee_mock: "Call mock",
  call_reception_mock: "Reception call",
  call_connected_mock: "Call connected",
  call_ended_mock: "Call ended",
  call_cancelled_mock: "Call cancelled",
};

const filterOptions = [
  { label: "All", value: "" },
  { label: "PIN success", value: "pin_success" },
  { label: "PIN failed", value: "pin_failed" },
  { label: "Door mock", value: "open_door_mock" },
  { label: "Call mock", value: "call_employee_mock" },
  { label: "Reception call", value: "call_reception_mock" },
  { label: "Call connected", value: "call_connected_mock" },
  { label: "Call ended", value: "call_ended_mock" },
  { label: "Call cancelled", value: "call_cancelled_mock" },
];

function getEventTypeLabel(eventType: string) {
  return eventTypeLabels[eventType] ?? eventType.replaceAll("_", " ");
}

function getLogsHref({
  eventType,
  fromDate,
  toDate,
  limit,
}: {
  eventType?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
}) {
  const params = new URLSearchParams({ tab: "logs" });

  if (eventType) {
    params.set("eventType", eventType);
  }

  if (fromDate) {
    params.set("from", fromDate);
  }

  if (toDate) {
    params.set("to", toDate);
  }

  if (limit && limit !== DEFAULT_LIMIT) {
    params.set("limit", String(limit));
  }

  return `/admin?${params.toString()}`;
}

export function EventLogsViewer({
  logs,
  hasMore,
  error,
  selectedEventType,
  fromDate,
  toDate,
  limit,
}: EventLogsViewerProps) {
  const currentLimit = limit ?? DEFAULT_LIMIT;
  const hasActiveFilters = Boolean(selectedEventType || fromDate || toDate);

  return (
    <Card className="rounded-[8px] border-neutral-200 bg-white shadow-sm">
      <CardHeader className="gap-4 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-2xl font-semibold">
              Event logs
            </CardTitle>
            <p className="mt-2 text-sm text-neutral-600">
              Showing newest logs first.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {hasActiveFilters ? (
              <Button asChild variant="outline" className="h-10 rounded-[8px]">
                <Link href="/admin?tab=logs">Reset filters</Link>
              </Button>
            ) : null}
            <Button asChild variant="outline" className="h-10 rounded-[8px]">
              <Link
                href={getLogsHref({
                  eventType: selectedEventType,
                  fromDate,
                  toDate,
                  limit: currentLimit,
                })}
              >
                <RefreshCw className="size-4" aria-hidden="true" />
                Refresh
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => {
            const isSelected = (selectedEventType ?? "") === option.value;

            return (
              <Button
                key={option.label}
                asChild
                variant={isSelected ? "default" : "outline"}
                className="h-9 rounded-[8px]"
              >
                <Link
                  href={getLogsHref({
                    eventType: option.value,
                    fromDate,
                    toDate,
                  })}
                >
                  {option.label}
                </Link>
              </Button>
            );
          })}
        </div>

        <form action="/admin" className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input type="hidden" name="tab" value="logs" />
          {selectedEventType ? (
            <input type="hidden" name="eventType" value={selectedEventType} />
          ) : null}
          <label className="grid gap-1 text-sm font-medium text-neutral-700">
            From date
            <input
              type="date"
              name="from"
              defaultValue={fromDate ?? ""}
              className="h-10 rounded-[8px] border border-neutral-300 bg-white px-3 text-sm"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-neutral-700">
            To date
            <input
              type="date"
              name="to"
              defaultValue={toDate ?? ""}
              className="h-10 rounded-[8px] border border-neutral-300 bg-white px-3 text-sm"
            />
          </label>
          <Button type="submit" className="self-end rounded-[8px]">
            Apply dates
          </Button>
        </form>

        {hasActiveFilters ? (
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="text-neutral-500">Active filters:</span>
            {selectedEventType ? (
              <Badge variant="secondary" className="rounded-[8px]">
                {getEventTypeLabel(selectedEventType)}
              </Badge>
            ) : null}
            {fromDate ? (
              <Badge variant="outline" className="rounded-[8px]">
                From {fromDate}
              </Badge>
            ) : null}
            {toDate ? (
              <Badge variant="outline" className="rounded-[8px]">
                To {toDate}
              </Badge>
            ) : null}
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="px-6 pb-6">
        {error ? (
          <Alert variant="destructive" className="mb-5 rounded-[8px] p-4">
            <AlertTitle>Could not load event logs</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Message</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-neutral-600">
                  {formatBrusselsDateTime(log.created_at)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="rounded-[8px]">
                    {getEventTypeLabel(log.event_type)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {log.employee_name ? (
                    <div>
                      <p className="font-medium text-neutral-950">
                        {log.employee_name}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {[log.employee_department, log.employee_function]
                          .filter(Boolean)
                          .join(" - ")}
                      </p>
                    </div>
                  ) : (
                    <span className="text-neutral-400">No employee</span>
                  )}
                </TableCell>
                <TableCell className="max-w-xl whitespace-normal text-neutral-600">
                  {log.message}
                </TableCell>
              </TableRow>
            ))}

            {logs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-neutral-500"
                >
                  {hasActiveFilters
                    ? "No logs match the selected filters."
                    : "No logs found."}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>

        <div className="mt-5 flex flex-col gap-3 border-t border-neutral-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-neutral-500">
            Showing {logs.length} log{logs.length === 1 ? "" : "s"}.
          </p>
          {hasMore ? (
            <Button asChild variant="outline" className="h-10 rounded-[8px]">
              <Link
                href={getLogsHref({
                  eventType: selectedEventType,
                  fromDate,
                  toDate,
                  limit: currentLimit + PAGE_SIZE,
                })}
              >
                Load more
              </Link>
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              disabled
              className="h-10 rounded-[8px]"
            >
              No more logs
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
