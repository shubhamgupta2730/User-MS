import { Request, Response } from 'express';
import Order from '../../../models/orderModel';
import Cart from '../../../models/cartModel';
import Product from '../../../models/productModel';
import Bundle from '../../../models/bundleProductModel';
import User from '../../../models/userModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role: 'user';
  };
}

interface IAddress {
  addressLine1: string;
  addressLine2?: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

const placeOrder = async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { productId, bundleId, paymentMethod, shippingAddress } = req.body;

    if ((!productId && !bundleId) || (productId && bundleId)) {
      return res.status(400).json({
        message: 'Provide either productId or bundleId, but not both.',
      });
    }

    const validPaymentMethods = ['credit_card', 'debit_card', 'UPI', 'COD'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        message: `Invalid payment method. Allowed methods are: ${validPaymentMethods.join(', ')}`,
      });
    }

    const [cart, user] = await Promise.all([
      Cart.findOne({ userId }),
      User.findById(userId),
    ]);

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const orderItems = [];

    let cartItem = null;
    if (productId) {
      const product = await Product.findById(productId);
      if (!product) {
        return res
          .status(404)
          .json({ message: `Product with ID ${productId} not found` });
      }
      if (!product.isActive || product.isBlocked || product.isDeleted) {
        return res.status(400).json({
          message: `Product with ID ${productId} is not available for purchase`,
        });
      }

      // Check if the product is in the cart
      cartItem = cart.items.find(
        (item) => item.productId?.toString() === productId
      );
      const quantity = cartItem ? cartItem.quantity : 1;
      if (product.quantity < quantity) {
        return res.status(400).json({
          message: `Insufficient quantity for product ID ${productId}`,
        });
      }

      orderItems.push({
        productId: productId,
        quantity: quantity,
        price: product.sellingPrice * quantity,
      });
    } else if (bundleId) {
      const bundle = await Bundle.findById(bundleId);
      if (!bundle) {
        return res
          .status(404)
          .json({ message: `Bundle with ID ${bundleId} not found` });
      }

      // Check if the bundle is in the cart
      cartItem = cart.items.find(
        (item) => item.bundleId?.toString() === bundleId
      );
      const quantity = cartItem ? cartItem.quantity : 1;

      orderItems.push({
        bundleId: bundleId,
        quantity: quantity,
        price: bundle.sellingPrice * quantity,
      });
    }

    for (const item of cart.items) {
      if (
        (productId && item.productId?.toString() === productId) ||
        (bundleId && item.bundleId?.toString() === bundleId)
      ) {
        continue; // Skip if already added from req.body
      }

      if (item.productId) {
        const product = await Product.findById(item.productId);
        if (!product) {
          return res
            .status(404)
            .json({ message: `Product with ID ${item.productId} not found` });
        }
        if (!product.isActive || product.isBlocked || product.isDeleted) {
          return res.status(400).json({
            message: `Product with ID ${item.productId} is not available for purchase`,
          });
        }
        if (product.quantity < item.quantity) {
          return res.status(400).json({
            message: `Insufficient quantity for product ID ${item.productId}`,
          });
        }
        orderItems.push({
          productId: item.productId,
          quantity: item.quantity,
          price: product.sellingPrice * item.quantity,
        });
      } else if (item.bundleId) {
        const bundle = await Bundle.findById(item.bundleId);
        if (!bundle) {
          return res
            .status(404)
            .json({ message: `Bundle with ID ${item.bundleId} not found` });
        }
        orderItems.push({
          bundleId: item.bundleId,
          quantity: item.quantity,
          price: bundle.sellingPrice * item.quantity,
        });
      }
    }

    if (orderItems.length === 0) {
      return res
        .status(400)
        .json({ message: 'No valid items found for the order' });
    }

    // Use provided shipping address or user's address
    const orderShippingAddress: IAddress = shippingAddress || {
      addressLine1: '',
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    };

    // Add the shipping address to the user's address array if provided
    if (shippingAddress) {
      const addressExists = user.address.some(
        (addr: IAddress) =>
          addr.addressLine1 === shippingAddress.addressLine1 &&
          addr.street === shippingAddress.street &&
          addr.city === shippingAddress.city &&
          addr.state === shippingAddress.state &&
          addr.postalCode === shippingAddress.postalCode &&
          addr.country === shippingAddress.country
      );

      if (!addressExists) {
        user.address.push(shippingAddress);
        await user.save();
      }
    }

    // Calculate total amount
    const totalAmount = orderItems.reduce(
      (total, item) => total + item.price,
      0
    );

    // Create order
    const order = new Order({
      userId,
      items: orderItems,
      totalAmount,
      status: 'pending',
      paymentStatus: 'unpaid',
      paymentMethod,
      shippingAddress: orderShippingAddress,
    });

    await order.save();

    // Clear the cart after placing the order
    await Cart.findOneAndUpdate({ userId }, { $set: { items: [] } });

    res.status(201).json({ message: 'Order placed successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error });
  }
};

export default placeOrder;
