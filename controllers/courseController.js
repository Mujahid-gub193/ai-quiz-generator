import { Chapter, Course, Enrollment, Lesson, User } from "../models/index.js";
import ApiError from "../utils/apiError.js";
import { saveFile, deleteFile } from "../services/storageService.js";

const courseIncludes = [
  { model: User, as: "teacher", attributes: ["id", "name", "email"] },
  {
    model: Chapter, as: "chapters",
    include: [{ model: Lesson, as: "lessons" }],
  },
];

// PUBLIC — list published courses
export const listCourses = async (req, res) => {
  const courses = await Course.findAll({
    where: { published: true },
    include: [
      { model: User, as: "teacher", attributes: ["id", "name"] },
      { model: Chapter, as: "chapters", include: [{ model: Lesson, as: "lessons", attributes: ["id", "title", "duration", "freePreview", "type"] }] },
    ],
    order: [["createdAt", "DESC"]],
  });
  res.json({ count: courses.length, courses });
};

// PUBLIC — get single course (syllabus visible, content locked)
export const getCourse = async (req, res) => {
  const course = await Course.findOne({
    where: { id: req.params.id, published: true },
    include: [
      { model: User, as: "teacher", attributes: ["id", "name"] },
      {
        model: Chapter, as: "chapters",
        include: [{ model: Lesson, as: "lessons", attributes: ["id", "title", "duration", "freePreview", "type", "content", "videoUrl"] }],
      },
    ],
  });
  if (!course) throw new ApiError(404, "Course not found.");
  res.json({ course });
};

// TEACHER — list own courses
export const listMyCourses = async (req, res) => {
  const courses = await Course.findAll({
    where: { teacherId: req.user.id },
    include: courseIncludes,
    order: [["createdAt", "DESC"]],
  });
  res.json({ courses });
};

// TEACHER — create course
export const createCourse = async (req, res) => {
  const { title, description, price, currency, isFree, level, category } = req.body;
  if (!title || !description) throw new ApiError(400, "Title and description required.");

  let thumbnail = null;
  if (req.file) {
    const { publicUrl } = await saveFile(req.file.buffer, req.file.originalname);
    thumbnail = publicUrl;
  }

  const isFreeVal = isFree === "1" || isFree === true || isFree === "true";
  const course = await Course.create({
    title, description,
    price: isFreeVal ? 0 : (parseFloat(price) || 0),
    currency: currency || "USD",
    isFree: isFreeVal,
    level: level || "beginner", category, thumbnail,
    teacherId: req.user.id, published: false,
  });
  res.status(201).json({ course });
};

// TEACHER — update course
export const updateCourse = async (req, res) => {
  const course = await Course.findOne({ where: { id: req.params.id, teacherId: req.user.id } });
  if (!course) throw new ApiError(404, "Course not found.");

  let thumbnail = course.thumbnail;
  if (req.file) {
    const { publicUrl } = await saveFile(req.file.buffer, req.file.originalname);
    thumbnail = publicUrl;
  }

  const { title, description, price, currency, isFree, level, category, published } = req.body;
  const isFreeVal = isFree === "1" || isFree === true || isFree === "true";
  await course.update({
    title: title ?? course.title,
    description: description ?? course.description,
    price: isFree !== undefined ? (isFreeVal ? 0 : (parseFloat(price) || course.price)) : course.price,
    currency: currency ?? course.currency,
    isFree: isFree !== undefined ? isFreeVal : course.isFree,
    level: level ?? course.level,
    category: category ?? course.category,
    published: published !== undefined ? !!published : course.published,
    thumbnail,
  });
  res.json({ course });
};

// TEACHER — delete course
export const deleteCourse = async (req, res) => {
  const course = await Course.findOne({ where: { id: req.params.id, teacherId: req.user.id } });
  if (!course) throw new ApiError(404, "Course not found.");
  await course.destroy();
  res.json({ message: "Course deleted." });
};

// TEACHER — add chapter
export const addChapter = async (req, res) => {
  const course = await Course.findOne({ where: { id: req.params.courseId, teacherId: req.user.id } });
  if (!course) throw new ApiError(404, "Course not found.");
  const count = await Chapter.count({ where: { courseId: course.id } });
  const chapter = await Chapter.create({ title: req.body.title, courseId: course.id, order: count });
  res.status(201).json({ chapter });
};

// TEACHER — delete chapter
export const deleteChapter = async (req, res) => {
  const chapter = await Chapter.findByPk(req.params.chapterId);
  if (!chapter) throw new ApiError(404, "Chapter not found.");
  await chapter.destroy();
  res.json({ message: "Chapter deleted." });
};

// TEACHER — add lesson
export const addLesson = async (req, res) => {
  const chapter = await Chapter.findByPk(req.params.chapterId);
  if (!chapter) throw new ApiError(404, "Chapter not found.");

  const { title, type, content, freePreview, duration } = req.body;
  const count = await Lesson.count({ where: { chapterId: chapter.id } });

  let videoUrl = null, fileName = null;
  if (req.file) {
    const { publicUrl, fileName: savedName } = await saveFile(req.file.buffer, req.file.originalname);
    videoUrl = publicUrl;
    fileName = req.file.originalname;
  }

  const lesson = await Lesson.create({
    title, type: type || "video", content, videoUrl, fileName,
    freePreview: freePreview === "1" || freePreview === true, duration: duration || null,
    chapterId: chapter.id, order: count,
  });
  res.status(201).json({ lesson });
};

// TEACHER — delete lesson
export const deleteLesson = async (req, res) => {
  const lesson = await Lesson.findByPk(req.params.lessonId);
  if (!lesson) throw new ApiError(404, "Lesson not found.");
  if (lesson.fileName) await deleteFile(lesson.fileName);
  await lesson.destroy();
  res.json({ message: "Lesson deleted." });
};

// ADMIN — list all courses
export const adminListCourses = async (req, res) => {
  const courses = await Course.findAll({
    include: [{ model: User, as: "teacher", attributes: ["id", "name", "email"] }],
    order: [["createdAt", "DESC"]],
  });
  res.json({ courses });
};

// ADMIN — delete any course
export const adminDeleteCourse = async (req, res) => {
  const course = await Course.findByPk(req.params.id);
  if (!course) throw new ApiError(404, "Course not found.");
  await course.destroy();
  res.json({ message: "Course deleted." });
};

// ADMIN — toggle published
export const adminTogglePublish = async (req, res) => {
  const course = await Course.findByPk(req.params.id);
  if (!course) throw new ApiError(404, "Course not found.");
  await course.update({ published: !course.published });
  res.json({ course });
};
