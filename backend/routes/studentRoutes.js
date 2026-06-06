const express = require("express");

const {
  createStudent,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  getMyProfile,
  updateMyProfile,
  uploadProfilePhoto,
  uploadResume,
  downloadResume,
  deleteResume,
  getMyApplications
} = require("../controllers/studentController");
const upload = require("../middleware/upload");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/me", authenticateToken, authorizeRoles("student"), getMyProfile);
router.put("/me", authenticateToken, authorizeRoles("student"), updateMyProfile);
router.post("/me/photo", authenticateToken, authorizeRoles("student"), upload.single("photo"), uploadProfilePhoto);
router.post("/me/resume", authenticateToken, authorizeRoles("student"), upload.single("resume"), uploadResume);
router.get("/me/resume", authenticateToken, authorizeRoles("student"), downloadResume);
router.delete("/me/resume", authenticateToken, authorizeRoles("student"), deleteResume);
router.get("/me/applications", authenticateToken, authorizeRoles("student"), getMyApplications);

router.post("/", authenticateToken, authorizeRoles("admin"), createStudent);
router.get("/", authenticateToken, authorizeRoles("admin"), getStudents);
router.get("/:id", authenticateToken, authorizeRoles("admin"), getStudent);
router.put("/:id", authenticateToken, authorizeRoles("admin"), updateStudent);
router.delete("/:id", authenticateToken, authorizeRoles("admin"), deleteStudent);

module.exports = router;
