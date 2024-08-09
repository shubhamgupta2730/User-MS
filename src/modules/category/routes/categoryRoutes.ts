import { getCategory } from '../controllers/getCategory';
import { getAllCategories } from '../controllers/getAllCategory';
import {
  authenticateUser,
  authorizeUser,
} from '../../../middlewares/authMiddleware';
import express from 'express';
const router = express.Router();

router.get('/get-category', authenticateUser, authorizeUser, getCategory);
router.get(
  '/get-all-categories',
  authenticateUser,
  authorizeUser,
  getAllCategories
);

export default router;
