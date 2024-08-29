import { Request, Response } from 'express';
import Stripe from 'stripe';
import Order from '../../../models/orderModel';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-06-20',
});

const refundWebhookHandler = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    const error = err as Error;
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  if (event.type === 'refund.created' || event.type === 'refund.updated') {
    const refund = event.data.object as Stripe.Refund;
    const orderId = refund.metadata?.orderId;

    // Fetch the order from the database
    const order = await Order.findById(orderId);

    if (order) {
      // Update the order based on the refund event
      if (event.type === 'refund.created') {
        order.refundStatus = 'requested';
        order.refundAmount = (refund.amount / 100) as number; 
        order.refundDate = new Date(refund.created * 1000); 
        // Optionally store refund reason if available
        if (refund.reason) {
          order.refundReason = refund.reason;
        }
      } else if (event.type === 'refund.updated') {
        if (refund.status === 'succeeded') {
          order.refundStatus = 'completed';
        } else if (refund.status === 'failed') {
          order.refundStatus = 'failed';
        }
        // Update refund amount and date if needed
        if (order.refundStatus !== 'failed') {
          order.refundAmount = (refund.amount / 100) as number;
          order.refundDate = new Date(refund.created * 1000);
        }
      }

      await order.save();
    }
  }


  res.json({ received: true });
};

export default refundWebhookHandler;
