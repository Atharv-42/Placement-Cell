const fs = require("fs");
const path = require("path");

const Student = require("../models/student");
const Application = require("../models/application");
const User = require("../models/user");

const normalizeSkills = (skills) => {
  if (Array.isArray(skills)) {
    return skills.map((skill) => skill.trim()).filter(Boolean);
  }

  if (typeof skills === "string") {
    return skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
  }

  return [];
};

const cleanPayload = (payload) =>
  Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );

const buildProfilePayload = (body) =>
  cleanPayload({
    name: body.name,
    email: body.email?.trim().toLowerCase(),
    phone: body.phone,
    department: body.department,
    skills: normalizeSkills(body.skills),
    cgpa: body.cgpa,
    passingYear: body.passingYear,
    address: body.address,
    socialLinks: cleanPayload({
      linkedin: body.linkedin || body.socialLinks?.linkedin,
      github: body.github || body.socialLinks?.github,
      portfolio: body.portfolio || body.socialLinks?.portfolio
    })
  });

const ensureStudent = async (user) => {
  const existing = await Student.findOne({
    $or: [{ userId: user._id }, { email: user.email }]
  });

  if (existing) {
    existing.userId = user._id;
    existing.name = user.name;
    existing.email = user.email;
    if (!Array.isArray(existing.skills)) {
      existing.skills = [];
    }
    await existing.save();
    return existing;
  }

  return Student.create({
    userId: user._id,
    name: user.name,
    email: user.email,
    skills: []
  });
};

const profilePhotoPayload = (file) => ({
  filename: file.filename,
  originalName: file.originalname,
  path: `/uploads/${file.filename}`,
  mimetype: file.mimetype
});

const resumePayload = (file) => ({
  filename: file.filename,
  originalName: file.originalname,
  path: `/uploads/${file.filename}`,
  mimetype: file.mimetype,
  uploadedAt: new Date()
});

const resolveFilePath = (entry) => {
  if (!entry?.path) {
    return null;
  }

  return path.join(__dirname, "..", entry.path.replace(/^\//, ""));
};

const safeUnlink = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

exports.createStudent = async (req, res) => {
  try {
    const payload = buildProfilePayload(req.body);
    const lookup = [];

    if (req.body.userId) {
      lookup.push({ userId: req.body.userId });
    }

    if (payload.email) {
      lookup.push({ email: payload.email });
    }

    const query = lookup.length > 1 ? { $or: lookup } : lookup[0] || { email: payload.email };
    const student = await Student.findOneAndUpdate(
      query,
      {
        $set: {
          ...payload,
          ...(req.body.userId ? { userId: req.body.userId } : {})
        },
        $setOnInsert: {
          skills: payload.skills || []
        }
      },
      { returnDocument: "after", upsert: true, runValidators: true }
    );

    res.status(201).json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getStudents = async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      cleanPayload(buildProfilePayload(req.body)),
      { returnDocument: "after" }
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Student deleted"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const student = await ensureStudent(user);

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const payload = buildProfilePayload(req.body);
    const student = await Student.findOneAndUpdate(
      { userId: req.user.id },
      {
        ...payload,
        userId: req.user.id
      },
      { returnDocument: "after", upsert: true }
    );

    if (user && payload.name) {
      user.name = payload.name;
      if (payload.email) {
        user.email = payload.email;
      }
      await user.save();
    }

    res.json({
      success: true,
      data: student,
      message: "Profile updated successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Profile photo file is required"
      });
    }

    const student = await Student.findOneAndUpdate(
      { userId: req.user.id },
      {
        profilePhoto: profilePhotoPayload(req.file)
      },
      { returnDocument: "after", upsert: true }
    );

    res.json({
      success: true,
      data: student,
      message: "Profile photo uploaded successfully"
    });
  } catch (error) {
    safeUnlink(req.file?.path);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Resume PDF is required"
      });
    }

    if (req.file.mimetype !== "application/pdf") {
      safeUnlink(req.file.path);
      return res.status(400).json({
        success: false,
        message: "Only PDF resumes are allowed"
      });
    }

    const student = await Student.findOneAndUpdate(
      { userId: req.user.id },
      {
        resume: resumePayload(req.file)
      },
      { returnDocument: "after", upsert: true }
    );

    res.json({
      success: true,
      data: student.resume,
      message: "Resume uploaded successfully"
    });
  } catch (error) {
    safeUnlink(req.file?.path);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.downloadResume = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });

    if (!student?.resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found"
      });
    }

    const resumePath = resolveFilePath(student.resume);

    if (!resumePath || !fs.existsSync(resumePath)) {
      return res.status(404).json({
        success: false,
        message: "Resume file not available"
      });
    }

    res.download(resumePath, student.resume.originalName || "resume.pdf");
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteResume = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });

    if (student?.resume?.path) {
      const resumePath = resolveFilePath(student.resume);
      safeUnlink(resumePath);
    }

    await Student.findOneAndUpdate(
      { userId: req.user.id },
      { $unset: { resume: 1 } },
      { returnDocument: "after" }
    );

    res.json({
      success: true,
      message: "Resume removed successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getMyApplications = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });

    if (!student) {
      return res.json({ success: true, data: [] });
    }

    const applications = await Application.find({ studentId: student._id })
      .populate({
        path: "jobId",
        populate: { path: "companyId" }
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: applications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
