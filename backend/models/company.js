const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
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

    email: String,

    website: String,

    sector: String,

    contactEmail: String,

    phone: String,

    location: String,

    logo: String,

    description: String,

    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Company", companySchema);