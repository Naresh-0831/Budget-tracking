const nodemailer = require("nodemailer");
require("dotenv").config();

(async () => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_USER,
                pass: (process.env.GMAIL_APP_PASSWORD || "").replace(/\s/g, ""),
            },
        });

        const info = await transporter.sendMail({
            from: process.env.GMAIL_USER,
            to: process.env.GMAIL_USER, // send to yourself
            subject: "SmartBudget Gmail Test",
            text: "✅ If you received this, Gmail SMTP is working.",
        });

        console.log("✅ Mail sent:", info.response);
    } catch (err) {
        console.log("❌ Mail error:", err.message);
        console.log(err);
    }
})();
