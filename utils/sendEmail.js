const transporter = require("./emailTransporter");

module.exports = async function sendEmail({ to, subject, text }) {
  return transporter.sendMail({
    from: `"Wahu Store" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text
  });
};

