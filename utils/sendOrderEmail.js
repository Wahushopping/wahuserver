const transporter = require("./emailTransporter");

async function sendOrderEmail(to, order) {
  const itemsHTML = order.items.map(
    item => `<li>${item.name} × ${item.qty} – ₹${item.price}</li>`
  ).join("");

  return transporter.sendMail({
    from: `"Wahu Store" <${process.env.EMAIL_USER}>`,
    to,
    subject: "✅ Order Confirmed - Wahu Store",
    html: `
      <h2>Thank you for your order!</h2>
      <p><b>Order ID:</b> ${order._id}</p>
      <p><b>Payment:</b> ${order.paymentMethod}</p>

      <h3>Items</h3>
      <ul>${itemsHTML}</ul>

      <p><b>Total:</b> ₹${order.finalAmount}</p>
      <p><b>Delivery Address:</b><br>${order.address.fullAddress}</p>

      <p>Your order will be delivered in 7–9 days.</p>
      <p>❤️ Team Wahu Store</p>
    `
  });
}

module.exports = sendOrderEmail;
