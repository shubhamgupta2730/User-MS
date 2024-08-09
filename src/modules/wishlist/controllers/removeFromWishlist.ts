import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Wishlist from '../../../models/wishlistModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role: 'user';
  };
}

export const removeFromWishlist = async (req: CustomRequest, res: Response) => {
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
    const wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      return res.status(404).json({ message: 'Wishlist not found.' });
    }

    let itemRemoved = false;

    if (productId) {
      if (!mongoose.isValidObjectId(productId)) {
        return res.status(400).json({ message: 'Invalid product ID.' });
      }

      const initialLength = wishlist.items.length;
      wishlist.items = wishlist.items.filter(
        (item) => !item.productId?.equals(productId)
      );

      itemRemoved = wishlist.items.length < initialLength;
    }

    if (bundleId) {
      if (!mongoose.isValidObjectId(bundleId)) {
        return res.status(400).json({ message: 'Invalid bundle ID.' });
      }

      const initialLength = wishlist.items.length;
      wishlist.items = wishlist.items.filter(
        (item) => !item.bundleId?.equals(bundleId)
      );

      itemRemoved = wishlist.items.length < initialLength;
    }

    if (!itemRemoved) {
      return res.status(404).json({
        message: 'Item not found in wishlist.',
      });
    }

    wishlist.updatedAt = new Date();
    await wishlist.save();

    res.status(200).json({
      message: 'Item removed from wishlist successfully.',
    });
  } catch (error) {
    console.error('Failed to remove item from wishlist:', error);
    res
      .status(500)
      .json({ message: 'Failed to remove item from wishlist.', error });
  }
};
