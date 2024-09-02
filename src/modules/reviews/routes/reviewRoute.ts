import addReview from '../controllers/addReview';
import deleteReview from '../controllers/deleteReview';
import getReview from '../controllers/getReview';
import express from 'express';
import {
  authenticateUser,
  authorizeUser,
} from '../../../middlewares/authMiddleware';
const router = express.Router();
router.post('/add-review', authenticateUser, authorizeUser, addReview);
router.delete('/delete-review', authenticateUser, authorizeUser, deleteReview);
router.get('/get-review', authenticateUser, authorizeUser, getReview);
export default router;
