import {
  authenticateUser,
  authorizeUser,
} from '../../../middlewares/authMiddleware';
import { getHotDeals } from '../controllers/hotDeals';
import { getSale } from '../controllers/getSale';
import express from 'express';
const router = express.Router();

router.get('/get-hot-deals', authenticateUser, authorizeUser, getHotDeals);
router.get('/get-sale', authenticateUser, authorizeUser, getSale);
export default router;
