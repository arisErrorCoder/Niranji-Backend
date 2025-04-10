const mongoose = require("mongoose");
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
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
};

// Verify Payment and Save Order
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      shipping,
      billing,
      email,
      userId,
      cart,
      total,
    } = req.body;

    // Validate userId exists and is valid
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid User ID is required"
      });
    }

    // Rest of your validation
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
        userId: new mongoose.Types.ObjectId(userId), // Ensure proper ObjectId
        cart,
        total,
        status: "Paid",
      });

      await order.save();
      // Send emails (with error handling)
      try {
        await sendEmail(email, customOrderId, cart, shipping, total);
        await sendEmail(process.env.ADMIN_EMAIL, customOrderId, cart, shipping, total, true);
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        // Continue even if email fails
      }

      res.json({ 
        success: true, 
        orderId: customOrderId,
        message: "Payment verified and order created successfully"
      });
    } else {
      res.status(400).json({ success: false, message: "Payment verification failed" });
    }
  } catch (error) {
    console.error("Error in verifyPayment:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: error.message 
    });
  }
};

// Enhanced Email Functions
const sendEmail = async (email, orderId, cart, shipping, total, isAdmin = false) => {
  try {
    // Validate inputs
    if (!email || !orderId || !Array.isArray(cart) || !shipping || !total) {
      throw new Error("Invalid email parameters");
    }

    const transporter = nodemailer.createTransport({
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

    const mailOptions = {
      from: `Niranji <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${email}`);
  } catch (error) {
    console.error("Error in sendEmail:", error);
    throw error; // Re-throw to be caught by caller
  }
};

// Robust Email Templates
const customerEmailTemplate = (shipping, orderId, cart, total) => {
  const safeCart = Array.isArray(cart) ? cart : [];
  const safeShipping = shipping || {};
  const safeTotal = total || 0;

  const productDetails = safeCart
    .map((item, index) => {
      const itemName = item?.name || 'Product';
      const size = item?.selectedSize?.size || '';
      const price = item?.selectedSize?.price || 0;
      const quantity = item?.quantity || 0;

      return `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${index + 1}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${itemName} ${size ? `(${size})` : ''}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${quantity}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">₹${price.toFixed(2)}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">₹${(quantity * price).toFixed(2)}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #4CAF50; text-align: center;">Thank You for Your Order!</h2>
      <p>Dear ${safeShipping.name || 'Customer'},</p>
      <p>We are delighted to confirm your order with <strong>Niranji</strong>. Your order has been successfully placed and is being processed.</p>
      
      <h3 style="color: #333;">Order ID: ${orderId}</h3>
      
      <h4 style="color: #4CAF50;">Shipping Details:</h4>
      <p style="background: #f9f9f9; padding: 10px; border-radius: 5px;">
        ${safeShipping.name || ''} <br>
        ${[safeShipping.address, safeShipping.city, safeShipping.state, safeShipping.zip, safeShipping.country]
          .filter(Boolean).join(', ')} <br>
        ${safeShipping.mobile ? `Phone: ${safeShipping.mobile}` : ''}
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
      
      <h3 style="text-align: right; color: #333;">Total Amount: ₹${safeTotal.toFixed(2)}</h3>

      <p style="font-size: 14px; color: #777; margin-top: 20px;">
        If you have any questions, contact us at <a href="mailto:${process.env.SUPPORT_EMAIL}" style="color: #4CAF50;">${process.env.SUPPORT_EMAIL}</a>.
      </p>
    </div>
  `;
};

const adminEmailTemplate = (shipping, email, orderId, cart, total) => {
  const safeCart = Array.isArray(cart) ? cart : [];
  const safeShipping = shipping || {};
  const safeTotal = total || 0;

  const productDetails = safeCart
    .map((item, index) => {
      const itemName = item?.name || 'Product';
      const size = item?.selectedSize?.size || '';
      const price = item?.selectedSize?.price || 0;
      const quantity = item?.quantity || 0;

      return `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">${index + 1}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${itemName} ${size ? `(${size})` : ''}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${quantity}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">₹${price.toFixed(2)}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">₹${(quantity * price).toFixed(2)}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #4CAF50; text-align: center;">New Order Received!</h2>
      <p>Dear Admin,</p>
      
      <h3 style="color: #333;">Order ID: ${orderId}</h3>
      
      <h4 style="color: #4CAF50;">Customer Details:</h4>
      <p style="background: #f9f9f9; padding: 10px; border-radius: 5px;">
        ${safeShipping.name || ''} <br>
        ${[safeShipping.address, safeShipping.city, safeShipping.state, safeShipping.zip, safeShipping.country]
          .filter(Boolean).join(', ')} <br>
        ${safeShipping.mobile ? `Phone: ${safeShipping.mobile}` : ''} <br>
        Email: ${email || 'No email provided'}
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
      
      <h3 style="text-align: right; color: #333;">Total Amount: ₹${safeTotal.toFixed(2)}</h3>

      <p style="font-size: 14px; color: #777; margin-top: 20px;">
        Please process this order. Contact customer at ${email || 'no email'} if needed.
      </p>
    </div>
  `;
};

// Get Orders by User ID
exports.getOrdersByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .lean() // Convert to plain JS objects
      .populate('cart.productId', 'name price images'); // Populate product details

    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ 
      error: "Failed to fetch orders",
      details: error.message 
    });
  }
};