import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Bundle from '../../../models/bundleProductModel';
import Product from '../../../models/productModel';
import Seller from '../../../models/sellerModel';

export const getBundleById = async (req: Request, res: Response) => {
  const bundleId = req.query.id as string;

  if (!bundleId) {
    return res.status(400).json({ message: 'Bundle ID is required' });
  }

  if (!mongoose.isValidObjectId(bundleId)) {
    return res.status(400).json({ message: 'Invalid Bundle ID' });
  }

  try {
    const bundle = await Bundle.findById(bundleId)
      .populate({
        path: 'products.productId',
        select: 'name MRP sellingPrice discount adminDiscount categoryId',
        populate: {
          path: 'categoryId',
          select: 'name description',
        },
      })
      .select(
        'name description MRP sellingPrice discount adminDiscount products createdBy'
      );

    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    const creatorDetails =
      bundle.createdBy.role === 'seller'
        ? await Seller.findOne({ userId: bundle.createdBy.id }).select(
            'shopName shopDescription shopContactNumber website'
          )
        : null;

    const products = bundle.products.map((bundleProduct: any) => {
      const product = bundleProduct.productId as any;
      return {
        _id: product._id,
        name: product.name,
        MRP: product.MRP,
        sellingPrice: product.sellingPrice,
        quantity: bundleProduct.quantity,
        discount: product.discount,
        adminDiscount: product.adminDiscount,
        category: {
          _id: product.categoryId?._id,
          name: product.categoryId?.name,
          description: product.categoryId?.description,
        },
        seller: creatorDetails
          ? {
              shopName: creatorDetails.shopName,
              shopDescription: creatorDetails.shopDescription,
              shopContactNumber: creatorDetails.shopContactNumber,
              website: creatorDetails.website,
            }
          : null,
      };
    });

    const response = {
      _id: bundle._id,
      name: bundle.name,
      description: bundle.description,
      MRP: bundle.MRP,
      sellingPrice: bundle.sellingPrice,
      discount: bundle.discount,
      adminDiscount: bundle.adminDiscount,
      products,
    };

    res.status(200).json({
      message: 'Bundle fetched successfully',
      bundle: response,
    });
  } catch (error) {
    console.error('Failed to fetch bundle:', error);
    res.status(500).json({ message: 'Failed to fetch bundle', error });
  }
};
