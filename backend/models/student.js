const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      sparse: true
    },

    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      unique: true,
      required: true
    },

    phone: String,

    department: String,

    skills: [String],

    cgpa: Number,

    passingYear: Number,

    address: String,

    socialLinks: {
      linkedin: String,
      github: String,
      portfolio: String
    },

    profilePhoto: {
      filename: String,
      originalName: String,
      path: String,
      mimetype: String
    },

    resume: {
      filename: String,
      originalName: String,
      path: String,
      mimetype: String,
      uploadedAt: Date
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Student", studentSchema);