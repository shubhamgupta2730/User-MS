import {
  authenticateUser,
  authorizeUser,
} from '../../../middlewares/authMiddleware';
import { getHotDeals } from '../controllers/hotDeals';
import express from 'express';
const router = express.Router();

router.get('/get-hot-deals', authenticateUser, authorizeUser, getHotDeals);
export default router;
