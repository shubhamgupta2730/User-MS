import { Request, Response } from 'express';
import Product from '../../../models/productModel';

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const page = (req.query.page as string) || '1';
    const limit = (req.query.limit as string) || '10';
    const search = (req.query.search as string) || '';
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) || 'desc';

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const sortOptions: { [key: string]: 1 | -1 } = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const searchFilter = search
      ? { name: { $regex: search, $options: 'i' } }
      : {};

    const products = await Product.find(searchFilter)
      .populate({
        path: 'categoryId',
        select: 'name',
      })
      .sort(sortOptions)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .select('name MRP sellingPrice categoryId');

    const totalProducts = await Product.countDocuments(searchFilter);

    const response = products.map((product) => {
      const category = product.categoryId as any;

      return {
        _id: product._id,
        name: product.name,
        MRP: product.MRP,
        sellingPrice: product.sellingPrice,
        category: {
          _id: category._id,
          name: category.name,
        },
      };
    });

    res.status(200).json({
      message: 'Products fetched successfully',
      products: response,
      totalProducts,
      currentPage: pageNum,
      totalPages: Math.ceil(totalProducts / limitNum),
    });
  } catch (error) {
    console.error('Failed to fetch products:', error);
    res.status(500).json({ message: 'Failed to fetch products', error });
  }
};
