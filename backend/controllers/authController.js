const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const User = require("../models/user");
const Student = require("../models/student");
const Company = require("../models/company");
const { sendVerificationEmail } = require("../utils/email");

const JWT_SECRET = process.env.JWT_SECRET || "placement-cell-portal-secret";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const VALID_ROLES = ["student", "company", "admin"];
const GMAIL_REGEX = /^[a-z0-9](?:[a-z0-9.+_-]*[a-z0-9])?@gmail\.com$/;

const signToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isEmailVerified: user.isEmailVerified !== false
});

const createVerificationToken = () => {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  return { token, tokenHash, expires };
};

const sendUserVerificationEmail = async (user, token) => {
  const verificationUrl = `${FRONTEND_URL}/verify-email?token=${token}`;

  return sendVerificationEmail({
    to: user.email,
    name: user.name,
    verificationUrl
  });
};

const getEmailWarningMessage = (error) => {
  if (!error) {
    return "We could not send the verification email right now. You can request a new one from the login page.";
  }

  const message = error.message || String(error);
  return `Account created, but the verification email could not be sent right now. ${message}`;
};

const ensureProfile = async (user) => {
  if (user.role === "student") {
    await Student.findOneAndUpdate(
      { userId: user._id },
      {
        $setOnInsert: {
          userId: user._id,
          name: user.name,
          email: user.email,
          skills: []
        }
      },
      { upsert: true, returnDocument: "after" }
    );
  }

  if (user.role === "company") {
    await Company.findOneAndUpdate(
      { userId: user._id },
      {
        $setOnInsert: {
          userId: user._id,
          name: user.name,
          email: user.email,
          active: true
        }
      },
      { upsert: true, returnDocument: "after" }
    );
  }
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!name || !normalizedEmail || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password, and role are required"
      });
    }

    if (!GMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please use a valid Gmail address"
      });
    }

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role selected"
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const { token, tokenHash, expires } = createVerificationToken();

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role,
      isEmailVerified: false,
      emailVerificationToken: tokenHash,
      emailVerificationExpires: expires
    });

    let emailWarning = null;

    try {
      await sendUserVerificationEmail(user, token);
    } catch (emailError) {
      emailWarning = getEmailWarningMessage(emailError);
      console.error("Verification email send failed during registration:", {
        message: emailError.message,
        code: emailError.code,
        responseCode: emailError.responseCode,
        response: emailError.response,
        command: emailError.command,
        errno: emailError.errno,
        syscall: emailError.syscall,
        details: emailError.details
      });
    }

    res.status(201).json({
      success: true,
      message: emailWarning || "Registration successful. Please check your email to verify your account before logging in.",
      emailWarning
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });

  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password"
      });
    }

    if (user.isEmailVerified === false) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in"
      });
    }

    await ensureProfile(user);

    res.status(200).json({
      success: true,
      message: "Login Successful",
      token: signToken(user),
      user: sanitizeUser(user)
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name email role isEmailVerified");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Verification token is required"
      });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      emailVerificationToken: tokenHash,
      emailVerificationExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Verification link is invalid or expired"
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();
    await ensureProfile(user);

    res.json({
      success: true,
      message: "Email verified successfully. You can now log in."
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.resendVerification = async (req, res) => {
  try {
    const normalizedEmail = req.body.email?.trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "This email is already verified"
      });
    }

    const { token, tokenHash, expires } = createVerificationToken();
    user.emailVerificationToken = tokenHash;
    user.emailVerificationExpires = expires;
    await user.save();

    try {
      await sendUserVerificationEmail(user, token);
    } catch (emailError) {
      console.error("Verification email resend failed:", {
        message: emailError.message,
        code: emailError.code,
        responseCode: emailError.responseCode,
        response: emailError.response,
        command: emailError.command,
        errno: emailError.errno,
        syscall: emailError.syscall,
        details: emailError.details
      });
      return res.status(200).json({
        success: true,
        message: "Verification token was updated, but the email could not be sent right now. Please try again shortly."
      });
    }

    res.json({
      success: true,
      message: "Verification email sent. Please check your inbox."
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.logout = async (req, res) => {
  res.json({
    success: true,
    message: "Logged out successfully"
  });
};
