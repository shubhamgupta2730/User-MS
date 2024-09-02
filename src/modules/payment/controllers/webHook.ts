import { Request, Response } from 'express';
import Stripe from 'stripe';
import Order from '../../../models/orderModel';
import Product from '../../../models/productModel'; // Import the Product model
import { sendEmail } from '../../../utils/sendMail';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-06-20',
});

const webhookHandler = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    const error = err as Error;
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const orderId = paymentIntent.metadata.orderId;

  const order = await Order.findById(orderId)
    .populate('userId', 'email firstName')
    .populate('items.productId', 'name quantity')
    .populate('items.bundleId', 'name quantity');

  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      order.paymentStatus = 'paid';
      order.status = 'processing';

      // Update the quantity of each product
      for (const item of order.items) {
        if (item.productId) {
          const product = await Product.findById(item.productId);
          if (!product) {
            console.error(`Product with ID ${item.productId} not found.`);
            continue;
          }
          if (product.quantity < item.quantity) {
            console.error(`Insufficient quantity for product ${product.name}.`);
            // You might want to handle this case (e.g., rollback, notify admin)
            continue;
          }
          product.quantity -= item.quantity; // Deduct the quantity
          await product.save();
        }
      }

      // Construct the items list for the email
      const itemsList = order.items
        .map(
          (item) =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            `Product: ${item.productId ? (item.productId as any).name : (item.bundleId as any)?.name}\nQuantity: ${item.quantity}\nPrice: Rs ${item.price}\n`
        )
        .join('\n');

      // Prepare the email content
      const emailSubject = 'Order Confirmation';
      const emailHtml = `
      <p>Dear ${(order.userId as any).firstName},</p>
      <p>Your order has been placed successfully. Here are the details:</p>
      <p><strong>Order ID:</strong> ${order._id}<br>
      <strong>Total Amount:</strong> Rs ${order.totalAmount}<br>
      <strong>Shipping Address:</strong> ${order.shippingAddress?.addressLine1}, ${order.shippingAddress?.city}, ${order.shippingAddress?.state}, ${order.shippingAddress?.postalCode}, ${order.shippingAddress?.country}</p>
      <p><strong>Items Purchased:</strong></p>
      <ul>
        ${order.items
          .map(
            (item) => `
              <li>${item.productId ? (item.productId as any).name : (item.bundleId as any)?.name} - 
              Quantity: ${item.quantity}, 
              Price: Rs ${item.price}</li>`
          )
          .join('')}
      </ul>
      <p>Your order will be delivered by <strong>${order.deliveryDate?.toDateString()}</strong>.</p>
      <p>Thank you for shopping with us!</p>
      <p>Best regards,<br>E-Commerce Platform</p>
    `;

      // Send the confirmation email to the user
      await sendEmail((order.userId as any).email, emailSubject, emailHtml);
      break;

    case 'payment_intent.payment_failed':
      order.paymentStatus = 'failed';
      order.status = 'failed';
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  await order.save();

  res.json({ received: true });
};

export default webhookHandler;
