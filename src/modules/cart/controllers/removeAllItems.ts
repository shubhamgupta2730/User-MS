import { Request, Response } from 'express';
import Cart from '../../../models/cartModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role: 'user';
  };
}

export const clearCart = async (req: CustomRequest, res: Response) => {
  const userId = req.user?.userId;

  try {
    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found for user.' });
    }

    // Clear all items from the cart
    cart.items = [];
    cart.updatedAt = new Date();

    await cart.save();

    res
      .status(200)
      .json({ message: 'All items removed from cart successfully.', cart });
  } catch (error) {
    console.error('Failed to clear cart:', error);
    res.status(500).json({ message: 'Failed to clear cart.', error });
  }
};
