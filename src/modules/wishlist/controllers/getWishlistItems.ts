import { Request, Response } from 'express';
import Wishlist from '../../../models/wishlistModel';
import Product from '../../../models/productModel';
import Bundle from '../../../models/bundleProductModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role: 'user';
  };
}

export const getWishlistItems = async (req: CustomRequest, res: Response) => {
  const userId = req.user?.userId;

  try {
    // Find the wishlist for the user
    const wishlist = await Wishlist.findOne({ userId })
      .populate({
        path: 'items.productId',
        select:
          'name description MRP sellingPrice discount adminDiscount categoryId',
      })
      .populate({
        path: 'items.bundleId',
        select:
          'name description MRP sellingPrice discount adminDiscount products',
        populate: {
          path: 'products.productId',
          select: 'name',
        },
      });

    if (!wishlist || wishlist.items.length === 0) {
      return res
        .status(404)
        .json({ message: 'No items found in the wishlist.' });
    }

    // Transforming the response to include necessary product and bundle details
    const wishlistItems = wishlist.items.map((item) => {
      if (item.productId) {
        const product = item.productId as any;
        return {
          type: 'product',
          productId: product._id,
          name: product.name,
          description: product.description,
          MRP: product.MRP,
          sellingPrice: product.sellingPrice,
          discount: product.discount,
          adminDiscount: product.adminDiscount,
          categoryId: product.categoryId,
        };
      } else if (item.bundleId) {
        const bundle = item.bundleId as any;
        return {
          type: 'bundle',
          bundleId: bundle._id,
          name: bundle.name,
          description: bundle.description,
          MRP: bundle.MRP,
          sellingPrice: bundle.sellingPrice,
          discount: bundle.discount,
          adminDiscount: bundle.adminDiscount,
          products: bundle.products.map((prod: any) => ({
            productId: prod.productId._id,
            name: prod.productId.name,
            quantity: prod.quantity,
          })),
        };
      }
    });

    res.status(200).json({ wishlistItems });
  } catch (error) {
    console.error('Failed to retrieve wishlist items:', error);
    res
      .status(500)
      .json({ message: 'Failed to retrieve wishlist items.', error });
  }
};
