import { VisitorFlow } from "@/components/kiosk/visitor-flow";
import { getActiveEmployees } from "@/lib/supabaseEmployees";

export default async function VisitorPage() {
  const { employees } = await getActiveEmployees();

  return <VisitorFlow employees={employees} />;
}
