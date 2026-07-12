require("dotenv").config();

const express = require("express");
const cors = require("cors");

require("./database/db");

const authRoutes = require("./routes/authRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const driverRoutes = require("./routes/driverRoutes");
const tripRoutes = require("./routes/tripRoutes");
const maintenanceRoutes = require("./routes/maintenanceRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const userRoutes = require("./routes/userRoutes");

const {
  verifyEmailConnection,
} = require("./services/emailService");

const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message:
      "TransitOps Smart Transport Operations Platform API",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "TransitOps API is running",
  });
});

app.use("/api/auth", authRoutes);

app.use("/api/vehicles", vehicleRoutes);

app.use("/api/drivers", driverRoutes);

app.use("/api/trips", tripRoutes);

app.use("/api/maintenance", maintenanceRoutes);

app.use("/api/costs", expenseRoutes);

app.use("/api/analytics", analyticsRoutes);

app.use("/api/settings", settingsRoutes);

app.use("/api/dashboard", dashboardRoutes);

app.use("/api/users", userRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.listen(PORT, () => {
  console.log(
    `TransitOps backend running on http://localhost:${PORT}`
  );

  verifyEmailConnection()
    .then(() => {
      console.log(
        "TransitOps password recovery email service is ready."
      );
    })
    .catch((error) => {
      console.error(
        "Email service verification failed:",
        error.message
      );
    });
});