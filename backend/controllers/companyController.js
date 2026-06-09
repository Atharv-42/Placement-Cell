const Company = require("../models/company");
const Job = require("../models/job");
const Application = require("../models/application");
const User = require("../models/user");

const cleanPayload = (payload) =>
  Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );

const buildCompanyPayload = (body) =>
  cleanPayload({
    name: body.name,
    email: body.email?.trim().toLowerCase(),
    website: body.website,
    sector: body.sector,
    contactEmail: body.contactEmail,
    phone: body.phone,
    location: body.location,
    logo: body.logo,
    description: body.description,
    active: body.active !== undefined ? body.active === true || body.active === "true" : undefined
  });

const ensureCompany = async (user) => {
  const existing = await Company.findOne({ userId: user._id });

  if (existing) {
    return existing;
  }

  return Company.create({
    userId: user._id,
    name: user.name,
    email: user.email,
    active: true
  });
};

exports.createCompany = async (req, res) => {
  try {
    const company = await Company.create({
      ...buildCompanyPayload(req.body),
      userId: req.body.userId || undefined
    });

    res.status(201).json({
      success: true,
      data: company
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getCompanies = async (req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: companies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found"
      });
    }

    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      buildCompanyPayload(req.body),
      { returnDocument: "after" }
    );

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "Company not found"
      });
    }

    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteCompany = async (req, res) => {
  try {
    await Company.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Company deleted"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getMyCompany = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const company = await ensureCompany(user);

    res.json({
      success: true,
      data: company
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateMyCompany = async (req, res) => {
  try {
    const company = await Company.findOneAndUpdate(
      { userId: req.user.id },
      {
        ...buildCompanyPayload(req.body),
        userId: req.user.id
      },
      { returnDocument: "after", upsert: true }
    );

    res.json({
      success: true,
      data: company,
      message: "Company profile updated successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getCompanyDashboard = async (req, res) => {
  try {
    const company = await Company.findOne({ userId: req.user.id });

    if (!company) {
      return res.json({
        success: true,
        data: {
          company: null,
          jobs: [],
          applications: [],
          metrics: {
            totalJobs: 0,
            activeJobs: 0,
            applicationsReceived: 0,
            shortlistedCandidates: 0,
            selectedCandidates: 0,
            inactiveJobs: 0
          }
        }
      });
    }

    const jobs = await Job.find({ companyId: company._id }).sort({ createdAt: -1 });
    const jobIds = jobs.map((job) => job._id);
    const applications = await Application.find({ jobId: { $in: jobIds } })
      .populate("studentId")
      .populate("jobId")
      .sort({ createdAt: -1 });

    const metrics = {
      totalJobs: jobs.length,
      activeJobs: jobs.filter((job) => job.status === "active").length,
      inactiveJobs: jobs.filter((job) => job.status === "inactive").length,
      applicationsReceived: applications.length,
      shortlistedCandidates: applications.filter((application) => application.status === "Shortlisted").length,
      selectedCandidates: applications.filter((application) => application.status === "Selected").length
    };

    res.json({
      success: true,
      data: { company, jobs, applications, metrics }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
