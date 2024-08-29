import { Request, Response } from 'express';
import Stripe from 'stripe';
import Order from '../../../models/orderModel';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-06-20',
});

const webhookHandler = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

  // Log raw request body for debugging
  //  console.log('Raw body:', req.body);

  let event: Stripe.Event;

  try {
    // Construct the Stripe event from the raw body and signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    console.log('Event constructed successfully:', event);
  } catch (err) {
    const error = err as Error;
    console.error('Webhook Error:', error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const orderId = paymentIntent.metadata.orderId;

  console.log('Payment Intent received:', paymentIntent);
  console.log('Order ID:', orderId);

  const order = await Order.findById(orderId);

  if (!order) {
    console.error('Order not found:', orderId);
    return res.status(404).json({ message: 'Order not found' });
  }

  console.log('Order before update:', order);

  switch (event.type) {
    case 'payment_intent.succeeded':
      order.paymentStatus = 'paid';
      order.status = 'processing';
      break;

    case 'payment_intent.payment_failed':
      order.paymentStatus = 'failed';
      order.status = 'failed';
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  await order.save();

  console.log('Order after update:', order);

  res.json({ received: true });
};

export default webhookHandler;
