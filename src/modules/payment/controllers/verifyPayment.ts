import { Request, Response } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import Order from '../../../models/orderModel';

const verifyPayment = async (req: Request, res: Response) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } =
      req.body;

    // Validate input
    if (!razorpayOrderId || typeof razorpayOrderId !== 'string') {
      return res.status(400).json({ message: 'Invalid razorpayOrderId' });
    }
    if (!razorpayPaymentId || typeof razorpayPaymentId !== 'string') {
      return res.status(400).json({ message: 'Invalid razorpayPaymentId' });
    }
    if (!razorpaySignature || typeof razorpaySignature !== 'string') {
      return res.status(400).json({ message: 'Invalid razorpaySignature' });
    }
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: 'Invalid orderId format' });
    }

    // Generate the signature to verify payment
    const generatedSignature = crypto
      .createHmac('sha256', process.env.KEY_SECRET as string)
      .update(razorpayOrderId + '|' + razorpayPaymentId)
      .digest('hex');

    // Verify the signature
    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({ message: 'Invalid signature' });
    }

    // Find the order by ID
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if the order has already been paid
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Order already paid' });
    }

    // Update the order's payment status to 'paid' and order status to 'processing'
    order.paymentStatus = 'paid';
    order.status = 'processing';
    await order.save();

    res.status(200).json({
      message: 'Payment verified successfully',
      orderId: order._id,
      paymentStatus: order.paymentStatus,
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error });
  }
};

export default verifyPayment;
