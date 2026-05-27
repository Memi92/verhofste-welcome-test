"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isConfiguredAdminUser } from "@/lib/adminAuth";
import { createClient } from "@/lib/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

export async function loginAction(formData: FormData) {
  const supabase = await createClient();

  if (!supabase) {
    redirect(
      "/admin/login?error=Supabase%20environment%20variables%20are%20not%20configured."
    );
  }

  const email = getString(formData, "email").trim();
  const password = getString(formData, "password");

  if (!email || !password) {
    redirect("/admin/login?error=Email%20and%20password%20are%20required.");
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/admin/login?error=${encodeURIComponent(error.message)}`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isConfiguredAdminUser(user)) {
    await supabase.auth.signOut();
    redirect(
      "/admin/login?error=Access%20denied.%20This%20account%20is%20not%20the%20configured%20admin%20user."
    );
  }

  revalidatePath("/", "layout");
  redirect("/admin");
}
