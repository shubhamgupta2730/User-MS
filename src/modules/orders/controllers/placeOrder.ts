import { Request, Response } from 'express';
import Stripe from 'stripe';
import Order from '../../../models/orderModel';
import User from '../../../models/userModel';
import { IAddress } from '../../../models/userModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role: 'user';
  };
}

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-06-20',
});

const validateAddress = (address: IAddress) => {
  const { addressLine1, street, city, state, postalCode, country } = address;

  if (
    !addressLine1 ||
    typeof addressLine1 !== 'string' ||
    addressLine1.trim() === ''
  ) {
    return 'Address Line 1 is required and should be a non-empty string';
  }
  if (street && typeof street !== 'string') {
    return 'Street should be a string';
  }
  if (city && typeof city !== 'string') {
    return 'City should be a string';
  }
  if (state && typeof state !== 'string') {
    return 'State should be a string';
  }
  if (postalCode && typeof postalCode !== 'string') {
    return 'Postal Code should be a string';
  }
  if (country && typeof country !== 'string') {
    return 'Country should be a string';
  }

  return null;
};

const placeOrder = async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { shippingAddress, paymentMethod, paymentMethodToken } = req.body;

    // Validate payment method
    if (!['Card', 'COD'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'Invalid payment method' });
    }

    // Validate shipping address
    if (shippingAddress) {
      const validationError = validateAddress(shippingAddress);
      if (validationError) {
        return res.status(400).json({ message: validationError });
      }
    }

    // Retrieve the most recent pending order
    const order = await Order.findOne({ userId, status: 'pending' }).sort({
      createdAt: -1,
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    let paymentMethodId: string | undefined;

    // If the payment method is card, create a PaymentMethod using the token
    if (paymentMethod === 'Card') {
      if (!paymentMethodToken) {
        return res.status(400).json({
          message: 'Payment method token is required for card payments',
        });
      }

      const paymentMethodResponse = await stripe.paymentMethods.create({
        type: 'card',
        card: { token: paymentMethodToken },
        billing_details: {
          name: req.user?.userId, // Example: Use user's ID or retrieve user's name from DB
        },
      });

      paymentMethodId = paymentMethodResponse.id;
    }

    // Handle shipping address
    let addressToUse: IAddress;
    if (shippingAddress) {
      // Retrieve the user and check if the address already exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if the provided address already exists in the user's addresses
      const addressExists = user.address.some(
        (addr) =>
          addr.addressLine1 === shippingAddress.addressLine1 &&
          addr.street === shippingAddress.street &&
          addr.city === shippingAddress.city &&
          addr.state === shippingAddress.state &&
          addr.postalCode === shippingAddress.postalCode &&
          addr.country === shippingAddress.country
      );

      if (!addressExists) {
        // Add the address to the user's addresses if it's new
        await User.updateOne(
          { _id: userId },
          { $push: { address: shippingAddress } }
        );
      }

      addressToUse = shippingAddress;
    } else {
      const user = await User.findById(userId);
      if (!user || user.address.length === 0) {
        return res.status(400).json({ message: 'No address available' });
      }
      addressToUse = user.address[user.address.length - 1];
    }

    order.shippingAddress = addressToUse;
    order.paymentMethod = paymentMethod;

    if (paymentMethodId) {
      order.stripePaymentMethodId = paymentMethodId; // Store PaymentMethod ID
    }

    // If payment method is COD, set the order status to 'processing'
    if (paymentMethod === 'COD') {
      order.status = 'processing';
    }

    await order.save();

    res.status(200).json({
      message: 'Order placed successfully',
      order: {
        _id: order._id,
        userId: order.userId,
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        totalAmount: order.totalAmount,
        status: order.status,
        stripePaymentMethodId: paymentMethodId, // Include the PaymentMethod ID in the response
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error });
  }
};

export default placeOrder;
