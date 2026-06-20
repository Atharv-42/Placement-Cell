const express = require("express");

const {
  uploadResume,
  analyzeResume,
  getLatestAnalysis,
  getAnalysisHistory
} = require("../controllers/resumeAnalyzerController");
const resumeUpload = require("../middleware/resumeUpload");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

const runUpload = (fieldName) => (req, res, next) => {
  const handler = resumeUpload.single(fieldName);

  handler(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (req.file?.path) {
      try {
        require("fs").unlinkSync(req.file.path);
      } catch {
        // Ignore cleanup failures.
      }
    }

    return res.status(400).json({
      success: false,
      message: error.message || "Invalid file upload"
    });
  });
};

router.post(
  "/upload",
  authenticateToken,
  authorizeRoles("student"),
  runUpload("resume"),
  uploadResume
);

router.post(
  "/analyze",
  authenticateToken,
  authorizeRoles("student"),
  runUpload("resume"),
  analyzeResume
);

router.get("/latest", authenticateToken, authorizeRoles("student"), getLatestAnalysis);
router.get("/history", authenticateToken, authorizeRoles("student"), getAnalysisHistory);

module.exports = router;
