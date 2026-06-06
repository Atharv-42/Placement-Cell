const express = require("express");

const {
  getAdminStats,
  getPlacementReport,
  getManagementSnapshot
} = require("../controllers/adminController");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/stats", authenticateToken, authorizeRoles("admin"), getAdminStats);
router.get("/reports/placement", authenticateToken, authorizeRoles("admin"), getPlacementReport);
router.get("/snapshot", authenticateToken, authorizeRoles("admin"), getManagementSnapshot);

module.exports = router;
