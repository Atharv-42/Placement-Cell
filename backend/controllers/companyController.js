const Company = require("../models/Company");

exports.createCompany = async (req, res) => {
  try {
    const company = await Company.create(req.body);

    res.status(201).json({
      success: true,
      data: company
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

exports.getCompanies = async (req, res) => {
  const companies = await Company.find();

  res.json({
    success: true,
    data: companies
  });
};

exports.getCompany = async (req, res) => {
  const company = await Company.findById(req.params.id);

  res.json({
    success: true,
    data: company
  });
};

exports.updateCompany = async (req, res) => {
  const company = await Company.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.json({
    success: true,
    data: company
  });
};

exports.deleteCompany = async (req, res) => {
  await Company.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: "Company Deleted"
  });
};