const express = require("express");

const {
  createJob,
  getJobs,
  getJob,
  updateJob,
  deleteJob,
  toggleJobStatus,
  getMyJobs,
  getJobApplicants,
  getCompanyAnalytics
} = require("../controllers/jobController");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/my/jobs", authenticateToken, authorizeRoles("company"), getMyJobs);
router.get("/my/analytics", authenticateToken, authorizeRoles("company"), getCompanyAnalytics);
router.get("/:id/applicants", authenticateToken, authorizeRoles("company", "admin"), getJobApplicants);
router.patch("/:id/toggle", authenticateToken, authorizeRoles("company", "admin"), toggleJobStatus);

router.get("/", authenticateToken, getJobs);
router.post("/", authenticateToken, authorizeRoles("company", "admin"), createJob);
router.get("/:id", authenticateToken, getJob);
router.put("/:id", authenticateToken, authorizeRoles("company", "admin"), updateJob);
router.delete("/:id", authenticateToken, authorizeRoles("company", "admin"), deleteJob);

module.exports = router;
