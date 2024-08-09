import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Bundle from '../../../models/bundleProductModel';
import Product from '../../../models/productModel';
import Seller from '../../../models/sellerModel';

export const getAllBundles = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) || 'desc';
    const search = (req.query.search as string) || '';

    const searchFilter = search
      ? { name: { $regex: search, $options: 'i' } }
      : {};

    const sortOptions: { [key: string]: 1 | -1 } = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    // Fetch bundles with pagination, sorting, and filtering
    const bundles = await Bundle.find(searchFilter)
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
      )
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit);

    const totalBundles = await Bundle.countDocuments(searchFilter);

    const response = await Promise.all(
      bundles.map(async (bundle) => {
        const products = await Promise.all(
          bundle.products.map(async (bundleProduct: any) => {
            const product = bundleProduct.productId as any;

            const sellerDetails =
              bundle.createdBy.role === 'seller'
                ? await Seller.findOne({ userId: bundle.createdBy.id }).select(
                    'shopName shopDescription shopContactNumber website'
                  )
                : null;

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
              seller: sellerDetails
                ? {
                    shopName: sellerDetails.shopName,
                    shopDescription: sellerDetails.shopDescription,
                    shopContactNumber: sellerDetails.shopContactNumber,
                    website: sellerDetails.website,
                  }
                : null,
            };
          })
        );

        return {
          _id: bundle._id,
          name: bundle.name,
          description: bundle.description,
          MRP: bundle.MRP,
          sellingPrice: bundle.sellingPrice,
          discount: bundle.discount,
          adminDiscount: bundle.adminDiscount,
          products,
        };
      })
    );

    res.status(200).json({
      message: 'Bundles fetched successfully',
      bundles: response,
      totalBundles,
      currentPage: page,
      totalPages: Math.ceil(totalBundles / limit),
    });
  } catch (error) {
    console.error('Failed to fetch bundles:', error);
    res.status(500).json({ message: 'Failed to fetch bundles', error });
  }
};
