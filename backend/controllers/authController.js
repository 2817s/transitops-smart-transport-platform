const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const db = require("../database/db");

const {
  sendPasswordResetEmail,
} = require("../services/emailService");

const allowedRoles = [
  "Fleet Manager",
  "Dispatcher",
  "Safety Officer",
  "Financial Analyst",
];

const register = (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      confirm_password,
      role,
    } = req.body;

    if (
      !name?.trim() ||
      !email?.trim() ||
      !password ||
      !confirm_password ||
      !role
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, password, confirmation and role are required",
      });
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        normalizedEmail
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid requested role",
      });
    }

    if (password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/\d/.test(password)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 8 characters, uppercase, lowercase and a number",
      });
    }

    const existingUser = db
      .prepare(`
        SELECT id
        FROM users
        WHERE LOWER(email) = ?
      `)
      .get(normalizedEmail);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists",
      });
    }

    const passwordHash = bcrypt.hashSync(
      password,
      10
    );

    const result = db
      .prepare(`
        INSERT INTO users (
          name,
          email,
          phone,
          password_hash,
          role,
          failed_login_attempts,
          is_locked,
          status
        )
        VALUES (?, ?, ?, ?, ?, 0, 0, 'Pending')
      `)
      .run(
        name.trim(),
        normalizedEmail,
        phone?.trim() || null,
        passwordHash,
        role
      );

    const user = db
      .prepare(`
        SELECT
          id,
          name,
          email,
          phone,
          role,
          status,
          created_at
        FROM users
        WHERE id = ?
      `)
      .get(result.lastInsertRowid);

    return res.status(201).json({
      success: true,
      message:
        "Account request submitted successfully. Your account is pending approval.",
      user,
    });
  } catch (error) {
    console.error(
      "Registration error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to create account",
    });
  }
};

const login = (req, res) => {
  try {
    const {
      email,
      password,
      role,
    } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message:
          "Email, password and role are required",
      });
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    const user = db
      .prepare(`
        SELECT *
        FROM users
        WHERE LOWER(email) = ?
      `)
      .get(normalizedEmail);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (user.status === "Pending") {
      return res.status(403).json({
        success: false,
        message:
          "Your account request is pending approval",
      });
    }

    if (user.status !== "Active") {
      return res.status(403).json({
        success: false,
        message: "Your account is not active",
      });
    }

    if (user.is_locked === 1) {
      return res.status(423).json({
        success: false,
        message:
          "Account locked after 5 failed attempts",
      });
    }

    if (user.role !== role) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials or role",
      });
    }

    const validPassword = bcrypt.compareSync(
      password,
      user.password_hash
    );

    if (!validPassword) {
      const failedAttempts =
        Number(user.failed_login_attempts || 0) + 1;

      const shouldLock =
        failedAttempts >= 5 ? 1 : 0;

      db.prepare(`
        UPDATE users
        SET
          failed_login_attempts = ?,
          is_locked = ?
        WHERE id = ?
      `).run(
        failedAttempts,
        shouldLock,
        user.id
      );

      return res.status(401).json({
        success: false,
        message:
          shouldLock === 1
            ? "Account locked after 5 failed attempts"
            : `Invalid credentials. ${
                5 - failedAttempts
              } attempts remaining`,
      });
    }

    db.prepare(`
      UPDATE users
      SET
        failed_login_attempts = 0,
        is_locked = 0
      WHERE id = ?
    `).run(user.id);

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "8h",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || null,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    const user = db
      .prepare(`
        SELECT
          id,
          name,
          email
        FROM users
        WHERE LOWER(email) = ?
      `)
      .get(normalizedEmail);

    const genericMessage =
      "If the account exists, a password reset email has been sent.";

    if (!user) {
      return res.status(200).json({
        success: true,
        message: genericMessage,
      });
    }

    const rawToken = crypto
      .randomBytes(32)
      .toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const expiresAt = new Date(
      Date.now() + 15 * 60 * 1000
    ).toISOString();

    db.prepare(`
      UPDATE users
      SET
        reset_token = ?,
        reset_token_expires = ?
      WHERE id = ?
    `).run(
      hashedToken,
      expiresAt,
      user.id
    );

    const frontendUrl =
      process.env.FRONTEND_URL ||
      "http://localhost:5174";

    const resetUrl =
      `${frontendUrl}/reset-password/${rawToken}`;

    try {
      await sendPasswordResetEmail({
        recipientEmail: user.email,
        recipientName: user.name,
        resetUrl,
      });
    } catch (emailError) {
      /*
        Remove the reset token if email delivery failed.
        This prevents an unused valid token from remaining
        in the database.
      */
      db.prepare(`
        UPDATE users
        SET
          reset_token = NULL,
          reset_token_expires = NULL
        WHERE id = ?
      `).run(user.id);

      console.error(
        "Password reset email error:",
        emailError
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to send the password reset email",
      });
    }

    return res.status(200).json({
      success: true,
      message: genericMessage,
    });
  } catch (error) {
    console.error(
      "Forgot password error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to process password reset request",
    });
  }
};

const resetPassword = (req, res) => {
  try {
    const { token } = req.params;

    const {
      password,
      confirm_password,
    } = req.body;

    if (
      !token ||
      !password ||
      !confirm_password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Reset token, password and confirmation are required",
      });
    }

    if (password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (
      password.length < 8 ||
      !/[A-Z]/.test(password) ||
      !/[a-z]/.test(password) ||
      !/\d/.test(password)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 8 characters, uppercase, lowercase and a number",
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = db
      .prepare(`
        SELECT id
        FROM users
        WHERE reset_token = ?
          AND reset_token_expires > ?
      `)
      .get(
        hashedToken,
        new Date().toISOString()
      );

    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          "Reset token is invalid or has expired",
      });
    }

    const passwordHash = bcrypt.hashSync(
      password,
      10
    );

    db.prepare(`
      UPDATE users
      SET
        password_hash = ?,
        reset_token = NULL,
        reset_token_expires = NULL,
        failed_login_attempts = 0,
        is_locked = 0
      WHERE id = ?
    `).run(
      passwordHash,
      user.id
    );

    return res.status(200).json({
      success: true,
      message:
        "Password reset successfully. You can now sign in.",
    });
  } catch (error) {
    console.error(
      "Reset password error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to reset password",
    });
  }
};

const getProfile = (req, res) => {
  try {
    const user = db
      .prepare(`
        SELECT
          id,
          name,
          email,
          phone,
          role,
          status,
          created_at
        FROM users
        WHERE id = ?
      `)
      .get(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(
      "Profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  getProfile,
};