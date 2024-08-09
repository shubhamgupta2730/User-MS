import { addToCart } from '../controllers/addToCart';
import { removeFromCart } from '../controllers/removeFromCart';
import { clearCart } from '../controllers/removeAllItems';
import { getCartItems } from '../controllers/getCartItems';
import { updateCartItems } from '../controllers/updateCartItems';

import express from 'express';
import {
  authenticateUser,
  authorizeUser,
} from '../../../middlewares/authMiddleware';
const router = express.Router();

router.post('/add-to-cart', authenticateUser, authorizeUser, addToCart);
router.post(
  '/remove-from-cart',
  authenticateUser,
  authorizeUser,
  removeFromCart
);
router.post('/clear-cart', authenticateUser, authorizeUser, clearCart);
router.get('/get-cart-items', authenticateUser, authorizeUser, getCartItems);
router.put(
  '/update-cart-items',
  authenticateUser,
  authorizeUser,
  updateCartItems
);
export default router;
