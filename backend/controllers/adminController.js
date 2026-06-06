const Student = require("../models/student");
const Company = require("../models/company");
const Job = require("../models/job");
const Application = require("../models/application");

exports.getAdminStats = async (req, res) => {
  try {
    const [students, companies, jobs, applications] = await Promise.all([
      Student.countDocuments(),
      Company.countDocuments(),
      Job.countDocuments(),
      Application.countDocuments()
    ]);

    const activeJobs = await Job.countDocuments({ status: "active" });
    const shortlisted = await Application.countDocuments({ status: "Shortlisted" });
    const selected = await Application.countDocuments({ status: "Selected" });
    const rejected = await Application.countDocuments({ status: "Rejected" });

    const monthlyApplications = await Application.aggregate([
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" }
          },
          total: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const placementByCompanyRaw = await Application.aggregate([
      { $match: { status: "Selected" } },
      {
        $group: {
          _id: "$companyId",
          placements: { $sum: 1 }
        }
      },
      { $sort: { placements: -1 } },
      { $limit: 8 }
    ]);

    const companyLookup = await Company.find().select("name");
    const companyNames = companyLookup.reduce((accumulator, company) => {
      accumulator[company._id.toString()] = company.name;
      return accumulator;
    }, {});

    const latestJobs = await Job.find().sort({ createdAt: -1 }).limit(6);
    const latestApplications = await Application.find()
      .populate("studentId")
      .populate("jobId")
      .sort({ createdAt: -1 })
      .limit(6);

    res.json({
      success: true,
      data: {
        stats: {
          students,
          companies,
          jobs,
          applications,
          activeJobs,
          shortlisted,
          selected,
          rejected
        },
        charts: {
          monthlyApplications: monthlyApplications.map((item) => ({
            label: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
            total: item.total
          })),
          placementByCompany: placementByCompanyRaw.map((item) => ({
            label: companyNames[item._id.toString()] || "Company",
            total: item.placements
          }))
        },
        latestJobs,
        latestApplications
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getPlacementReport = async (req, res) => {
  try {
    const [students, companies, jobs, applications] = await Promise.all([
      Student.find().sort({ createdAt: -1 }),
      Company.find().sort({ createdAt: -1 }),
      Job.find().populate("companyId").sort({ createdAt: -1 }),
      Application.find()
        .populate("studentId")
        .populate("jobId")
        .populate("companyId")
        .sort({ createdAt: -1 })
    ]);

    const selectedApplications = applications.filter((application) => application.status === "Selected");

    res.json({
      success: true,
      data: {
        generatedAt: new Date(),
        summary: {
          students: students.length,
          companies: companies.length,
          jobs: jobs.length,
          applications: applications.length,
          selected: selectedApplications.length
        },
        students,
        companies,
        jobs,
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

exports.getManagementSnapshot = async (req, res) => {
  try {
    const [students, companies] = await Promise.all([
      Student.find().sort({ createdAt: -1 }),
      Company.find().sort({ createdAt: -1 })
    ]);

    res.json({
      success: true,
      data: {
        students,
        companies
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
