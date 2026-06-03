const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      unique: true,
      required: true
    },

    skills: [String],

    cgpa: Number,

    resumeUrl: String
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Student", studentSchema);