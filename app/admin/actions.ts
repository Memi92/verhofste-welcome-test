"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createEmployee,
  setEmployeeActive,
  updateEmployee,
} from "@/lib/supabaseEmployees";
import type { EmployeeFormValues } from "@/types";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function getEmployeeValues(formData: FormData): EmployeeFormValues {
  return {
    name: getString(formData, "name"),
    department: getString(formData, "department"),
    function: getString(formData, "function"),
    phone_extension: getString(formData, "phone_extension"),
    image_url: getString(formData, "image_url"),
  };
}

function finish(result: { ok: boolean; message: string }) {
  revalidatePath("/admin");
  revalidatePath("/visitor");

  const status = result.ok ? "saved" : "error";
  redirect(`/admin?${status}=${encodeURIComponent(result.message)}`);
}

export async function createEmployeeAction(formData: FormData) {
  const result = await createEmployee(getEmployeeValues(formData));
  finish(result);
}

export async function updateEmployeeAction(formData: FormData) {
  const id = getString(formData, "id");
  const result = await updateEmployee(id, getEmployeeValues(formData));
  finish(result);
}

export async function deactivateEmployeeAction(formData: FormData) {
  const id = getString(formData, "id");
  const result = await setEmployeeActive(id, false);
  finish(result);
}

export async function reactivateEmployeeAction(formData: FormData) {
  const id = getString(formData, "id");
  const result = await setEmployeeActive(id, true);
  finish(result);
}
