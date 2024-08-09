import { Request, Response } from 'express';
import Product from '../../../models/productModel';
import Seller from '../../../models/sellerModel';

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
        select: 'name description',
      })
      .sort(sortOptions)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .select(
        'name description MRP sellingPrice quantity discount adminDiscount categoryId sellerId isActive isBlocked isDeleted createdBy createdAt updatedAt'
      );

    const totalProducts = await Product.countDocuments(searchFilter);

    const response = await Promise.all(
      products.map(async (product) => {
        const category = product.categoryId as any;

        // Fetch the seller details from the Seller model using sellerId
        const seller = await Seller.findOne({
          userId: product.sellerId,
        }).select('shopName shopDescription shopContactNumber website');

        return {
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
          seller: seller
            ? {
                shopName: seller.shopName,
                shopDescription: seller.shopDescription,
                shopContactNumber: seller.shopContactNumber,
                website: seller.website,
              }
            : null,
        };
      })
    );

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
