const express = require("express");

const {
  applyJob,
  getApplications,
  updateStatus
} = require("../controllers/applicationController");

const router = express.Router();

router.post("/", applyJob);
router.get("/", getApplications);
router.put("/:id", updateStatus);

module.exports = router;