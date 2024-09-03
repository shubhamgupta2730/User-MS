import { Request, Response } from 'express';
import Review from '../../../models/reviewModel';
import Order from '../../../models/orderModel';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role: 'user';
  };
}

// Set up Multer for local image storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../../uploads/reviewImages');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage }).array('images', 5);

const updateReview = async (req: CustomRequest, res: Response) => {
  upload(req, res, async (err) => {
    try {
      if (err) {
        return res
          .status(500)
          .json({ message: 'Image upload failed', error: err.message });
      }

      const { reviewId } = req.query;
      const { rating, reviewText, productId, bundleId, images } = req.body;
      const userId = req.user?.userId;

      // Validate input data
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      if (!reviewId) {
        return res.status(400).json({ message: 'Review ID is required' });
      }

      // Find the review
      const review = await Review.findById(reviewId);
      if (!review || review.isDeleted) {
        return res
          .status(404)
          .json({ message: 'Review not found or already deleted' });
      }

      // Validate that the user owns the review
      if (review.userId.toString() !== userId) {
        return res.status(403).json({ message: 'Forbidden: Not your review' });
      }

      // Validate that the associated order is delivered
      const order = await Order.findById(review.orderId);
      if (!order || order.status !== 'delivered') {
        return res
          .status(400)
          .json({ message: 'Review can only be updated for delivered orders' });
      }

      // Validate that only one of productId or bundleId is provided
      if ((!productId && !bundleId) || (productId && bundleId)) {
        return res.status(400).json({
          message: 'Provide either productId or bundleId, but not both.',
        });
      }

      // Validate the rating
      if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
        return res
          .status(400)
          .json({ message: 'Rating must be a number between 1 and 5' });
      }

      // Validate the productId or bundleId against the items in the order
      let isValidItem = false;
      if (productId) {
        isValidItem = order.items.some(
          (item) => item.productId?.toString() === productId
        );
        if (!isValidItem) {
          return res
            .status(400)
            .json({ message: 'Product not found in order items' });
        }
      }

      if (bundleId) {
        isValidItem = order.items.some(
          (item) => item.bundleId?.toString() === bundleId
        );
        if (!isValidItem) {
          return res
            .status(400)
            .json({ message: 'Bundle not found in order items' });
        }
      }

      // Update images if new ones are provided
      let updatedImages = review.images; // Keep existing images
      if (Array.isArray(images) && images.length > 0) {
        // If images are provided in req.body, use them
        updatedImages = images;
      } else if (Array.isArray(req.files) && req.files.length > 0) {
        // Delete old images from the file system
        if (updatedImages && updatedImages.length > 0) {
          updatedImages.forEach((imagePath) => {
            const fullPath = path.join(__dirname, '../../../', imagePath);
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
            }
          });
        }
        // Save new image paths
        updatedImages = req.files.map((file) => file.path);
      }

      // Update the review fields
      review.rating = rating;
      review.reviewText = reviewText || review.reviewText;
      review.images = updatedImages;
      review.productId = productId || review.productId;
      review.bundleId = bundleId || review.bundleId;

      // Save the updated review
      await review.save();

      res.status(200).json({ message: 'Review updated successfully', review });
    } catch (error) {
      const err = error as Error;
      res
        .status(500)
        .json({ message: 'Internal Server Error', error: err.message });
    }
  });
};

export default updateReview;
