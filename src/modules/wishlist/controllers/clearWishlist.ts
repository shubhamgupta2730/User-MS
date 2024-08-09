import { Request, Response } from 'express';
import Wishlist from '../../../models/wishlistModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role: 'user';
  };
}

export const clearWishlist = async (req: CustomRequest, res: Response) => {
  const userId = req.user?.userId;

  try {
    const wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      return res.status(404).json({ message: 'Wishlist not found.' });
    }

    // Clear all items from the wishlist
    wishlist.items = [];

    wishlist.updatedAt = new Date();
    await wishlist.save();

    res.status(200).json({ message: 'Wishlist cleared successfully.' });
  } catch (error) {
    console.error('Failed to clear wishlist:', error);
    res.status(500).json({ message: 'Failed to clear wishlist.', error });
  }
};
