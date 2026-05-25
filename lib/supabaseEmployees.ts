import { activeMockEmployees, mockEmployees } from "@/lib/mockData";
import { createClient } from "@/lib/supabase/server";
import type { Employee, EmployeeFormValues } from "@/types";

type EmployeeRow = {
  id: string;
  name: string;
  department: string;
  function: string;
  phone_extension: string;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
};

type EmployeeLoadResult = {
  employees: Employee[];
  source: "supabase" | "mock";
  error?: string;
};

type MutationResult = {
  ok: boolean;
  message: string;
};

const employeeSelect =
  "id,name,department,function,phone_extension,image_url,is_active,created_at,updated_at";

function normalizeEmployee(row: EmployeeRow): Employee {
  return {
    id: row.id,
    name: row.name,
    department: row.department,
    function: row.function,
    phone_extension: row.phone_extension,
    image_url: row.image_url,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function cleanEmployeeValues(values: EmployeeFormValues): EmployeeFormValues {
  return {
    name: values.name.trim(),
    department: values.department.trim(),
    function: values.function.trim(),
    phone_extension: values.phone_extension.trim(),
    image_url: values.image_url?.trim() || null,
  };
}

function validateEmployeeValues(values: EmployeeFormValues) {
  if (
    !values.name.trim() ||
    !values.department.trim() ||
    !values.function.trim() ||
    !values.phone_extension.trim()
  ) {
    return "Name, department, function, and extension are required.";
  }

  return null;
}

export async function getEmployees(
  activeOnly = false
): Promise<EmployeeLoadResult> {
  const supabase = await createClient();

  if (!supabase) {
    return {
      employees: activeOnly ? activeMockEmployees : mockEmployees,
      source: "mock",
      error: "Supabase environment variables are not configured.",
    };
  }

  let query = supabase
    .from("employees")
    .select(employeeSelect)
    .order("name", { ascending: true });

  if (activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query.returns<EmployeeRow[]>();

  if (error) {
    return {
      employees: activeOnly ? activeMockEmployees : mockEmployees,
      source: "mock",
      error: error.message,
    };
  }

  return {
    employees: (data ?? []).map(normalizeEmployee),
    source: "supabase",
  };
}

export async function getActiveEmployees() {
  return getEmployees(true);
}

export async function createEmployee(
  values: EmployeeFormValues
): Promise<MutationResult> {
  const validationError = validateEmployeeValues(values);

  if (validationError) {
    return { ok: false, message: validationError };
  }

  const supabase = await createClient();

  if (!supabase) {
    return {
      ok: false,
      message: "Supabase is not configured, so mock employees cannot be saved.",
    };
  }

  const { error } = await supabase.from("employees").insert({
    ...cleanEmployeeValues(values),
    is_active: true,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Employee created." };
}

export async function updateEmployee(
  id: Employee["id"],
  values: EmployeeFormValues
): Promise<MutationResult> {
  const validationError = validateEmployeeValues(values);

  if (validationError) {
    return { ok: false, message: validationError };
  }

  const supabase = await createClient();

  if (!supabase) {
    return {
      ok: false,
      message: "Supabase is not configured, so mock employees cannot be edited.",
    };
  }

  const { error } = await supabase
    .from("employees")
    .update({
      ...cleanEmployeeValues(values),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Employee updated." };
}

export async function setEmployeeActive(
  id: Employee["id"],
  isActive: boolean
): Promise<MutationResult> {
  const supabase = await createClient();

  if (!supabase) {
    return {
      ok: false,
      message: "Supabase is not configured, so mock employees cannot be changed.",
    };
  }

  const { error } = await supabase
    .from("employees")
    .update({
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return { ok: false, message: error.message };
  }

  return {
    ok: true,
    message: isActive ? "Employee reactivated." : "Employee deactivated.",
  };
}
