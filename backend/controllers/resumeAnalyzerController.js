const fs = require("fs");
const path = require("path");

const Job = require("../models/job");
const Student = require("../models/student");
const ResumeAnalysis = require("../models/resumeAnalysis");
const { extractResumeText } = require("../services/resumeParserService");
const { analyzeResumeWithAI } = require("../services/aiResumeAnalyzerService");

const resolveStoredPath = (filePath) => {
  if (!filePath) {
    return null;
  }

  return path.isAbsolute(filePath) ? filePath : path.join(__dirname, "..", filePath);
};

const safeUnlink = (filePath) => {
  const resolved = resolveStoredPath(filePath);
  if (resolved && fs.existsSync(resolved)) {
    fs.unlinkSync(resolved);
  }
};

const buildResumePayload = (file) => ({
  filename: file.filename,
  originalName: file.originalname,
  path: path.relative(path.join(__dirname, ".."), file.path).replace(/\\/g, "/"),
  mimetype: file.mimetype,
  size: file.size,
  uploadedAt: new Date()
});

const ensureStudentRecord = async (user) => {
  const student = await Student.findOne({ userId: user.id });

  if (!student) {
    return Student.create({
      userId: user.id,
      name: user.name,
      email: user.email,
      skills: []
    });
  }

  return student;
};

const buildJobDescription = (job) => {
  if (!job) {
    return "";
  }

  return [
    `Role: ${job.title || job.role || ""}`,
    `Company: ${job.companyName || ""}`,
    `Location: ${job.location || ""}`,
    `Description: ${job.description || ""}`,
    `Eligibility: ${job.eligibility || ""}`,
    `Required skills: ${(job.skills || []).join(", ")}`
  ]
    .filter((line) => line.replace(/^[^:]+:\s*/, "").trim())
    .join("\n");
};

exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Resume PDF or DOCX is required"
      });
    }

    const student = await ensureStudentRecord(req.user);
    const resumePayload = buildResumePayload(req.file);
    const previousResumePath = student?.resume?.path || null;

    student.resume = resumePayload;
    await student.save();

    if (previousResumePath && previousResumePath !== resumePayload.path) {
      safeUnlink(previousResumePath);
    }

    res.status(201).json({
      success: true,
      data: resumePayload,
      message: "Resume uploaded securely"
    });
  } catch (error) {
    safeUnlink(req.file?.path);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.analyzeResume = async (req, res) => {
  try {
    let student = await ensureStudentRecord(req.user);
    let filePath = null;
    let resumePayload = student.resume || null;
    let previousResumePath = student?.resume?.path || null;

    if (req.file) {
      const nextResumePayload = buildResumePayload(req.file);
      student.resume = nextResumePayload;
      await student.save();
      if (previousResumePath && previousResumePath !== nextResumePayload.path) {
        safeUnlink(previousResumePath);
      }
      resumePayload = nextResumePayload;
      filePath = req.file.path;
    } else if (student.resume?.path) {
      filePath = resolveStoredPath(student.resume.path);
    }

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "Upload a PDF or DOCX resume before analyzing it"
      });
    }

    const selectedJob = req.body.jobId ? await Job.findById(req.body.jobId) : null;
    const jobDescription = selectedJob
      ? buildJobDescription(selectedJob)
      : (req.body.jobDescription || "").trim();

    if (req.body.jobId && !selectedJob) {
      return res.status(404).json({
        success: false,
        message: "Selected job was not found"
      });
    }

    if (!jobDescription) {
      return res.status(400).json({
        success: false,
        message: "Select a job or paste a job description before analyzing"
      });
    }

    const extractedText = await extractResumeText(filePath);

    if (!extractedText) {
      return res.status(400).json({
        success: false,
        message: "Could not extract readable text from this resume"
      });
    }

    const aiAnalysis = await analyzeResumeWithAI({
      resumeText: extractedText,
      jobDescription
    });

    const storedAnalysis = await ResumeAnalysis.create({
      studentId: student._id,
      jobId: selectedJob?._id || null,
      jobTitle: selectedJob?.title || req.body.jobTitle || "Custom Job Description",
      companyName: selectedJob?.companyName || "",
      jobDescription,
      resumeFile: req.file ? buildResumePayload(req.file) : student.resume,
      extractedText,
      atsScore: aiAnalysis.atsScore,
      candidate: aiAnalysis.candidate,
      sections: aiAnalysis.sections,
      matchedSkills: aiAnalysis.matchedSkills,
      missingSkills: aiAnalysis.missingSkills,
      sectionFeedback: aiAnalysis.sectionFeedback,
      atsImprovements: aiAnalysis.atsImprovements,
      weakBullets: aiAnalysis.weakBullets,
      recommendedKeywords: aiAnalysis.recommendedKeywords,
      interviewQuestions: aiAnalysis.interviewQuestions,
      extractedSkills: aiAnalysis.sections.skills,
      requiredSkills: [...new Set([...aiAnalysis.matchedSkills, ...aiAnalysis.missingSkills])],
      matchPercentage: aiAnalysis.atsScore,
      suggestions: aiAnalysis.atsImprovements,
      analyzedAt: new Date()
    });

    res.status(200).json({
      success: true,
      data: {
        ...storedAnalysis.toObject(),
        resumeFile: storedAnalysis.resumeFile || resumePayload,
        jobCount: selectedJob ? 1 : 0
      },
      message: "AI resume analysis completed successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getLatestAnalysis = async (req, res) => {
  try {
    const student = await ensureStudentRecord(req.user);
    const analysis = await ResumeAnalysis.findOne({ studentId: student._id }).sort({
      analyzedAt: -1,
      createdAt: -1
    });

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: "No resume analysis found"
      });
    }

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAnalysisHistory = async (req, res) => {
  try {
    const student = await ensureStudentRecord(req.user);
    const history = await ResumeAnalysis.find({ studentId: student._id })
      .sort({ analyzedAt: -1, createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
