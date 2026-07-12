const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const db = require("../database/db");

const login = (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Email, password and role are required"
      });
    }

    const user = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(email.trim().toLowerCase());

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    if (user.status !== "Active") {
      return res.status(403).json({
        success: false,
        message: "Account is inactive"
      });
    }

    if (user.is_locked === 1) {
      return res.status(423).json({
        success: false,
        message: "Account locked after 5 failed attempts"
      });
    }

    if (user.role !== role) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials or role"
      });
    }

    const passwordIsValid = bcrypt.compareSync(
      password,
      user.password_hash
    );

    if (!passwordIsValid) {
      const failedAttempts = user.failed_login_attempts + 1;
      const shouldLock = failedAttempts >= 5 ? 1 : 0;

      db.prepare(`
        UPDATE users
        SET failed_login_attempts = ?,
            is_locked = ?
        WHERE id = ?
      `).run(failedAttempts, shouldLock, user.id);

      return res.status(401).json({
        success: false,
        message:
          shouldLock === 1
            ? "Account locked after 5 failed attempts"
            : `Invalid credentials. ${
                5 - failedAttempts
              } attempts remaining`
      });
    }

    db.prepare(`
      UPDATE users
      SET failed_login_attempts = 0,
          is_locked = 0
      WHERE id = ?
    `).run(user.id);

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "8h"
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
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

const getProfile = (req, res) => {
  try {
    const user = db
      .prepare(`
        SELECT id, name, email, role, status, created_at
        FROM users
        WHERE id = ?
      `)
      .get(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error("Profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

module.exports = {
  login,
  getProfile
};