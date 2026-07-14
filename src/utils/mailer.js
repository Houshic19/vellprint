const nodemailer = require('nodemailer');

// Use Ethereal for testing if no real SMTP provided
const getTransporter = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Generate test SMTP service account from ethereal.email
    let testAccount = await nodemailer.createTestAccount();
    console.log(`[MAILER] Using Ethereal test account: ${testAccount.user}`);
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, 
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
};

const sendEmail = async ({ to, subject, html }) => {
  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: '"Vell Print Technology" <admin@vellprint.in>', // sender address
      to: to, // list of receivers
      subject: subject, // Subject line
      html: html, // html body
    });

    console.log("[MAILER] Message sent: %s", info.messageId);
    if (info.messageId && !process.env.SMTP_HOST) {
      console.log("[MAILER] Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
    return true;
  } catch (error) {
    console.error("[MAILER] Error sending email: ", error);
    return false;
  }
};

module.exports = {
  sendEmail
};
