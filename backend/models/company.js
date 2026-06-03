const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    website: String,

    sector: String,

    contactEmail: String
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Company", companySchema);