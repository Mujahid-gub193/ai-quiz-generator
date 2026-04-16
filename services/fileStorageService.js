import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, "../uploads");

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

export const saveFileLocally = (buffer, originalName) => {
  const ext = path.extname(originalName);
  const fileName = crypto.randomBytes(16).toString("hex") + ext;
  const filePath = path.join(UPLOADS_DIR, fileName);
  fs.writeFileSync(filePath, buffer);
  return { fileName, filePath };
};

export const deleteFileLocally = (fileName) => {
  try {
    const filePath = path.join(UPLOADS_DIR, fileName);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (_) {}
};
