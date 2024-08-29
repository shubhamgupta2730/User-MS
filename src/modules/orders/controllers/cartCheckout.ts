import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Order from '../../../models/orderModel'; // Updated to use Order model
import Cart from '../../../models/cartModel';
import Product, { IProduct } from '../../../models/productModel';
import Bundle from '../../../models/bundleProductModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role: 'user';
  };
}

const cartCheckout = async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Find the user's cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Check if the cart is empty
    if (cart.items.length === 0) {
      return res.status(400).json({
        message: 'Cart is empty. Please add items to the cart first.',
      });
    }

    // Collect all items for the order
    const orderItems = [];
    let totalAmount = 0;

    for (const item of cart.items) {
      if (item.productId) {
        // Handle product
        const product = await Product.findById(item.productId);
        if (!product) {
          continue;
        }

        const itemTotal = product.sellingPrice * item.quantity;

        // Add product details to orderItems array
        orderItems.push({
          productId: product._id,
          name: product.name,
          quantity: item.quantity,
          price: product.sellingPrice,
          MRP: product.MRP,
        });

        totalAmount += itemTotal;
      } else if (item.bundleId) {
        // Handle bundle
        const bundle = await Bundle.findById(item.bundleId).populate({
          path: 'products.productId',
          model: Product,
        });

        if (!bundle) {
          continue;
        }

        const bundleTotal = bundle.sellingPrice * item.quantity;
        const productsInBundle = bundle.products.map((prod) => {
          const product = prod.productId as unknown as IProduct;
          return {
            productId: product._id,
            name: product.name,
            price: product.sellingPrice,
            MRP: product.MRP,
          };
        });

        // Add bundle and products details to orderItems array
        orderItems.push({
          bundleId: bundle._id,
          name: bundle.name,
          quantity: item.quantity,
          price: bundle.sellingPrice,
          MRP: bundle.MRP,
          products: productsInBundle,
        });

        totalAmount += bundleTotal;
      }
    }

    const order = new Order({
      userId,
      items: orderItems,
      totalAmount,
      status: 'pending',
      paymentStatus: 'unpaid',
    });
    await order.save();

    // Remove all items from the cart
    await Cart.updateOne({ userId }, { $set: { items: [] } });

    // Prepare response with only necessary information
    const responseOrder = {
      _id: order._id,
      userId: order.userId,
      totalAmount: order.totalAmount,
      items: order.items.map((item) => ({
        productId: item.productId,
        bundleId: item.bundleId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        MRP: item.MRP,
      })),
    };

    res
      .status(200)
      .json({ message: 'Checkout successful', order: responseOrder });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error });
  }
};

export default cartCheckout;
