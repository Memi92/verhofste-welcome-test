import { EmployeeManager } from "@/components/admin/employee-manager";
import { createClient } from "@/lib/supabase/server";
import { getEmployees } from "@/lib/supabaseEmployees";
import { redirect } from "next/navigation";

type AdminPageProps = {
  searchParams: Promise<{
    saved?: string;
    error?: string;
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

  const [{ employees, source, error: loadError }, params] =
    await Promise.all([getEmployees(false), searchParams]);

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
