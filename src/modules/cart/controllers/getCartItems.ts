import { Request, Response } from 'express';
import Cart from '../../../models/cartModel';
import Product from '../../../models/productModel';
import Bundle from '../../../models/bundleProductModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role: 'user';
  };
}

export const getCartItems = async (req: CustomRequest, res: Response) => {
  const userId = req.user?.userId;

  try {
    // Fetch the cart with populated productId and bundleId references
    const cart = await Cart.findOne({ userId })
      .populate({
        path: 'items',
        populate: [
          {
            path: 'productId',
            model: 'Product',
            select: 'name description MRP sellingPrice', // Specify fields for Product
          },
          {
            path: 'bundleId',
            model: 'Bundle',
            select: 'name description MRP sellingPrice products', // Specify fields for Bundle
          },
        ],
      })
      .lean(); // Convert Mongoose document to plain JavaScript object

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found for user.' });
    }

    // Aggregate items by type (productId or bundleId)
    const itemMap: { [key: string]: any } = {};

    cart.items.forEach((item: any) => {
      const id = item.productId?._id || item.bundleId?._id;
      if (id) {
        if (!itemMap[id]) {
          itemMap[id] = {
            ...item,
            quantity: 0,
            type: item.productId ? 'product' : 'bundle',
          };
        }
        itemMap[id].quantity += item.quantity;
      }
    });

    // Prepare final items array with aggregated quantities and required fields
    const items = Object.values(itemMap).map((item: any) => {
      if (item.productId) {
        return {
          id: item.productId._id,
          name: item.productId.name,
          description: item.productId.description,
          MRP: item.productId.MRP,
          sellingPrice: item.productId.sellingPrice,
          quantity: item.quantity,
          type: 'product',
        };
      } else if (item.bundleId) {
        return {
          id: item.bundleId._id,
          name: item.bundleId.name,
          description: item.bundleId.description,
          MRP: item.bundleId.MRP,
          sellingPrice: item.bundleId.sellingPrice,
          quantity: item.quantity,
          products: item.bundleId.products.map((product: any) => ({
            productId: product.productId,
            quantity: product.quantity,
          })),
          type: 'bundle',
        };
      }
    });

    res
      .status(200)
      .json({ message: 'Cart items retrieved successfully.', items });
  } catch (error) {
    console.error('Failed to retrieve cart items:', error);
    res.status(500).json({ message: 'Failed to retrieve cart items.', error });
  }
};
