const nodemailer = require("nodemailer");

async function sendEmailHandler(req, res) {
  const { to, subject, html } = req.body;

  if (!to || !subject || !html) {
    return res.status(400).json({ error: "Missing required fields (to, subject, html)" });
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM_EMAIL, SMTP_FROM_NAME } = process.env;

  if (!SMTP_USER || !SMTP_PASSWORD) {
    console.error("[Email] SMTP credentials not configured");
    return res.status(500).json({ error: "SMTP not configured" });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT == 465, 
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: `"${SMTP_FROM_NAME}" <${SMTP_FROM_EMAIL}>`,
      to,
      subject,
      html,
    });

    console.log(`[Email] Sent to ${to}: ${subject} (MessageId: ${info.messageId})`);
    res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error("[Email] Failed to send email:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
}

module.exports = {
  sendEmailHandler,
};
