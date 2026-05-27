import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { createClient } from "@/lib/supabase/server";
import type { Employee } from "@/types";

type MutationResult = {
  ok: boolean;
  message: string;
};

type ActivePinRow = {
  id: string;
};

type ActivePinValidationRow = {
  employee_id: string;
  pin_hash: string;
};

type PinEmployeeRow = {
  id: string;
  name: string;
  is_active: boolean;
};

type PinValidationResult =
  | {
      ok: true;
      employee: {
        id: Employee["id"];
        name: Employee["name"];
      };
    }
  | {
      ok: false;
      message: string;
    };

export function getPinFromFormData(formData: FormData) {
  const value = formData.get("pin_code");

  return typeof value === "string" ? value.trim() : "";
}

export function validateOptionalPin(pin: string) {
  if (!pin) {
    return null;
  }

  if (!/^\d{4}$/.test(pin)) {
    return "PIN code must be exactly 4 numeric digits.";
  }

  return null;
}

export function validateRequiredPin(pin: string) {
  if (!/^\d{4}$/.test(pin)) {
    return "PIN must be exactly 4 numeric digits.";
  }

  return null;
}

function hashPin(pin: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = createHash("sha256").update(`${salt}:${pin}`).digest("hex");

  // TODO: Before production, evaluate a slower password/PIN hashing strategy
  // such as Argon2, scrypt, or bcrypt with appropriate operational settings.
  return `sha256:${salt}:${hash}`;
}

export function verifyPinForDevelopment(pin: string, storedValue: string) {
  const [algorithm, salt, storedHash] = storedValue.split(":");

  if (algorithm !== "sha256" || !salt || !storedHash) {
    return false;
  }

  const hash = createHash("sha256").update(`${salt}:${pin}`).digest("hex");
  const hashBuffer = Buffer.from(hash, "hex");
  const storedHashBuffer = Buffer.from(storedHash, "hex");

  return (
    hashBuffer.length === storedHashBuffer.length &&
    timingSafeEqual(hashBuffer, storedHashBuffer)
  );
}

export async function setEmployeePin(
  employeeId: Employee["id"],
  pin: string
): Promise<MutationResult> {
  const validationError = validateOptionalPin(pin);

  if (validationError) {
    return { ok: false, message: validationError };
  }

  if (!pin) {
    return { ok: true, message: "PIN unchanged." };
  }

  const supabase = await createClient();

  if (!supabase) {
    return {
      ok: false,
      message: "Supabase is not configured, so employee PINs cannot be saved.",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      message: "You must be logged in to save employee PINs.",
    };
  }

  const pinHash = hashPin(pin);
  const { data: existingPins, error: selectError } = await supabase
    .from("employee_access_codes")
    .select("id")
    .eq("employee_id", employeeId)
    .eq("is_active", true)
    .limit(1)
    .returns<ActivePinRow[]>();

  if (selectError) {
    return { ok: false, message: selectError.message };
  }

  const existingPinId = existingPins?.[0]?.id;

  if (existingPinId) {
    const { error } = await supabase
      .from("employee_access_codes")
      .update({
        pin_hash: pinHash,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingPinId);

    if (error) {
      return { ok: false, message: error.message };
    }
  } else {
    const { error } = await supabase.from("employee_access_codes").insert({
      employee_id: employeeId,
      pin_hash: pinHash,
      is_active: true,
    });

    if (error) {
      return { ok: false, message: error.message };
    }
  }

  return { ok: true, message: "PIN saved." };
}

export async function validateEmployeePin(
  pin: string
): Promise<PinValidationResult> {
  const validationError = validateRequiredPin(pin);

  if (validationError) {
    return { ok: false, message: validationError };
  }

  const supabase = await createClient();

  if (!supabase) {
    return {
      ok: false,
      message: "Supabase is not configured, so PINs cannot be validated.",
    };
  }

  const { data: pinRows, error: pinError } = await supabase
    .from("employee_access_codes")
    .select("employee_id,pin_hash")
    .eq("is_active", true)
    .returns<ActivePinValidationRow[]>();

  if (pinError) {
    return { ok: false, message: "PIN validation is unavailable." };
  }

  const matchedPin = (pinRows ?? []).find((row) =>
    verifyPinForDevelopment(pin, row.pin_hash)
  );

  if (!matchedPin) {
    return { ok: false, message: "Invalid PIN" };
  }

  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("id,name,is_active")
    .eq("id", matchedPin.employee_id)
    .eq("is_active", true)
    .single<PinEmployeeRow>();

  if (employeeError || !employee) {
    return { ok: false, message: "Invalid PIN" };
  }

  return {
    ok: true,
    employee: {
      id: employee.id,
      name: employee.name,
    },
  };
}
