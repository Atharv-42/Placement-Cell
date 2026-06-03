const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student"
    },

    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job"
    },

    status: {
      type: String,
      enum: [
        "applied",
        "shortlisted",
        "selected",
        "rejected"
      ],
      default: "applied"
    },

    appliedDate: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "Application",
  applicationSchema
);
