const Application = require("../models/application");

exports.applyJob = async (req, res) => {
  const application = await Application.create(req.body);

  res.status(201).json({
    success: true,
    data: application
  });
};

exports.getApplications = async (req, res) => {
  const applications = await Application.find()
    .populate("studentId")
    .populate("jobId");

  res.json({
    success: true,
    data: applications
  });
};

exports.updateStatus = async (req, res) => {
  const application = await Application.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.json({
    success: true,
    data: application
  });
};