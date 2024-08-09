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

export const removeFromCart = async (req: CustomRequest, res: Response) => {
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
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found for user.' });
    }

    if (productId) {
      if (!mongoose.isValidObjectId(productId)) {
        return res.status(400).json({ message: 'Invalid product ID.' });
      }

      const productIndex = cart.items.findIndex((item) =>
        item.productId?.equals(productId)
      );

      if (productIndex === -1) {
        return res.status(404).json({ message: 'Product not found in cart.' });
      }

      // Remove product from cart
      cart.items.splice(productIndex, 1);
    }

    if (bundleId) {
      if (!mongoose.isValidObjectId(bundleId)) {
        return res.status(400).json({ message: 'Invalid bundle ID.' });
      }

      const bundleIndex = cart.items.findIndex((item) =>
        item.bundleId?.equals(bundleId)
      );

      if (bundleIndex === -1) {
        return res.status(404).json({ message: 'Bundle not found in cart.' });
      }

      // Remove bundle from cart
      cart.items.splice(bundleIndex, 1);
    }

    cart.updatedAt = new Date();
    await cart.save();

    res
      .status(200)
      .json({ message: 'Item removed from cart successfully.', cart });
  } catch (error) {
    console.error('Failed to remove item from cart:', error);
    res
      .status(500)
      .json({ message: 'Failed to remove item from cart.', error });
  }
};
