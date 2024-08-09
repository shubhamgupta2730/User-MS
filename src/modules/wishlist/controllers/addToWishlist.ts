import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Wishlist from '../../../models/wishlistModel';
import Product from '../../../models/productModel';
import Bundle from '../../../models/bundleProductModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role: 'user';
  };
}

export const addToWishlist = async (req: CustomRequest, res: Response) => {
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
    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      wishlist = new Wishlist({ userId, items: [] });
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
      }).select('name description');

      if (!product) {
        return res
          .status(404)
          .json({ message: 'Product not found or inactive.' });
      }

      const existingProduct = wishlist.items.find((item) =>
        item.productId?.equals(productId)
      );

      if (existingProduct) {
        return res
          .status(400)
          .json({ message: 'Product already in wishlist.' });
      } else {
        wishlist.items.push({ productId });
      }

      res.status(200).json({
        message: 'Product added to wishlist successfully.',
        item: {
          productId: product._id,
          name: product.name,
          description: product.description,
        },
      });
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
      }).select('name description');

      if (!bundle) {
        return res
          .status(404)
          .json({ message: 'Bundle not found or inactive.' });
      }

      const existingBundle = wishlist.items.find((item) =>
        item.bundleId?.equals(bundleId)
      );

      if (existingBundle) {
        return res.status(400).json({ message: 'Bundle already in wishlist.' });
      } else {
        wishlist.items.push({ bundleId });
      }

      res.status(200).json({
        message: 'Bundle added to wishlist successfully.',
        item: {
          bundleId: bundle._id,
          name: bundle.name,
          description: bundle.description,
        },
      });
    }

    wishlist.updatedAt = new Date();
    await wishlist.save();
  } catch (error) {
    console.error('Failed to add item to wishlist:', error);
    res.status(500).json({ message: 'Failed to add item to wishlist.', error });
  }
};
