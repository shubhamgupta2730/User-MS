import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Wishlist from '../../../models/wishlistModel';
import Cart from '../../../models/cartModel';
import Product from '../../../models/productModel';
import Bundle from '../../../models/bundleProductModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role: 'user';
  };
}

export const moveItemFromWishlistToCart = async (
  req: CustomRequest,
  res: Response
) => {
  const userId = req.user?.userId;
  const { productId, bundleId } = req.body;

  if (!productId && !bundleId) {
    return res
      .status(400)
      .json({ message: 'Either productId or bundleId must be provided.' });
  }

  if (productId && bundleId) {
    return res.status(400).json({
      message: 'Provide only one of productId or bundleId, not both.',
    });
  }

  try {
    // Step 1: Check if the item exists in the wishlist
    const wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      return res.status(404).json({ message: 'Wishlist not found.' });
    }

    let itemToMove;
    if (productId) {
      itemToMove = wishlist.items.find((item) =>
        item.productId?.equals(productId)
      );
    } else if (bundleId) {
      itemToMove = wishlist.items.find((item) =>
        item.bundleId?.equals(bundleId)
      );
    }

    if (!itemToMove) {
      return res.status(404).json({ message: 'Item not found in wishlist.' });
    }

    // Step 2: Check if a cart exists; if not, create one
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Step 3: Add the item to the cart
    if (productId) {
      const existingProduct = cart.items.find((item) =>
        item.productId?.equals(productId)
      );

      if (existingProduct) {
        existingProduct.quantity += 1;
      } else {
        cart.items.push({ productId, quantity: 1 });
      }
    }

    if (bundleId) {
      const existingBundle = cart.items.find((item) =>
        item.bundleId?.equals(bundleId)
      );

      if (existingBundle) {
        existingBundle.quantity += 1;
      } else {
        cart.items.push({ bundleId, quantity: 1 });
      }
    }

    // Step 4: Remove the item from the wishlist
    wishlist.items = wishlist.items.filter(
      (item) =>
        (productId && !item.productId?.equals(productId)) ||
        (bundleId && !item.bundleId?.equals(bundleId))
    );

    // Save the updated wishlist
    await wishlist.save();

    // Save the updated cart
    await cart.save();

    // Calculate the total price of the cart
    let totalPrice = 0;
    const updatedCart = await Cart.findOne({ userId })
      .populate({
        path: 'items',
        populate: [
          {
            path: 'productId',
            model: 'Product',
            select: 'sellingPrice',
          },
          {
            path: 'bundleId',
            model: 'Bundle',
            select: 'sellingPrice',
          },
        ],
      })
      .lean();

    if (updatedCart) {
      updatedCart.items.forEach((item: any) => {
        const price = item.productId
          ? item.productId.sellingPrice
          : item.bundleId.sellingPrice;

        totalPrice += price * item.quantity;
      });
    }

    res.status(200).json({
      message: 'Item moved from wishlist to cart successfully.',
    });
  } catch (error) {
    console.error('Failed to move item from wishlist to cart:', error);
    res
      .status(500)
      .json({ message: 'Failed to move item from wishlist to cart.', error });
  }
};
