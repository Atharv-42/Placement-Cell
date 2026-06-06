const Application = require("../models/application");
const Student = require("../models/student");
const Job = require("../models/job");
const Company = require("../models/company");

const getCompanyForUser = async (userId) => Company.findOne({ userId });

exports.applyJob = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found"
      });
    }

    const { jobId, notes } = req.body;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: "Job id is required"
      });
    }

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found"
      });
    }

    if (job.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "This job is currently inactive"
      });
    }

    const existingApplication = await Application.findOne({
      studentId: student._id,
      jobId
    });

    if (existingApplication) {
      return res.status(409).json({
        success: false,
        message: "You have already applied for this job"
      });
    }

    const application = await Application.create({
      studentId: student._id,
      jobId,
      companyId: job.companyId,
      notes,
      updatedBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: application,
      message: "Job application submitted"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getApplications = async (req, res) => {
  try {
    const applications = await Application.find()
      .populate("studentId")
      .populate("jobId")
      .populate("companyId")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: applications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getMyApplications = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });

    if (!student) {
      return res.json({
        success: true,
        data: []
      });
    }

    const applications = await Application.find({ studentId: student._id })
      .populate({
        path: "jobId",
        populate: { path: "companyId" }
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: applications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getCompanyApplications = async (req, res) => {
  try {
    const company = await getCompanyForUser(req.user.id);

    if (!company) {
      return res.json({
        success: true,
        data: []
      });
    }

    const applications = await Application.find({ companyId: company._id })
      .populate("studentId")
      .populate({
        path: "jobId",
        populate: { path: "companyId" }
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: applications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id).populate("jobId");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found"
      });
    }

    if (req.user.role !== "admin") {
      const company = await getCompanyForUser(req.user.id);

      if (!company || application.companyId?.toString() !== company._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "You are not allowed to update this application"
        });
      }
    }

    const { status, notes, interviewDate } = req.body;

    if (status) {
      application.status = status;
    }

    if (notes !== undefined) {
      application.notes = notes;
    }

    if (interviewDate !== undefined) {
      application.interviewDate = interviewDate || null;
    }

    application.updatedBy = req.user.id;
    await application.save();

    res.json({
      success: true,
      data: application,
      message: "Application status updated"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
