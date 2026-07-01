const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

const normalizeExtractedText = (text = "") =>
  text
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

exports.extractResumeText = async (filePath) => {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === ".pdf") {
    const buffer = await fs.promises.readFile(filePath);
    const result = await pdfParse(buffer);
    return normalizeExtractedText(result.text || "");
  }

  if (extension === ".docx") {
    const result = await mammoth.extractRawText({ path: filePath });
    return normalizeExtractedText(result.value || "");
  }

  throw new Error("Unsupported resume format. Upload a PDF or DOCX file.");
};
