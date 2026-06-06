const express = require("express");

const {
  createCompany,
  getCompanies,
  getCompany,
  updateCompany,
  deleteCompany,
  getMyCompany,
  updateMyCompany,
  getCompanyDashboard
} = require("../controllers/companyController");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/me", authenticateToken, authorizeRoles("company"), getMyCompany);
router.put("/me", authenticateToken, authorizeRoles("company"), updateMyCompany);
router.get("/dashboard", authenticateToken, authorizeRoles("company"), getCompanyDashboard);

router.post("/", authenticateToken, authorizeRoles("admin"), createCompany);
router.get("/", authenticateToken, authorizeRoles("admin"), getCompanies);
router.get("/:id", authenticateToken, authorizeRoles("admin"), getCompany);
router.put("/:id", authenticateToken, authorizeRoles("admin"), updateCompany);
router.delete("/:id", authenticateToken, authorizeRoles("admin"), deleteCompany);

module.exports = router;
