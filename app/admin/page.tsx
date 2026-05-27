import { EmployeeManager } from "@/components/admin/employee-manager";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminAccessState } from "@/lib/adminAuth";
import { getRecentEventLogs } from "@/lib/supabaseEventLogs";
import { getEmployees } from "@/lib/supabaseEmployees";
import Link from "next/link";
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
  const adminAccess = await getAdminAccessState();

  if (adminAccess.status === "missing_supabase") {
    redirect(
      "/admin/login?error=Supabase%20environment%20variables%20are%20not%20configured."
    );
  }

  if (adminAccess.status === "unauthenticated") {
    redirect("/admin/login");
  }

  if (adminAccess.status !== "authorized") {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-stone-50 p-6 text-neutral-950">
        <Card className="w-full max-w-xl rounded-[8px] border-neutral-200 bg-white shadow-sm">
          <CardHeader className="p-8">
            <CardTitle className="text-3xl font-semibold">
              Access denied
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 px-8 pb-8">
            <Alert variant="destructive" className="rounded-[8px] p-4">
              <AlertTitle>Admin access restricted</AlertTitle>
              <AlertDescription>{adminAccess.message}</AlertDescription>
            </Alert>
            <Button asChild className="h-12 rounded-[8px]">
              <Link href="/admin/login">Back to admin login</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
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
