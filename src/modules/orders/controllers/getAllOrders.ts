import { Request, Response } from 'express';
import Order from '../../../models/orderModel';
import mongoose from 'mongoose';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    role: 'user';
  };
}


const validSortFields = ['createdAt', 'totalAmount', 'status'] as const;
type SortField = (typeof validSortFields)[number];


type SortOrder = -1 | 1;

const getAllOrders = async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }


    const {
      search = '',
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 10,
    } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const sortField = sortBy as SortField; 
    const sortOrder: SortOrder = order === 'desc' ? -1 : 1;


    const pipeline = [
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $match: {
          $or: [
            { 'items.productId': { $regex: search, $options: 'i' } },
            { 'items.bundleId': { $regex: search, $options: 'i' } },
            { status: { $regex: search, $options: 'i' } },
          ],
        },
      },
      { $sort: { [sortField]: sortOrder } },
      { $skip: (pageNumber - 1) * limitNumber },
      { $limit: limitNumber },
      {
        $project: {
          orderId: '$_id',
          userId: 1,
          totalAmount: 1,
          status: 1,
          orderDate: {
            $dateToString: {
              format: '%Y-%m-%d %H:%M:%S',
              date: '$createdAt',
              timezone: 'Asia/Kolkata',
            },
          },
        },
      },
    ];

    const orders = await Order.aggregate(pipeline);

    const totalOrdersPipeline = [
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $match: {
          $or: [
            { 'items.productId': { $regex: search, $options: 'i' } },
            { 'items.bundleId': { $regex: search, $options: 'i' } },
            { status: { $regex: search, $options: 'i' } },
          ],
        },
      },
      { $count: 'totalOrders' },
    ];
    const totalOrdersResult = await Order.aggregate(totalOrdersPipeline);
    const totalOrders = totalOrdersResult[0]?.totalOrders || 0;

    res.status(200).json({
      totalOrders,
      totalPages: Math.ceil(totalOrders / limitNumber),
      currentPage: pageNumber,
      orders,
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error });
  }
};

export { getAllOrders };
