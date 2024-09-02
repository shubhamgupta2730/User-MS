import { Request, Response } from 'express';
import Review from '../../../models/reviewModel';
import Order from '../../../models/orderModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role: 'user';
  };
}

const deleteReview = async (req: CustomRequest, res: Response) => {
  try {
    const { reviewId } = req.query;
    const userId = req.user?.userId;

    // Validate input
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!reviewId) {
      return res.status(400).json({ message: 'Review ID is required' });
    }

    // Find the review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if the review belongs to the logged-in user
    if (review.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Forbidden: Not your review' });
    }

    // Find the associated order
    const order = await Order.findById(review.orderId);
    if (!order || order.userId.toString() !== userId) {
      return res.status(404).json({
        message: 'Order not found or unauthorized access to review',
      });
    }

    // Soft delete the review by setting isDeleted to true
    review.isDeleted = true;
    await review.save();

    res
      .status(200)
      .json({ message: 'Review deleted successfully (soft delete)' });
  } catch (error) {
    const err = error as Error;
    res
      .status(500)
      .json({ message: 'Internal Server Error', error: err.message });
  }
};

export default deleteReview;
