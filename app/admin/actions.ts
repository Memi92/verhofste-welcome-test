"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createEmployee,
  setEmployeeActive,
  updateEmployee,
} from "@/lib/supabaseEmployees";
import {
  getEmployeePhotoFile,
  uploadEmployeePhoto,
} from "@/lib/supabaseEmployeePhotos";
import { createClient } from "@/lib/supabase/server";
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

function finish(result: { ok: boolean; message: string }): never {
  revalidatePath("/admin");
  revalidatePath("/visitor");

  const status = result.ok ? "saved" : "error";
  redirect(`/admin?${status}=${encodeURIComponent(result.message)}`);
}

export async function createEmployeeAction(formData: FormData) {
  const values = getEmployeeValues(formData);
  const photo = getEmployeePhotoFile(formData);

  if (photo) {
    const uploadResult = await uploadEmployeePhoto(photo);

    if (!uploadResult.ok) {
      finish(uploadResult);
    }

    values.image_url = uploadResult.publicUrl;
  }

  const result = await createEmployee(values);
  finish(result);
}

export async function updateEmployeeAction(formData: FormData) {
  const id = getString(formData, "id");
  const values = getEmployeeValues(formData);
  const photo = getEmployeePhotoFile(formData);

  if (photo) {
    const uploadResult = await uploadEmployeePhoto(photo, id);

    if (!uploadResult.ok) {
      finish(uploadResult);
    }

    values.image_url = uploadResult.publicUrl;
  }

  const result = await updateEmployee(id, values);
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

export async function logoutAdminAction() {
  const supabase = await createClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect("/admin/login");
}
