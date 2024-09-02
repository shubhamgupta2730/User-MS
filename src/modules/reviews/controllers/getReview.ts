import { Request, Response } from 'express';
import Review from '../../../models/reviewModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role: 'user';
  };
}

const getReview = async (req: CustomRequest, res: Response) => {
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

    // Find the review and ensure it belongs to the user and is not soft-deleted
    const review = await Review.findOne({
      _id: reviewId,
      userId: userId,
      isDeleted: false,
    });

    if (!review) {
      return res.status(404).json({
        message: 'Review not found or has been deleted',
      });
    }

    // Return the review details
    res.status(200).json({ review });
  } catch (error) {
    const err = error as Error;
    res
      .status(500)
      .json({ message: 'Internal Server Error', error: err.message });
  }
};

export default getReview;
