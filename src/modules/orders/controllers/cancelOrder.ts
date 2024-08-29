import { Request, Response } from 'express';
import Order from '../../../models/orderModel';
import Product from '../../../models/productModel';
import { sendEmail } from '../../../utils/sendMail';
import Stripe from 'stripe';
import User from '../../../models/userModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role: 'user';
  };
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-06-20',
});

const cancelOrder = async (req: CustomRequest, res: Response) => {
  try {
    const { orderId } = req.query;
    const userId = req.user?.userId;
    const { refundReason } = req.body;

    // Validate inputs
    if (!orderId || typeof orderId !== 'string') {
      return res.status(400).json({ message: 'Invalid order ID' });
    }

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (
      !refundReason ||
      typeof refundReason !== 'string' ||
      refundReason.trim().length === 0
    ) {
      return res.status(400).json({ message: 'Refund reason is required' });
    }

    // Retrieve the order
    const order = await Order.findById(orderId)
      .populate('items.productId')
      .populate('items.bundleId');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    const user = await User.findById(userId);
    const userMail = user?.email;

    // Check if the order belongs to the current user
    if (order.userId.toString() !== userId) {
      return res
        .status(403)
        .json({ message: 'You are not authorized to cancel this order' });
    }

    // Check if the order can be canceled
    if (order.status !== 'pending' && order.status !== 'processing') {
      return res.status(400).json({ message: 'Order cannot be canceled' });
    }

    // Update order status and refund reason
    order.status = 'cancelled';
    order.refundStatus = 'requested';
    order.refundReason = refundReason; // Store the refund reason

    // Process refund if applicable
    if (order.paymentStatus === 'paid' && order.paymentMethod === 'Card') {
      try {
        const refund = await stripe.refunds.create({
          payment_intent: order.stripePaymentIntentId,
          amount: Math.round(order.totalAmount * 100), // amount in cents
        });

        if (refund.status !== 'succeeded') {
          return res.status(500).json({ message: 'Refund failed' });
        }

        order.refundStatus = 'completed';
        order.refundAmount = order.totalAmount;
        order.refundDate = new Date();
      } catch (error) {
        order.refundStatus = 'failed';
        return res
          .status(500)
          .json({ message: 'Refund process failed', error });
      }
    }

    // Restore product quantities
    for (const item of order.items) {
      if (item.productId) {
        const product = await Product.findById(item.productId);
        if (product) {
          product.quantity += item.quantity;
          await product.save();
        }
      }
    }

    // Send cancellation email to the user
    const emailSubject = 'Order Cancellation';
    const emailHtml = `
      <p>Dear ${(order.userId as any).firstName},</p>
      <p>Your order <strong>#${order._id}</strong> has been successfully canceled.</p>
      <p>Order Details:</p>
      <ul>
        ${order.items
          .map(
            (item) => `
              <li>${item.productId ? (item.productId as any).name : 'Bundle'} - 
              Quantity: ${item.quantity}, 
              Price: Rs ${item.price}</li>`
          )
          .join('')}
      </ul>
      <p>Total Amount: Rs ${order.totalAmount}</p>
      <p>Refund Status: ${order.refundStatus}</p>
      <p>Refund Reason: ${order.refundReason}</p>
      <p>Thank you for shopping with us!</p>
      <p>Best regards,<br>E-Commerce Platform</p>
    `;

    await sendEmail(userMail as string, emailSubject, emailHtml);

    // Save the updated order
    await order.save();

    res.status(200).json({ message: 'Order canceled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error });
  }
};

export default cancelOrder;
