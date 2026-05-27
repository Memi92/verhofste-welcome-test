import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

type AdminAccessState =
  | {
      status: "authorized";
      user: User;
    }
  | {
      status:
        | "missing_supabase"
        | "missing_admin_email"
        | "unauthenticated"
        | "forbidden";
      user?: User;
      message: string;
    };

function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

export function getConfiguredAdminEmail() {
  return normalizeEmail(process.env.ADMIN_EMAIL);
}

export function isConfiguredAdminUser(user: User | null | undefined) {
  const adminEmail = getConfiguredAdminEmail();

  return Boolean(adminEmail && normalizeEmail(user?.email) === adminEmail);
}

export async function getAdminAccessState(): Promise<AdminAccessState> {
  const supabase = await createClient();

  if (!supabase) {
    return {
      status: "missing_supabase",
      message: "Supabase environment variables are not configured.",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "unauthenticated",
      message: "You must be logged in to access the admin portal.",
    };
  }

  if (!getConfiguredAdminEmail()) {
    return {
      status: "missing_admin_email",
      user,
      message: "ADMIN_EMAIL is not configured on the server.",
    };
  }

  if (!isConfiguredAdminUser(user)) {
    return {
      status: "forbidden",
      user,
      message: "Access denied. This account is not the configured admin user.",
    };
  }

  return {
    status: "authorized",
    user,
  };
}

export async function requireAdminAccess() {
  const access = await getAdminAccessState();

  if (access.status !== "authorized") {
    return {
      ok: false as const,
      message: access.message,
    };
  }

  return {
    ok: true as const,
    user: access.user,
  };
}
