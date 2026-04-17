import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";
import crypto from "crypto";
import path from "path";

const supabase = createClient(env.supabaseUrl, env.supabaseServiceKey);
const BUCKET = "uploads";

const MIME_TYPES = {
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export const saveFile = async (buffer, originalName) => {
  const ext = path.extname(originalName).toLowerCase();
  const fileName = crypto.randomBytes(16).toString("hex") + ext;
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, buffer, { contentType, upsert: false });

  if (error) throw new Error(`Supabase upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return { fileName, publicUrl: data.publicUrl };
};

export const deleteFile = async (fileName) => {
  if (!fileName) return;
  await supabase.storage.from(BUCKET).remove([fileName]);
};
