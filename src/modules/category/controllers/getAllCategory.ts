import { Request, Response } from 'express';
import Category from '../../../models/categoryModel';
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

    // Fetch categories with pagination, sorting, and filtering
    const categories = await Category.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize)
      .lean();

    // Count total categories based on the filter
    const totalCategories = await Category.countDocuments(filter);

    // Format the response
    const formattedCategories = categories.map((category) => ({
      _id: category._id,
      name: category.name,
      description: category.description,
    }));

    res.status(200).json({
      message: 'Categories fetched successfully',
      categories: formattedCategories,
      totalCategories,
      totalPages: Math.ceil(totalCategories / pageSize),
      currentPage: pageNumber,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch categories', error });
  }
};
