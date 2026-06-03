const Job = require("../models/Job");

exports.createJob = async (req, res) => {
  const job = await Job.create(req.body);

  res.status(201).json({
    success: true,
    data: job
  });
};

exports.getJobs = async (req, res) => {
  const jobs = await Job.find().populate("companyId");

  res.json({
    success: true,
    data: jobs
  });
};

exports.getJob = async (req, res) => {
  const job = await Job.findById(req.params.id);

  res.json({
    success: true,
    data: job
  });
};

exports.updateJob = async (req, res) => {
  const job = await Job.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.json({
    success: true,
    data: job
  });
};

exports.deleteJob = async (req, res) => {
  await Job.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: "Job Deleted"
  });
};
