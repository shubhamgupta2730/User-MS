import { Request, Response } from 'express';
import Category from '../../../models/categoryModel';
import Product from '../../../models/productModel';
import Bundle from '../../../models/bundleProductModel';
import { SortOrder } from 'mongoose';

export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const {
      search,
      sortBy = 'name',
      order = 'asc',
      limit = 10,
      page = 1,
    } = req.query;

    const filter: any = {};
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const sortOrder = order === 'desc' ? -1 : 1;
    const sortOptions = { [sortBy as string]: sortOrder } as {
      [key: string]: SortOrder;
    };

    const pageNumber = parseInt(page as string, 10) || 1;
    const pageSize = parseInt(limit as string, 10) || 10;
    const skip = (pageNumber - 1) * pageSize;

    const categories = await Category.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize)
      .lean();

    const totalCategories = await Category.countDocuments(filter);

    const populatedCategories = await Promise.all(
      categories.map(async (category) => {
        const products = await Product.find({
          categoryId: category._id,
          isActive: true,
          isDeleted: false,
          isBlocked: false,
        }).select('name description MRP sellingPrice discount adminDiscount');

        const bundles = await Bundle.find({
          'products.productId': { $in: products.map((product) => product._id) },
          isActive: true,
          isDeleted: false,
          isBlocked: false,
        }).select('name description MRP sellingPrice discount adminDiscount');

        return {
          _id: category._id,
          name: category.name,
          description: category.description,
          products,
          bundles,
        };
      })
    );

    res.status(200).json({
      message: 'Categories fetched successfully',
      categories: populatedCategories,
      totalCategories,
      totalPages: Math.ceil(totalCategories / pageSize),
      currentPage: pageNumber,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch categories', error });
  }
};
