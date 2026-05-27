import { EmployeeManager } from "@/components/admin/employee-manager";
import { createClient } from "@/lib/supabase/server";
import { getRecentEventLogs } from "@/lib/supabaseEventLogs";
import { getEmployees } from "@/lib/supabaseEmployees";
import { redirect } from "next/navigation";

type AdminPageProps = {
  searchParams: Promise<{
    saved?: string;
    error?: string;
    tab?: string;
    eventType?: string;
    from?: string;
    to?: string;
    limit?: string;
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const supabase = await createClient();

  if (!supabase) {
    redirect(
      "/admin/login?error=Supabase%20environment%20variables%20are%20not%20configured."
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const eventLogLimit = params.limit ? Number(params.limit) : undefined;
  const [{ employees, source, error: loadError }, eventLogsResult] =
    await Promise.all([
      getEmployees(false),
      getRecentEventLogs({
        eventType: params.eventType,
        fromDate: params.from,
        toDate: params.to,
        limit: eventLogLimit,
      }),
    ]);

  return (
    <EmployeeManager
      employees={employees}
      source={source}
      loadError={loadError}
      savedMessage={params.saved}
      errorMessage={params.error}
      eventLogs={eventLogsResult.logs}
      eventLogsHasMore={eventLogsResult.hasMore}
      eventLogsError={eventLogsResult.error}
      selectedTab={params.tab}
      selectedEventType={params.eventType}
      eventLogsFromDate={params.from}
      eventLogsToDate={params.to}
      eventLogsLimit={eventLogLimit}
    />
  );
}
