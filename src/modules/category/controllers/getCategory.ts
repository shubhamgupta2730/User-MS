import { Request, Response } from 'express';
import Category from '../../../models/categoryModel';
import Product from '../../../models/productModel';
import Bundle from '../../../models/bundleProductModel';
import { Types } from 'mongoose';

export const getCategory = async (req: Request, res: Response) => {
  const categoryId = req.query.id as string;

  if (!Types.ObjectId.isValid(categoryId)) {
    return res.status(400).json({ message: 'Invalid category ID' });
  }

  try {
    const category = await Category.findById(categoryId);

    if (!category || !category.isActive) {
      return res
        .status(404)
        .json({ message: 'Category not found or inactive' });
    }

    const products = await Product.find(
      {
        categoryId: categoryId,
        isActive: true,
        isDeleted: false,
        isBlocked: false,
      },
      '_id name description MRP sellingPrice discount adminDiscount quantity'
    );

    const bundles = await Bundle.find(
      { isActive: true, isDeleted: false, isBlocked: false },
      '_id name description MRP sellingPrice discount adminDiscount products'
    );

    return res.status(200).json({
      categoryName: category.name,
      categoryDescription: category.description,
      products,
      bundles,
    });
  } catch (error) {
    console.error('Error fetching products by category ID:', error);
    return res
      .status(500)
      .json({ message: 'Failed to fetch products and bundles', error });
  }
};
