const mongoose = require("mongoose");

const resumeFileSchema = new mongoose.Schema(
  {
    filename: String,
    originalName: String,
    path: String,
    mimetype: String,
    size: Number,
    uploadedAt: Date
  },
  { _id: false }
);

const bulletRewriteSchema = new mongoose.Schema(
  {
    original: String,
    rewritten: String
  },
  { _id: false }
);

const resumeAnalysisSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      default: null
    },
    jobTitle: {
      type: String,
      default: "Custom Job Description"
    },
    companyName: {
      type: String,
      default: ""
    },
    jobDescription: {
      type: String,
      default: ""
    },
    resumeFile: resumeFileSchema,
    extractedText: {
      type: String,
      default: ""
    },
    atsScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    candidate: {
      name: String,
      email: String,
      phone: String
    },
    sections: {
      summary: String,
      skills: [String],
      education: [String],
      experience: [String],
      projects: [String]
    },
    matchedSkills: {
      type: [String],
      default: []
    },
    missingSkills: {
      type: [String],
      default: []
    },
    sectionFeedback: {
      summary: [String],
      skills: [String],
      education: [String],
      experience: [String],
      projects: [String]
    },
    atsImprovements: {
      type: [String],
      default: []
    },
    weakBullets: {
      type: [bulletRewriteSchema],
      default: []
    },
    recommendedKeywords: {
      type: [String],
      default: []
    },
    interviewQuestions: {
      type: [String],
      default: []
    },

    // Kept for older frontend/data compatibility while the UI migrates to ATS fields.
    extractedSkills: {
      type: [String],
      default: []
    },
    requiredSkills: {
      type: [String],
      default: []
    },
    matchPercentage: {
      type: Number,
      default: 0
    },
    suggestions: {
      type: [String],
      default: []
    },
    jobMatches: {
      type: [mongoose.Schema.Types.Mixed],
      default: []
    },
    analyzedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

resumeAnalysisSchema.index({ studentId: 1, analyzedAt: -1 });

module.exports = mongoose.model("ResumeAnalysis", resumeAnalysisSchema);
