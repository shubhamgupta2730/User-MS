import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Bundle from '../../../models/bundleProductModel';

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
      .select('name description MRP sellingPrice discount adminDiscount')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit);

    const totalBundles = await Bundle.countDocuments(searchFilter);

    // Prepare the response with only bundle details
    const response = bundles.map((bundle) => ({
      _id: bundle._id,
      name: bundle.name,
      description: bundle.description,
      MRP: bundle.MRP,
      sellingPrice: bundle.sellingPrice,
      discount: bundle.discount,
      adminDiscount: bundle.adminDiscount,
    }));

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
