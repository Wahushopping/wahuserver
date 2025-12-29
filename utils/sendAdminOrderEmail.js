const transporter = require("./emailTransporter");

async function sendAdminOrderEmail(order) {
  return transporter.sendMail({
    from: `"Wahu Store" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: "📦 New Order Received",
    text: `
New Order Placed

Order ID: ${order._id}
Payment: ${order.paymentMethod}
Total: ₹${order.total}
Customer Email: ${order.userEmail}
    `
  });
}

module.exports = sendAdminOrderEmail;
