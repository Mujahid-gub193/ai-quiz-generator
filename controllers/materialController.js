import { Material } from "../models/index.js";
import ApiError from "../utils/apiError.js";
import { saveFile, deleteFile } from "../services/storageService.js";

const formatMaterial = (material) => ({
  id: material.id,
  title: material.title,
  topic: material.topic,
  type: material.type,
  content: material.content,
  summary: material.summary,
  fileUrl: material.fileUrl,
  fileType: material.fileType,
  fileName: material.fileName,
  cloudinaryId: material.cloudinaryId,
  userId: material.userId,
  createdAt: material.createdAt,
  updatedAt: material.updatedAt,
});

const validateMaterialPayload = ({ title, topic, type }) => {
  if (!title || title.trim().length < 3)
    throw new ApiError(400, "Title must be at least 3 characters long.");
  if (!topic || topic.trim().length < 2)
    throw new ApiError(400, "Topic is required.");
  if (!["note", "course"].includes(type))
    throw new ApiError(400, "Type must be either note or course.");
};

export const createMaterial = async (req, res) => {
  const { title, topic, summary, fileLink } = req.body;
  const type = req.body.type || "note";
  const content = req.body.content || title; // content optional when file provided

  validateMaterialPayload({ title, topic, type });

  let fileUrl = null, fileType = "text", fileName = null, cloudinaryId = null;

  if (req.file) {
    const mime = req.file.mimetype;
    const isVideo = mime.startsWith("video/");
    fileType = isVideo ? "video" : "pdf";
    const { fileName: savedName, publicUrl } = await saveFile(req.file.buffer, req.file.originalname);
    fileUrl = publicUrl;
    fileName = req.file.originalname;
    cloudinaryId = savedName; // reuse field to store storage filename
  } else if (fileLink) {
    fileUrl = fileLink.trim();
    fileType = "link";
    fileName = fileLink.trim();
  }

  const material = await Material.create({
    title: title.trim(),
    topic: topic.trim(),
    type,
    content: content?.trim() || title.trim(),
    summary: summary?.trim() || null,
    fileUrl,
    fileType,
    fileName,
    cloudinaryId,
    userId: req.user.id,
  });

  res.status(201).json({ message: "Material created successfully.", material: formatMaterial(material) });
};

export const listMaterials = async (req, res) => {
  const where = req.user.role === "student" ? {} : { userId: req.user.id };
  const materials = await Material.findAll({ where, order: [["createdAt", "DESC"]] });
  res.json({ count: materials.length, materials: materials.map(formatMaterial) });
};

export const getMaterialById = async (req, res) => {
  const material = await Material.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!material) throw new ApiError(404, "Material not found.");
  res.json({ material: formatMaterial(material) });
};

export const updateMaterial = async (req, res) => {
  const material = await Material.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!material) throw new ApiError(404, "Material not found.");

  const nextValues = {
    title: req.body.title ?? material.title,
    topic: req.body.topic ?? material.topic,
    type: req.body.type ?? material.type,
    content: req.body.content ?? material.content,
    summary: req.body.summary ?? material.summary,
  };

  validateMaterialPayload(nextValues);
  await material.update({
    title: nextValues.title.trim(),
    topic: nextValues.topic.trim(),
    type: nextValues.type,
    content: nextValues.content.trim(),
    summary: nextValues.summary?.trim() || null,
  });

  res.json({ message: "Material updated successfully.", material: formatMaterial(material) });
};

export const deleteMaterial = async (req, res) => {
  const material = await Material.findOne({ where: { id: req.params.id, userId: req.user.id } });
  if (!material) throw new ApiError(404, "Material not found.");

  if (material.cloudinaryId) {
    await deleteFile(material.cloudinaryId);
  }

  await material.destroy();
  res.json({ message: "Material deleted successfully." });
};
