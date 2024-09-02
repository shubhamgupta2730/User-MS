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

const addReview = async (req: CustomRequest, res: Response) => {
  upload(req, res, async (err) => {
    try {
      if (err) {
        return res 
          .status(500)
          .json({ message: 'Image upload failed', error: err.message });
      }

      const { orderId, productId, bundleId, rating, reviewText } = req.body;
      const userId = req.user?.userId;

      // Validate inputs
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      if (!orderId) {
        return res.status(400).json({ message: 'Order ID is required' });
      }
    // Validate that only one of productId or bundleId is provided
    if ((!productId && !bundleId) || (productId && bundleId)) {
      return res.status(400).json({
        message: 'Provide either productId or bundleId, but not both.',
      });
    }
      if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
        return res
          .status(400)
          .json({ message: 'Rating must be a number between 1 and 5' });
      }

      // Find the order and validate user ownership
      const order = await Order.findById(orderId);
      if (!order || order.userId.toString() !== userId) {
        return res
          .status(404)
          .json({ message: 'Order not found or unauthorized' });
      }

      // Check if the order status is 'delivered'
      if (order.status !== 'delivered') {
        return res
          .status(400)
          .json({ message: 'Review can only be added for delivered orders' });
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

      // Save images to local system and get their paths
      const images = req.files
        ? (req.files as Express.Multer.File[]).map((file) => file.path)
        : [];

      // Create a new review
      const review = new Review({
        userId,
        orderId,
        productId: productId || undefined,
        bundleId: bundleId || undefined,
        rating,
        reviewText: reviewText || '',
        images,
      });

      // Save the review to the database
      await review.save();

      res.status(201).json({ message: 'Review added successfully', review });
    } catch (error) {
      const err = error as Error;
      res
        .status(500)
        .json({ message: 'Internal Server Error', error: err.message });
    }
  });
};

export default addReview;
