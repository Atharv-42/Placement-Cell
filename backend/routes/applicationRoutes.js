const express = require("express");

const {
  applyJob,
  getApplications,
  updateStatus,
  getMyApplications,
  getCompanyApplications
} = require("../controllers/applicationController");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

router.post("/", authenticateToken, authorizeRoles("student"), applyJob);
router.get("/me", authenticateToken, authorizeRoles("student"), getMyApplications);
router.get("/company", authenticateToken, authorizeRoles("company"), getCompanyApplications);
router.get("/", authenticateToken, authorizeRoles("admin"), getApplications);
router.put("/:id", authenticateToken, authorizeRoles("company", "admin"), updateStatus);

module.exports = router;
