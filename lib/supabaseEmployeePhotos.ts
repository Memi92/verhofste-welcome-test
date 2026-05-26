import { createClient } from "@/lib/supabase/server";

const EMPLOYEE_PHOTOS_BUCKET = "employee-photos";
const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const extensionByType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

type UploadEmployeePhotoResult =
  | {
      ok: true;
      publicUrl: string;
    }
  | {
      ok: false;
      message: string;
    };

export function getEmployeePhotoFile(formData: FormData) {
  const value = formData.get("photo");

  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  return value;
}

function getSafePhotoPath(file: File, employeeId?: string) {
  const extension = extensionByType[file.type] ?? "jpg";
  const safeId = employeeId?.replace(/[^a-zA-Z0-9_-]/g, "") || "new";
  const timestamp = Date.now();
  const randomSuffix = crypto.randomUUID().slice(0, 8);

  return `${safeId}/${timestamp}-${randomSuffix}.${extension}`;
}

export async function uploadEmployeePhoto(
  file: File,
  employeeId?: string
): Promise<UploadEmployeePhotoResult> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return {
      ok: false,
      message: "Employee photos must be JPEG, PNG, or WebP images.",
    };
  }

  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    return {
      ok: false,
      message: "Employee photos must be 2 MB or smaller.",
    };
  }

  const supabase = await createClient();

  if (!supabase) {
    return {
      ok: false,
      message: "Supabase is not configured, so employee photos cannot upload.",
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      message: "You must be logged in to upload employee photos.",
    };
  }

  const path = getSafePhotoPath(file, employeeId);
  const { error } = await supabase.storage
    .from(EMPLOYEE_PHOTOS_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    return {
      ok: false,
      message: `Employee photo upload failed: ${error.message}`,
    };
  }

  const { data } = supabase.storage
    .from(EMPLOYEE_PHOTOS_BUCKET)
    .getPublicUrl(path);

  return {
    ok: true,
    publicUrl: data.publicUrl,
  };
}
