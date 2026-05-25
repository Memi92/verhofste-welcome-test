import { EmployeeManager } from "@/components/admin/employee-manager";
import { getEmployees } from "@/lib/supabaseEmployees";

type AdminPageProps = {
  searchParams: Promise<{
    saved?: string;
    error?: string;
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const [{ employees, source, error: loadError }, params] = await Promise.all([
    getEmployees(false),
    searchParams,
  ]);

  return (
    <EmployeeManager
      employees={employees}
      source={source}
      loadError={loadError}
      savedMessage={params.saved}
      errorMessage={params.error}
    />
  );
}
