const nodemailer = require("nodemailer");

const emailUser = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_APP_PASSWORD;

if (!emailUser || !emailPassword) {
  console.error(
    "Email configuration missing: EMAIL_USER or EMAIL_APP_PASSWORD"
  );
}

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: emailUser,
    pass: emailPassword,
  },
});

const verifyEmailConnection = async () => {
  await transporter.verify();
  console.log("TransitOps email service is ready.");
};

const sendPasswordResetEmail = async ({
  recipientEmail,
  recipientName,
  resetUrl,
}) => {
  return transporter.sendMail({
    from: `"TransitOps Security" <${emailUser}>`,
    to: recipientEmail,
    subject: "Reset your TransitOps password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: auto; padding: 32px;">
        <h1 style="color:#4f46e5;">TransitOps</h1>

        <h2>Reset your password</h2>

        <p>Hello ${recipientName},</p>

        <p>
          We received a request to reset your TransitOps password.
        </p>

        <a
          href="${resetUrl}"
          style="
            display:inline-block;
            margin:20px 0;
            padding:14px 22px;
            border-radius:10px;
            background:#4f46e5;
            color:white;
            text-decoration:none;
            font-weight:bold;
          "
        >
          Reset Password
        </a>

        <p>This link expires in 15 minutes.</p>

        <p>
          If you did not request this reset, ignore this email.
        </p>
      </div>
    `,
  });
};

module.exports = {
  verifyEmailConnection,
  sendPasswordResetEmail,
};