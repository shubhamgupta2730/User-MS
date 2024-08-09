import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Cart from '../../../models/cartModel';
import Product from '../../../models/productModel';
import Bundle from '../../../models/bundleProductModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role: 'user';
  };
}

export const addToCart = async (req: CustomRequest, res: Response) => {
  const userId = req.user?.userId;
  const { productId, bundleId, quantity } = req.body;

  if (!quantity || quantity < 1) {
    return res.status(400).json({ message: 'Quantity must be at least 1.' });
  }

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
      // If no cart exists, create a new one
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

      if (existingProduct) {
        existingProduct.quantity += quantity;
      } else {
        // Add new product to cart
        cart.items.push({ productId, quantity });
      }
    }

    // Process bundle addition
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

      if (existingBundle) {
        // Update quantity if bundle already exists in the cart
        existingBundle.quantity += quantity;
      } else {
        // Add new bundle to cart
        cart.items.push({ bundleId, quantity });
      }
    }

    cart.updatedAt = new Date();
    await cart.save();

    res.status(200).json({ message: 'Item added to cart successfully.', cart });
  } catch (error) {
    console.error('Failed to add item to cart:', error);
    res.status(500).json({ message: 'Failed to add item to cart.', error });
  }
};
