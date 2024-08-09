import { getProductById } from '../controllers/getProduct';
import { getAllProducts } from '../controllers/getAllProducts';
import {
  authenticateUser,
  authorizeUser,
} from '../../../middlewares/authMiddleware';
import express from 'express';
const router = express.Router();

router.get('/get-product', authenticateUser, authorizeUser, getProductById);
router.get(
  '/get-all-products',
  authenticateUser,
  authorizeUser,
  getAllProducts
);

export default router;
