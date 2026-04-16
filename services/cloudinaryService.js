import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";

cloudinary.config({
  cloud_name: env.cloudinaryCloudName,
  api_key: env.cloudinaryApiKey,
  api_secret: env.cloudinaryApiSecret,
});

export const uploadToCloudinary = (buffer, originalName, resourceType, format) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder: "quiz-portal",
        use_filename: true,
        unique_filename: true,
        access_mode: "public",
        ...(format ? { format } : {}),
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

export const deleteFromCloudinary = async (publicId, resourceType) => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (_) {}
};
