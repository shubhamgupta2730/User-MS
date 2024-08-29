import { Request, Response } from 'express';
import Stripe from 'stripe';
import mongoose from 'mongoose';
import Order from '../../../models/orderModel';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-06-20',
});

interface IOrder extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  totalAmount: number;
  paymentStatus: string;
  stripePaymentIntentId?: string;
}

const createPaymentIntent = async (req: Request, res: Response) => {
  try {
    const { orderId, currency, paymentMethodId } = req.body;

    // Validate input
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: 'Invalid orderId format' });
    }
    if (!currency) {
      return res.status(400).json({ message: 'Currency is required' });
    }
    if (!paymentMethodId) {
      return res.status(400).json({ message: 'Payment method ID is required' });
    }

    // Retrieve the order
    const order = (await Order.findById(orderId)) as IOrder;
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.paymentStatus === 'paid') {
      return res
        .status(400)
        .json({ message: 'Payment has already been completed for this order' });
    }

    const amount = order.totalAmount * 100;

    // Create and confirm a PaymentIntent with automatic payment methods
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      payment_method: paymentMethodId, // Attach the payment method ID
      confirm: true, // Confirm the PaymentIntent immediately
      automatic_payment_methods: {
        enabled: true, // Enable automatic payment methods
        allow_redirects: 'never', // Avoid redirects
      },
      metadata: { orderId: order._id.toString() },
    });

    // Save the PaymentIntent ID to the order
    order.stripePaymentIntentId = paymentIntent.id;
    await order.save();

    res.status(200).json({
      message: 'payment initiated to payment gateway',
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error });
  }
};

export default createPaymentIntent;
