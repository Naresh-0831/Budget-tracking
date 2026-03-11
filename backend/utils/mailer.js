const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: (process.env.GMAIL_APP_PASSWORD || "").replace(/\s/g, ""),
  },
});

const sendOtpEmail = async (to, otp) => {
  console.log("Mailer called");
  console.log("Sending from:", process.env.GMAIL_USER);
  console.log("Sending to:", to);
  console.log("OTP:", otp);

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: to,
    subject: "SmartBudget Password Reset OTP",
    html: `
      <h2>Password Reset Request</h2>
      <p>Your OTP for resetting your password is:</p>
      <h1>${otp}</h1>
      <p>This OTP expires in 5 minutes.</p>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log("Mail sent response:", info.response);
  return info;
};

module.exports = { sendOtpEmail };
