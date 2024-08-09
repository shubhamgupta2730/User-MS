import { addToWishlist } from '../controllers/addToWishlist';
import { removeFromWishlist } from '../controllers/removeFromWishlist';
import { clearWishlist } from '../controllers/clearWishlist';
import { getWishlistItems } from '../controllers/getWishlistItems';
import { moveItemFromWishlistToCart } from '../controllers/moveToCartFromWishlist';
import express from 'express';
import {
  authenticateUser,
  authorizeUser,
} from '../../../middlewares/authMiddleware';
const router = express.Router();

router.post('/add-to-wishlist', authenticateUser, authorizeUser, addToWishlist);
router.delete(
  '/remove-from-wishlist',
  authenticateUser,
  authorizeUser,
  removeFromWishlist
);
router.delete(
  '/clear-wishlist',
  authenticateUser,
  authorizeUser,
  clearWishlist
);
router.get('/get-wishlist', authenticateUser, authorizeUser, getWishlistItems);
router.post(
  '/move-to-cart',
  authenticateUser,
  authorizeUser,
  moveItemFromWishlistToCart
);
export default router;
