const mongoose = require("mongoose");

const jobMatchSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true
    },
    title: String,
    companyName: String,
    requiredSkills: [String],
    matchedSkills: [String],
    missingSkills: [String],
    matchPercentage: Number
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
    resumeFile: {
      filename: String,
      originalName: String,
      path: String,
      mimetype: String,
      size: Number,
      uploadedAt: Date
    },
    extractedText: {
      type: String,
      default: ""
    },
    extractedSkills: {
      type: [String],
      default: []
    },
    requiredSkills: {
      type: [String],
      default: []
    },
    missingSkills: {
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
      type: [jobMatchSchema],
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
