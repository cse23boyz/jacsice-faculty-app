import nodemailer from "nodemailer";

export async function getGmailTransporter() {
  try {
    const transporter465 = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      logger: true,
      debug: true,
    });

    await transporter465.verify();
    console.log("✅ Gmail connected via port 465 (SSL)");
    return transporter465;
  } catch (err465) {
    console.error("⚠️ Port 465 failed, trying port 587...", err465);

    const transporter587 = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: { rejectUnauthorized: false },
      logger: true,
      debug: true,
    });

    await transporter587.verify();
    console.log("✅ Gmail connected via port 587 (STARTTLS)");
    return transporter587;
  }
}
