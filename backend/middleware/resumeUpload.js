const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

const uploadDir = path.join(__dirname, "..", "storage", "resume-analyzer");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const safeName = path.basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 50) || "resume";
    const uniqueSuffix = `${Date.now()}-${crypto.randomUUID()}`;
    cb(null, `${safeName}-${uniqueSuffix}${extension}`);
  }
});

const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();
  const allowedMimeTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ];
  const allowedExtensions = [".pdf", ".docx"];

  if (!allowedMimeTypes.includes(file.mimetype) && !allowedExtensions.includes(extension)) {
    return cb(new Error("Only PDF and DOCX files are allowed"));
  }

  cb(null, true);
};

module.exports = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});
