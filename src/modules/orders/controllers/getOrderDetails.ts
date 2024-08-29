import { Request, Response } from 'express';
import Order from '../../../models/orderModel';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role: 'user';
  };
}

const getOrderDetails = async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { orderId } = req.query;

    if (!orderId || typeof orderId !== 'string') {
      return res.status(400).json({ message: 'Invalid or missing orderId' });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.status(200).json({ order });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error });
  }
};

export default getOrderDetails;
