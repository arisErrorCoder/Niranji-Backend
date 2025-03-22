const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../models/Order");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Generate Unique Order ID (Format: NIRTHAT-DDMMYYYY-XXXX)
const generateOrderId = () => {
  const date = new Date();
  const ddmmyyyy = `${date.getDate()}${date.getMonth() + 1}${date.getFullYear()}`;
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `NIRANJI-${ddmmyyyy}-${randomNum}`;
};

// Create Order
exports.createOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
    });

    res.json({ id: order.id, amount, orderId: order.id });
  } catch (error) {
    res.status(500).json({ error: "Failed to create order" });
  }
};

// Verify Payment and Save Order
exports.verifyPayment = async (req, res) => {
  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    shipping,
    billing,
    email,
    cart,
    total,
  } = req.body;
  const secret = process.env.RAZORPAY_KEY_SECRET;

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
  const generatedSignature = hmac.digest("hex");

  if (generatedSignature === razorpay_signature) {
    const customOrderId = generateOrderId();

    const order = new Order({
      orderId: customOrderId,
      paymentId: razorpay_payment_id,
      shipping,
      billing,
      email,
      cart,
      total,
      status: "Paid",
    });

    await order.save();
    sendEmail(email, customOrderId, cart, shipping, total);
    sendEmail(process.env.ADMIN_EMAIL, customOrderId, cart, shipping, total, true); // Send to admin

    res.json({ success: true, orderId: customOrderId });
  } else {
    res.status(400).json({ success: false, message: "Payment verification failed" });
  }
};

// Send Email Function
const sendEmail = async (email, orderId, cart, shipping, total, isAdmin = false) => {
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const subject = isAdmin
    ? `New Order Received: ${orderId}`
    : `Order Confirmation - ${orderId}`;

  const htmlContent = isAdmin
    ? adminEmailTemplate(shipping, email, orderId, cart, total)
    : customerEmailTemplate(shipping, orderId, cart, total);

  let mailOptions = {
    from: `Niranji <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject,
    html: htmlContent,
  };

  await transporter.sendMail(mailOptions);
};

const customerEmailTemplate = (shipping, orderId, cart, total) => {
  const productDetails = cart
    .map(
      (item, index) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${index + 1}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.name} (${item.selectedSize.size})</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.quantity}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">₹${item.selectedSize.price}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">₹${item.quantity * item.selectedSize.price}</td>
      </tr>`
    )
    .join("");

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #4CAF50; text-align: center;">Thank You for Your Order!</h2>
      <p>Dear ${shipping.name},</p>
      <p>We are delighted to confirm your order with <strong>Niranji</strong>. Your order has been successfully placed and is being processed. Below are the details of your purchase:</p>
      
      <h3 style="color: #333;">Order ID: ${orderId}</h3>
      
      <h4 style="color: #4CAF50;">Shipping Details:</h4>
      <p style="background: #f9f9f9; padding: 10px; border-radius: 5px;">
        ${shipping.name} <br>
        ${shipping.address}, ${shipping.city}, ${shipping.state}, ${shipping.zip}, ${shipping.country} <br>
        Phone: ${shipping.mobile}
      </p>

      <h4 style="color: #4CAF50;">Order Summary:</h4>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <thead>
          <tr style="background: #4CAF50; color: white;">
            <th style="padding: 10px; border: 1px solid #ddd;">#</th>
            <th style="padding: 10px; border: 1px solid #ddd;">Product</th>
            <th style="padding: 10px; border: 1px solid #ddd;">Qty</th>
            <th style="padding: 10px; border: 1px solid #ddd;">Price</th>
            <th style="padding: 10px; border: 1px solid #ddd;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${productDetails}
        </tbody>
      </table>
      
      <h3 style="text-align: right; color: #333;">Total Amount: ₹${total}</h3>

      <p style="font-size: 14px; color: #777; margin-top: 20px;">
        If you have any questions or need further assistance, feel free to contact us at <a href="mailto:${process.env.SUPPORT_EMAIL}" style="color: #4CAF50;">${process.env.SUPPORT_EMAIL}</a>.
      </p>
      
      <p style="text-align: center; color: #555; margin-top: 20px;">
        Thank you for shopping with us! We look forward to serving you again.
      </p>
    </div>
  `;
};

const adminEmailTemplate = (shipping, orderId, cart, total) => {
  const productDetails = cart
    .map(
      (item, index) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${index + 1}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.name} (${item.selectedSize.size})</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.quantity}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">₹${item.selectedSize.price}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">₹${item.quantity * item.selectedSize.price}</td>
      </tr>`
    )
    .join("");

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #4CAF50; text-align: center;">New Order Received!</h2>
      <p>Dear Admin,</p>
      <p>A new order has been placed on <strong>Niranji</strong>. Below are the details:</p>
      
      <h3 style="color: #333;">Order ID: ${orderId}</h3>
      
      <h4 style="color: #4CAF50;">Customer Details:</h4>
      <p style="background: #f9f9f9; padding: 10px; border-radius: 5px;">
        ${shipping.name} <br>
        ${shipping.address}, ${shipping.city}, ${shipping.state}, ${shipping.zip}, ${shipping.country} <br>
        Phone: ${shipping.mobile} <br>
        Email: ${email}
      </p>

      <h4 style="color: #4CAF50;">Order Summary:</h4>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <thead>
          <tr style="background: #4CAF50; color: white;">
            <th style="padding: 10px; border: 1px solid #ddd;">#</th>
            <th style="padding: 10px; border: 1px solid #ddd;">Product</th>
            <th style="padding: 10px; border: 1px solid #ddd;">Qty</th>
            <th style="padding: 10px; border: 1px solid #ddd;">Price</th>
            <th style="padding: 10px; border: 1px solid #ddd;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${productDetails}
        </tbody>
      </table>
      
      <h3 style="text-align: right; color: #333;">Total Amount: ₹${total}</h3>

      <p style="font-size: 14px; color: #777; margin-top: 20px;">
        Please process the order and ensure timely delivery. For any issues, contact the customer at <a href="mailto:${shipping.email}" style="color: #4CAF50;">${shipping.email}</a>.
      </p>
      
      <p style="text-align: center; color: #555; margin-top: 20px;">
        Thank you for using Niranji's admin portal.
      </p>
    </div>
  `;
};