import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Order, { IOrder } from '../../../models/orderModel'; // Updated to use Order model
import Cart from '../../../models/cartModel';
import Product, { IProduct } from '../../../models/productModel';
import Bundle from '../../../models/bundleProductModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role: 'user';
  };
}

const buyNow = async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { productId, bundleId } = req.body;

    // Validate that only one of productId or bundleId is provided
    if ((!productId && !bundleId) || (productId && bundleId)) {
      return res.status(400).json({
        message: 'Provide either productId or bundleId, but not both.',
      });
    }

    // Validate ObjectId format for productId
    if (productId && !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid productId format' });
    }

    // Validate ObjectId format for bundleId
    if (bundleId && !mongoose.Types.ObjectId.isValid(bundleId)) {
      return res.status(400).json({ message: 'Invalid bundleId format' });
    }

    const cart = await Cart.findOne({ userId });

    const orderItems: any[] = []; // Define the type according to your actual data structure

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

      if (cart) {
        // Check if the product is in the cart and remove it
        const cartItem = cart.items.find(
          (item) => item.productId?.toString() === productId
        );
        if (cartItem) {
          await Cart.updateOne({ userId }, { $pull: { items: { productId } } });
        }
      }

      // Add product details to orderItems array
      orderItems.push({
        productId: product._id,
        name: product.name,
        quantity: 1, // Default quantity
        price: product.sellingPrice,
        MRP: product.MRP,
      });
    } else if (bundleId) {
      const bundle = await Bundle.findById(bundleId).populate({
        path: 'products.productId',
        model: Product,
      });

      if (!bundle) {
        return res
          .status(404)
          .json({ message: `Bundle with ID ${bundleId} not found` });
      }

      if (cart) {
        // Check if the bundle is in the cart and remove it
        const cartItem = cart.items.find(
          (item) => item.bundleId?.toString() === bundleId
        );
        if (cartItem) {
          await Cart.updateOne({ userId }, { $pull: { items: { bundleId } } });
        }
      }

      // Add bundle and its products to orderItems array
      const productsInBundle = bundle.products.map((product) => {
        const prod = product.productId as unknown as IProduct;
        return {
          productId: prod._id,
          name: prod.name,
          price: prod.sellingPrice,
          MRP: prod.MRP,
        };
      });

      orderItems.push({
        bundleId: bundle._id,
        name: bundle.name,
        quantity: 1, // Default quantity
        price: bundle.sellingPrice,
        MRP: bundle.MRP,
        products: productsInBundle,
      });
    }

    if (orderItems.length === 0) {
      return res
        .status(400)
        .json({ message: 'No valid item found to add to the order' });
    }

    // Create and save the Order with a single item
    const order = new Order({
      userId,
      items: orderItems, // Use 'items' field instead of 'item'
      totalAmount: orderItems.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      ),
      status: 'pending',
      paymentStatus: 'unpaid',
      createdAt: new Date(),
      updatedAt: new Date(),
      orderDate: new Date(),
    });
    await order.save();

    // Send only the essential details in the response
    const { _id, items, totalAmount } = order.toObject() as IOrder; // Convert document to plain object
    res.status(200).json({
      message: 'Item added successfully',
      order: {
        id: _id,
        items, // Return 'items' instead of 'item'
        totalAmount,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error });
  }
};

export default buyNow;
