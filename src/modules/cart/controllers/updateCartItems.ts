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

// Helper function to calculate the total price
const calculateTotalPrice = async (cart: any): Promise<number> => {
  let totalPrice = 0;

  for (const item of cart.items) {
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

export const updateCartItems = async (req: CustomRequest, res: Response) => {
  const userId = req.user?.userId;
  const { productId, bundleId, quantity } = req.body;

  // Validate that either productId or bundleId is provided, but not both
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
    // Find the user's cart
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found for user.' });
    }

    let itemUpdated = false;

    // Update quantity for the product if productId is provided
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
        existingProduct.quantity = quantity;
        itemUpdated = true;
      } else {
        return res.status(404).json({ message: 'Product not found in cart.' });
      }
    }

    // Update quantity for the bundle if bundleId is provided
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
        existingBundle.quantity = quantity;
        itemUpdated = true;
      } else {
        return res.status(404).json({ message: 'Bundle not found in cart.' });
      }
    }

    if (!itemUpdated) {
      return res.status(400).json({ message: 'No items were updated.' });
    }

    // Calculate the new total price of the cart
    cart.totalPrice = await calculateTotalPrice(cart);
    cart.updatedAt = new Date();

    // Save the cart with the updated information
    await cart.save();

    res.status(200).json({ message: 'Cart items updated successfully.', cart });
  } catch (error) {
    console.error('Failed to update cart items:', error);
    res.status(500).json({ message: 'Failed to update cart items.', error });
  }
};
