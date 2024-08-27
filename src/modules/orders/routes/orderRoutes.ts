import placeOrder from '../controllers/placeOrder';
import getOrderDetails from '../controllers/getOrderDetails';
import { getAllOrders } from '../controllers/getAllOrders';
import express from 'express';
import {
  authenticateUser,
  authorizeUser,
} from '../../../middlewares/authMiddleware';
const router = express.Router();
router.post('/place-order', authenticateUser, authorizeUser, placeOrder);
router.get(
  '/get-order-details',
  authenticateUser,
  authorizeUser,
  getOrderDetails
);
router.get('/get-all-orders', authenticateUser, authorizeUser, getAllOrders);
export default router;
