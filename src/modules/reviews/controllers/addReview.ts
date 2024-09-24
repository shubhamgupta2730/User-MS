import { Request, Response } from 'express';
import Review from '../../../models/reviewModel';
import Order from '../../../models/orderModel';
import multer from 'multer';
import { v2 as cloudinaryV2 } from 'cloudinary';

// Configure Cloudinary
cloudinaryV2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Custom request interface
interface CustomRequest extends Request {
  user?: {
    userId: string;
    role: 'user';
  };
}

// Set up multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(), // Use memory storage for uploading directly to Cloudinary
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
}).array('images', 5); // Limit to 5 images

const addReview = async (req: CustomRequest, res: Response) => {
  upload(req, res, async (err) => {
    try {
      if (err) {
        return res.status(400).json({ message: 'Image upload failed', error: err.message });
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
      if ((!productId && !bundleId) || (productId && bundleId)) {
        return res.status(400).json({
          message: 'Provide either productId or bundleId, but not both.',
        });
      }
      if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be a number between 1 and 5' });
      }

      // Find the order and validate user ownership
      const order = await Order.findById(orderId);
      if (!order || order.userId.toString() !== userId) {
        return res.status(404).json({ message: 'Order not found or unauthorized' });
      }

      // Check if the order status is 'delivered'
      if (order.status !== 'delivered') {
        return res.status(400).json({ message: 'Review can only be added for delivered orders' });
      }

      // Validate the productId or bundleId against the items in the order
      let isValidItem = false;
      if (productId) {
        isValidItem = order.items.some((item) => item.productId?.toString() === productId);
        if (!isValidItem) {
          return res.status(400).json({ message: 'Product not found in order items' });
        }
      }

      if (bundleId) {
        isValidItem = order.items.some((item) => item.bundleId?.toString() === bundleId);
        if (!isValidItem) {
          return res.status(400).json({ message: 'Bundle not found in order items' });
        }
      }

      // Upload images to Cloudinary and get their URLs
      const uploadPromises = (req.files as Express.Multer.File[]).map((file) => {
        return new Promise<string>((resolve, reject) => {
          const stream = cloudinaryV2.uploader.upload_stream(
            { folder: 'reviews' },
            (error, result) => {
              if (error) {
                return reject(new Error('Image upload failed: ' + error.message));
              }
              if (result?.secure_url) {
                return resolve(result.secure_url); // Return the image URL
              }
              return reject(new Error('Image upload failed: result is undefined'));
            }
          );

          stream.end(file.buffer); // Pipe the file buffer to Cloudinary
        });
      });

      // Resolve all image upload promises
      const imageUrls = await Promise.all(uploadPromises);

      // Create a new review
      const review = new Review({
        userId,
        orderId,
        productId: productId || undefined,
        bundleId: bundleId || undefined,
        rating,
        reviewText: reviewText || '',
        images: imageUrls, // Use Cloudinary image URLs
      });

      // Save the review to the database
      await review.save();

      res.status(201).json({ message: 'Review added successfully', review });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
  });
};

export default addReview;
