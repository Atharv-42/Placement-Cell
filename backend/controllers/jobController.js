const Job = require("../models/job");
const Company = require("../models/company");
const Application = require("../models/application");
const Student = require("../models/student");

const normalizeSkills = (skills) => {
  if (Array.isArray(skills)) {
    return skills.map((skill) => skill.trim()).filter(Boolean);
  }

  if (typeof skills === "string") {
    return skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
  }

  return [];
};

const cleanPayload = (payload) =>
  Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );

const buildJobPayload = (body) =>
  cleanPayload({
    title: body.title,
    role: body.role,
    description: body.description,
    companyId: body.companyId,
    companyName: body.companyName,
    companyLogo: body.companyLogo,
    location: body.location,
    package: body.package,
    packageText: body.packageText,
    eligibility: body.eligibility,
    skills: normalizeSkills(body.skills),
    deadline: body.deadline,
    status: body.status || "active"
  });

const getCompanyForUser = async (userId) => Company.findOne({ userId });

const canManageJob = (req, job, company) => {
  if (!req.user) {
    return false;
  }

  if (req.user.role === "admin") {
    return true;
  }

  if (req.user.role !== "company" || !company) {
    return false;
  }

  return job.companyId.toString() === company._id.toString();
};

exports.createJob = async (req, res) => {
  try {
    const payload = buildJobPayload(req.body);
    const company = req.user?.role === "company" ? await getCompanyForUser(req.user.id) : null;

    if (req.user?.role === "company" && !company) {
      return res.status(404).json({
        success: false,
        message: "Company profile not found"
      });
    }

    if (company) {
      payload.companyId = company._id;
      payload.companyName = company.name;
      payload.companyLogo = company.logo;
    }

    const job = await Job.create(payload);

    res.status(201).json({
      success: true,
      data: job
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getJobs = async (req, res) => {
  try {
    const {
      search,
      company,
      location,
      packageMin,
      packageMax,
      skills,
      status,
      active
    } = req.query;

    const filter = {};
    const isCompany = req.user?.role === "company";
    const isAdmin = req.user?.role === "admin";

    if (company) {
      filter.companyId = company;
    }

    if (location) {
      filter.location = { $regex: location, $options: "i" };
    }

    if (status) {
      filter.status = status;
    } else if (!isCompany && !isAdmin) {
      filter.status = "active";
    }

    if (active !== undefined) {
      filter.status = active === "true" ? "active" : "inactive";
    }

    if (packageMin || packageMax) {
      filter.package = {};
      if (packageMin) {
        filter.package.$gte = Number(packageMin);
      }
      if (packageMax) {
        filter.package.$lte = Number(packageMax);
      }
    }

    if (skills) {
      const skillList = skills.split(",").map((skill) => skill.trim()).filter(Boolean);
      filter.skills = { $in: skillList };
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { role: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { companyName: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } }
      ];
    }

    if (isCompany && req.user?.id) {
      const companyProfile = await getCompanyForUser(req.user.id);
      if (companyProfile) {
        filter.companyId = companyProfile._id;
      }
    }

    const jobs = await Job.find(filter)
      .populate("companyId")
      .sort({ createdAt: -1 });

    const jobIds = jobs.map((job) => job._id);
    const applicationCounts = await Application.aggregate([
      { $match: { jobId: { $in: jobIds } } },
      { $group: { _id: "$jobId", total: { $sum: 1 } } }
    ]);

    const applicationCountMap = applicationCounts.reduce((accumulator, entry) => {
      accumulator[entry._id.toString()] = entry.total;
      return accumulator;
    }, {});

    const payload = jobs.map((job) => ({
      ...job.toObject(),
      applicationsCount: applicationCountMap[job._id.toString()] || 0
    }));

    res.json({
      success: true,
      data: payload
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate("companyId");

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found"
      });
    }

    const applications = await Application.find({ jobId: job._id })
      .populate("studentId")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        ...job.toObject(),
        applications
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found"
      });
    }

    const company = req.user?.role === "company" ? await getCompanyForUser(req.user.id) : null;

    if (!canManageJob(req, job, company)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to manage this job"
      });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      buildJobPayload(req.body),
      { returnDocument: "after" }
    );

    res.json({
      success: true,
      data: updatedJob
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.toggleJobStatus = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found"
      });
    }

    const company = req.user?.role === "company" ? await getCompanyForUser(req.user.id) : null;

    if (!canManageJob(req, job, company)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to manage this job"
      });
    }

    job.status = job.status === "active" ? "inactive" : "active";
    await job.save();

    res.json({
      success: true,
      data: job,
      message: `Job ${job.status === "active" ? "activated" : "deactivated"}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found"
      });
    }

    const company = req.user?.role === "company" ? await getCompanyForUser(req.user.id) : null;

    if (!canManageJob(req, job, company)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this job"
      });
    }

    await Job.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Job deleted"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getMyJobs = async (req, res) => {
  try {
    const company = await getCompanyForUser(req.user.id);

    if (!company) {
      return res.json({ success: true, data: [] });
    }

    const jobs = await Job.find({ companyId: company._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: jobs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getJobApplicants = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found"
      });
    }

    const company = req.user?.role === "company" ? await getCompanyForUser(req.user.id) : null;

    if (!canManageJob(req, job, company)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to view applicants for this job"
      });
    }

    const applications = await Application.find({ jobId: job._id })
      .populate("studentId")
      .populate("jobId")
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

exports.getCompanyAnalytics = async (req, res) => {
  try {
    const company = await getCompanyForUser(req.user.id);

    if (!company) {
      return res.json({
        success: true,
        data: {
          jobs: [],
          counts: {
            totalJobs: 0,
            activeJobs: 0,
            inactiveJobs: 0,
            applications: 0,
            shortlisted: 0,
            selected: 0
          }
        }
      });
    }

    const jobs = await Job.find({ companyId: company._id });
    const jobIds = jobs.map((job) => job._id);
    const applications = await Application.find({ jobId: { $in: jobIds } });

    const counts = {
      totalJobs: jobs.length,
      activeJobs: jobs.filter((job) => job.status === "active").length,
      inactiveJobs: jobs.filter((job) => job.status === "inactive").length,
      applications: applications.length,
      shortlisted: applications.filter((item) => item.status === "Shortlisted").length,
      selected: applications.filter((item) => item.status === "Selected").length
    };

    const byMonth = jobs.reduce((accumulator, job) => {
      const month = new Date(job.createdAt).toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit"
      });
      accumulator[month] = (accumulator[month] || 0) + 1;
      return accumulator;
    }, {});

    res.json({
      success: true,
      data: {
        jobs,
        counts,
        byMonth
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
