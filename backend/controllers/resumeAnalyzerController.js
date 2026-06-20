const fs = require("fs");
const path = require("path");

const Job = require("../models/job");
const Student = require("../models/student");
const ResumeAnalysis = require("../models/resumeAnalysis");
const { analyzeResume } = require("../utils/resumeAnalyzer");

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

const normalizeAnalysis = (analysis, student, file) => ({
  resumeFile: file ? buildResumePayload(file) : student.resume,
  extractedText: analysis.extractedText,
  extractedSkills: analysis.extractedSkills,
  requiredSkills: analysis.requiredSkills,
  missingSkills: analysis.missingSkills,
  matchPercentage: analysis.matchPercentage,
  suggestions: analysis.suggestions,
  jobMatches: analysis.jobMatches,
  analyzedAt: new Date()
});

exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Resume PDF is required"
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
        message: "Upload a PDF resume before analyzing it"
      });
    }

    const jobs = await Job.find({ status: "active" }).sort({ createdAt: -1 });
    const analysis = await analyzeResume({
      filePath,
      jobs
    });

    const storedAnalysis = await ResumeAnalysis.findOneAndUpdate(
      { studentId: student._id },
      {
        $set: normalizeAnalysis(analysis, student, req.file ? req.file : null),
        $setOnInsert: {
          studentId: student._id
        }
      },
      {
        upsert: true,
        returnDocument: "after",
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: {
        ...storedAnalysis.toObject(),
        resumeFile: storedAnalysis.resumeFile || resumePayload,
        jobCount: jobs.length
      },
      message: "Resume analyzed successfully"
    });
  } catch (error) {
    safeUnlink(req.file?.path);
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
