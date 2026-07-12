const db = require("../database/db");

const getPendingUsers = (req, res) => {
  try {
    const users = db
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
        WHERE status = 'Pending'
        ORDER BY id DESC
      `)
      .all();

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Pending users error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load pending users",
    });
  }
};

const updateUserStatus = (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { status } = req.body;

    const allowedStatuses = ["Active", "Rejected"];

    if (!userId || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid user and status are required",
      });
    }

    const user = db
      .prepare(`
        SELECT id, name, email, role, status
        FROM users
        WHERE id = ?
      `)
      .get(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User request not found",
      });
    }

    db.prepare(`
      UPDATE users
      SET status = ?
      WHERE id = ?
    `).run(status, userId);

    const updatedUser = db
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
      .get(userId);

    return res.status(200).json({
      success: true,
      message:
        status === "Active"
          ? "Account approved successfully"
          : "Account request rejected",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update user status error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update account request",
    });
  }
};

module.exports = {
  getPendingUsers,
  updateUserStatus,
};