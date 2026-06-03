const express = require("express");

const {
  createCompany,
  getCompanies,
  getCompany,
  updateCompany,
  deleteCompany
} = require("../controllers/companyController");

const router = express.Router();

router.post("/", createCompany);
router.get("/", getCompanies);
router.get("/:id", getCompany);
router.put("/:id", updateCompany);
router.delete("/:id", deleteCompany);

module.exports = router;