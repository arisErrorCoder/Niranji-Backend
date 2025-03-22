const Order = require("../models/Order");

// Get All Orders by User ID
exports.getOrdersByUserId = async (req, res) => {
  try {
    const { userId } = req.params; // Assuming userId is passed as a parameter

    // Fetch orders where the shipping or billing email matches the user's email
    const orders = await Order.find({
      $or: [{ "shipping.email": userId }, { "billing.email": userId }],
    });

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No orders found for this user." });
    }

    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Failed to fetch orders." });
  }
};

// Update Order Status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params; // Order ID to update
    const { status } = req.body; // New status to set

    // Validate the status
    const validStatuses = ["Pending", "Paid", "Shipped", "Delivered", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status." });
    }

    // Find the order and update its status
    const updatedOrder = await Order.findOneAndUpdate(
      { orderId }, // Filter by orderId
      { status }, // Update status
      { new: true } // Return the updated document
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found." });
    }

    res.status(200).json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Failed to update order status." });
  }
};