import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Product from '../../../models/productModel';
import Seller from '../../../models/sellerModel';

export const getProductById = async (req: Request, res: Response) => {
  const productId = req.query.id as string;

  if (!productId) {
    return res.status(400).json({ message: 'Product ID is required' });
  }

  if (!mongoose.isValidObjectId(productId)) {
    return res.status(400).json({ message: 'Invalid Product ID' });
  }

  try {
    const product = await Product.findById(productId)
      .populate({
        path: 'categoryId',
        select: 'name description',
      })
      .select(
        'name description MRP sellingPrice quantity discount adminDiscount categoryId isActive isBlocked isDeleted createdBy createdAt updatedAt'
      );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const seller = await Seller.findOne({ userId: product.createdBy }).select(
      'shopName shopDescription shopContactNumber website'
    );

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }
    const category = product.categoryId as any;

    // Structure the response  ,
    const response = {
      _id: product._id,
      name: product.name,
      description: product.description,
      MRP: product.MRP,
      sellingPrice: product.sellingPrice,
      quantity: product.quantity,
      discount: product.discount,
      adminDiscount: product.adminDiscount,
      category: {
        _id: category._id,
        name: category.name,
        description: category.description,
      },
      seller: {
        shopName: seller.shopName,
        shopDescription: seller.shopDescription,
        shopContactNumber: seller.shopContactNumber,
        website: seller.website,
      },
    };

    res.status(200).json({
      message: 'Product fetched successfully',
      product: response,
    });
  } catch (error) {
    console.error('Failed to fetch product:', error);
    res.status(500).json({ message: 'Failed to fetch product', error });
  }
};
