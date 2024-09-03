import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Product from '../../../models/productModel';
import User from '../../../models/userModel';
import Review from '../../../models/reviewModel';
import { Document, ObjectId } from 'mongoose';

interface IReview extends Document {
  userId: {
    _id: ObjectId;
    firstName: string;
    lastName: string;
  };
  productId: ObjectId;
  rating: number;
  reviewText: string;
  images: string[];
  createdAt: Date;
  isDeleted: boolean;
}

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

    const seller = await User.findOne({ _id: product.createdBy }).select(
      'firstName lastName'
    );

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Fetch reviews related to the product
    const reviews = await Review.find({
      productId: product._id,
      isDeleted: false,
    })
      .select('rating reviewText images userId createdAt')
      .populate({
        path: 'userId',
        select: 'firstName lastName',
      });

    const category = product.categoryId as any;

    // Helper function to format date
    const formatDate = (date: Date) => {
      return `${date.toLocaleDateString()} `;
    };

    // Structure the response
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
        id: seller._id,
        name: `${seller.firstName} ${seller.lastName}`,
      },
      reviews: reviews.map((review) => ({
        _id: review._id,
        rating: review.rating,
        reviewText: review.reviewText,
        images: review.images,
        user: {
          name: `${(review.userId as any).firstName} ${(review.userId as any).lastName}`,
        },
        createdAt: formatDate(review.createdAt),
      })),
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
