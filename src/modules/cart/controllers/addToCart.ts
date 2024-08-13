import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Cart from '../../../models/cartModel';
import Product from '../../../models/productModel';
import Bundle from '../../../models/bundleProductModel';

// Define the CartItem interface
interface CartItem {
  productId?: mongoose.Types.ObjectId;
  bundleId?: mongoose.Types.ObjectId;
  quantity: number;
}

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role: 'user';
  };
}

export const addToCart = async (req: CustomRequest, res: Response) => {
  const userId = req.user?.userId;
  const { productId, bundleId } = req.body;

  if (!productId && !bundleId) {
    return res.status(400).json({
      message: 'Either productId or bundleId must be provided.',
    });
  }

  if (productId && bundleId) {
    return res.status(400).json({
      message: 'Provide only one of productId or bundleId, not both.',
    });
  }

  try {
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    if (productId) {
      if (!mongoose.isValidObjectId(productId)) {
        return res.status(400).json({ message: 'Invalid product ID.' });
      }

      const product = await Product.findOne({
        _id: productId,
        isActive: true,
        isDeleted: false,
        isBlocked: false,
      });

      if (!product) {
        return res
          .status(404)
          .json({ message: 'Product not found or inactive.' });
      }

      const existingProduct = cart.items.find((item) =>
        item.productId?.equals(productId)
      );

      if (!existingProduct) {
        cart.items.push({ productId, quantity: 1 });
      }
    }

    if (bundleId) {
      if (!mongoose.isValidObjectId(bundleId)) {
        return res.status(400).json({ message: 'Invalid bundle ID.' });
      }

      const bundle = await Bundle.findOne({
        _id: bundleId,
        isActive: true,
        isDeleted: false,
        isBlocked: false,
      });

      if (!bundle) {
        return res
          .status(404)
          .json({ message: 'Bundle not found or inactive.' });
      }

      const existingBundle = cart.items.find((item) =>
        item.bundleId?.equals(bundleId)
      );

      if (!existingBundle) {
        cart.items.push({ bundleId, quantity: 1 });
      }
    }

    cart.updatedAt = new Date();

    // Calculate total price
    const totalPrice = await calculateTotalPrice(cart.items);
    cart.totalPrice = totalPrice;

    await cart.save();

    res.status(200).json({ message: 'Item added to cart successfully.', cart });
  } catch (error) {
    console.error('Failed to add item to cart:', error);
    res.status(500).json({ message: 'Failed to add item to cart.', error });
  }
};

// Helper function to calculate total price
const calculateTotalPrice = async (items: CartItem[]): Promise<number> => {
  let totalPrice = 0;

  for (const item of items) {
    if (item.productId) {
      const product = await Product.findById(item.productId);
      if (product) {
        const price =
          product.sellingPrice > 0 ? product.sellingPrice : product.MRP;
        totalPrice += price * item.quantity;
      }
    } else if (item.bundleId) {
      const bundle = await Bundle.findById(item.bundleId);
      if (bundle) {
        const price =
          bundle.sellingPrice > 0 ? bundle.sellingPrice : bundle.MRP;
        totalPrice += price * item.quantity;
      }
    }
  }

  return totalPrice;
};
